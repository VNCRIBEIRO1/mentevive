import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/db/schema";
import { resetPasswordSchema, formatZodError } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { eq, and, isNull, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(`reset-pwd:${ip}`, 5, 600_000); // 5 per 10 min
  if (!success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  // Find valid, unused, non-expired token
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!resetToken) {
    return NextResponse.json(
      { error: "Token inválido ou expirado. Solicite uma nova recuperação de senha." },
      { status: 400 }
    );
  }

  // Hash new password and update user
  const hashedPassword = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, resetToken.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return NextResponse.json({ message: "Senha redefinida com sucesso!" });
}
