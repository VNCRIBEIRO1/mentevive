import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/profile
 * Returns the admin's profile including new directory fields.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        specialty: users.specialty,
        bio: users.bio,
        crp: users.crp,
        profileVisible: users.profileVisible,
      })
      .from(users)
      .where(eq(users.id, auth.session!.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Erro ao carregar perfil." }, { status: 500 });
  }
}

/**
 * PUT /api/profile
 * Updates the admin's own name, phone, and directory fields.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { name, phone, specialty, bio, crp, profileVisible } = await req.json();

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.replace(/[^\d+() -]/g, "").trim() : "";

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json({ error: "Nome é obrigatório (mínimo 2 caracteres)." }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        name: trimmedName,
        phone: trimmedPhone || null,
        ...(typeof specialty === "string" && { specialty: specialty.trim() || null }),
        ...(typeof bio === "string" && { bio: bio.trim() || null }),
        ...(typeof crp === "string" && { crp: crp.trim() || null }),
        ...(typeof profileVisible === "boolean" && { profileVisible }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.session!.user.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil." }, { status: 500 });
  }
}
