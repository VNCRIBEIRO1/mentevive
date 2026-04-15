import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/db/schema";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(`forgot-pwd:${ip}`, 3, 600_000); // 3 per 10 min
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
    message: "Se o e-mail existir, um token de recuperação foi gerado.",
  });

  const [user] = await db
    .select({ id: users.id })
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

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;
  if (process.env.NODE_ENV === "development") {
    console.log(`[Password Reset] Token generated for ${email}: ${resetUrl}`);
  } else {
    console.warn(`[Password Reset] Token generated for ${email}, but no transactional email provider is configured.`);
  }

  return successResponse;
}
