import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

/**
 * PUT /api/profile
 * Updates the admin's own name and phone.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { name, phone } = await req.json();

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedPhone = typeof phone === "string" ? phone.replace(/[^\d+() -]/g, "").trim() : "";

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json({ error: "Nome é obrigatório (mínimo 2 caracteres)." }, { status: 400 });
    }

    await db
      .update(users)
      .set({ name: trimmedName, phone: trimmedPhone || null, updatedAt: new Date() })
      .where(eq(users.id, auth.session!.user.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil." }, { status: 500 });
  }
}
