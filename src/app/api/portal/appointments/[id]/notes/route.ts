import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;
    const { id } = await params;
    const tenantId = auth.tenantId!;

    // Find patient record
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.userId, userId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado." },
        { status: 404 }
      );
    }

    // Find the appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    if (!appointment || appointment.patientId !== patient.id) {
      return NextResponse.json(
        { error: "Sessão não encontrada." },
        { status: 404 }
      );
    }

    // Only allow notes on completed sessions
    if (appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Anotações só podem ser feitas em sessões finalizadas." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const patientNotes =
      typeof body.patientNotes === "string"
        ? body.patientNotes.trim().slice(0, 2000)
        : null;

    const [updated] = await db
      .update(appointments)
      .set({ patientNotes, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/portal/appointments/[id]/notes error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar anotação." },
      { status: 500 }
    );
  }
}
