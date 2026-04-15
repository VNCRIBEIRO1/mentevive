import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinicalRecords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const [record] = await db.select().from(clinicalRecords).where(eq(clinicalRecords.id, id));
    if (!record) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    console.error("GET /api/clinical-records/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar registro." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const {
      sessionDate, sessionNumber, chiefComplaint, clinicalNotes,
      interventions, homework, mood, riskAssessment, nextSessionPlan,
    } = body;

    const [updated] = await db.update(clinicalRecords).set({
      ...(sessionDate !== undefined && { sessionDate: new Date(sessionDate) }),
      ...(sessionNumber !== undefined && { sessionNumber }),
      ...(chiefComplaint !== undefined && { chiefComplaint }),
      ...(clinicalNotes !== undefined && { clinicalNotes }),
      ...(interventions !== undefined && { interventions }),
      ...(homework !== undefined && { homework }),
      ...(mood !== undefined && { mood }),
      ...(riskAssessment !== undefined && { riskAssessment }),
      ...(nextSessionPlan !== undefined && { nextSessionPlan }),
      updatedAt: new Date(),
    }).where(eq(clinicalRecords.id, id)).returning();

    if (!updated) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/clinical-records/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar registro." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const [deleted] = await db.delete(clinicalRecords).where(eq(clinicalRecords.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Registro removido." });
  } catch (error) {
    console.error("DELETE /api/clinical-records/[id] error:", error);
    return NextResponse.json({ error: "Erro ao remover registro." }, { status: 500 });
  }
}
