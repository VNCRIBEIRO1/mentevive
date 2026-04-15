import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupMembers, patients, groups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;

    const members = await db
      .select({
        id: groupMembers.id,
        patientId: groupMembers.patientId,
        patientName: patients.name,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .leftJoin(patients, eq(groupMembers.patientId, patients.id))
      .where(and(eq(groupMembers.tenantId, auth.tenantId!), eq(groupMembers.groupId, id)));

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/groups/[id]/members error:", error);
    return NextResponse.json({ error: "Erro ao buscar membros." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const { patientId } = await req.json();

    if (!patientId) {
      return NextResponse.json({ error: "patientId é obrigatório." }, { status: 400 });
    }

    // Check group exists and get max participants
    const [group] = await db.select().from(groups).where(and(eq(groups.tenantId, auth.tenantId!), eq(groups.id, id)));
    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }

    // Check if already a member
    const existing = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id), eq(groupMembers.patientId, patientId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Paciente já é membro deste grupo." }, { status: 409 });
    }

    // Check max participants
    if (group.maxParticipants) {
      const currentMembers = await db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, id));

      if (currentMembers.length >= group.maxParticipants) {
        return NextResponse.json({ error: "Grupo está cheio." }, { status: 400 });
      }
    }

    const [member] = await db.insert(groupMembers).values({
      groupId: id,
      patientId,
      tenantId: auth.tenantId!,
    }).returning();

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups/[id]/members error:", error);
    return NextResponse.json({ error: "Erro ao adicionar membro." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "memberId é obrigatório." }, { status: 400 });
    }

    const [deleted] = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.tenantId, auth.tenantId!), eq(groupMembers.id, memberId), eq(groupMembers.groupId, id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Membro removido." });
  } catch (error) {
    console.error("DELETE /api/groups/[id]/members error:", error);
    return NextResponse.json({ error: "Erro ao remover membro." }, { status: 500 });
  }
}
