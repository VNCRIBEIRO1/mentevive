import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/db/schema";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, emailLayout } from "@/lib/email";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = await rateLimit(`forgot-pwd:${ip}`, 3, 600_000); // 3 per 10 min
  if (!success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    message: "Se o e-mail existir, enviamos um link de recuperação.",
  });

  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) return successResponse;

  // Generate a secure token (64 hex chars)
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log(`[Password Reset] Token generated for ${email}: ${resetUrl}`);
  }

  const html = emailLayout({
    tenantName: "MenteVive",
    bodyHtml: `
      <p>Olá${user.name ? `, <strong>${escapeHtml(user.name)}</strong>` : ""}.</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha — o link expira em 1 hora.</p>
      <p style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#D4A574;color:#3D2B1F;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;font-size:14px;">Redefinir senha</a>
      </p>
      <p style="font-size:13px;color:#6B5445;">Se o botão não funcionar, copie este link no navegador:<br>
        <a href="${resetUrl}" style="color:#0a6158;word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="font-size:13px;color:#7D6E62;margin-top:24px;">Se você não solicitou esta redefinição, pode ignorar este e-mail com segurança.</p>
    `,
  });

  // Fire and forget — never fail the response if email provider is down
  await sendEmail({
    to: email,
    subject: "Redefinir sua senha — MenteVive",
    html,
  });

  return successResponse;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
