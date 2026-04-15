import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (error) {
    console.error("GET /api/groups/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar grupo." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { name, description, modality, dayOfWeek, time, maxParticipants, price, active } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (modality !== undefined) updateData.modality = modality;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (time !== undefined) updateData.time = time;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (price !== undefined) updateData.price = price !== null ? String(price) : null;
    if (active !== undefined) updateData.active = active;

    const [updated] = await db.update(groups).set(updateData).where(eq(groups.id, id)).returning();
    if (!updated) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/groups/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar grupo." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const [deleted] = await db.delete(groups).where(eq(groups.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Grupo removido." });
  } catch (error) {
    console.error("DELETE /api/groups/[id] error:", error);
    return NextResponse.json({ error: "Erro ao remover grupo." }, { status: 500 });
  }
}
