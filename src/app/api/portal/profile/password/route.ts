import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { changePasswordSchema, formatZodError } from "@/lib/validations";
import { requireAuth } from "@/lib/api-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.response;

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = auth.session!.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  // Get current user
  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  // Verify current password
  const validPassword = await bcrypt.compare(currentPassword, user.password);
  if (!validPassword) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  // Hash and update
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({ message: "Senha alterada com sucesso!" });
}
