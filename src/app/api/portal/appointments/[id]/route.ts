import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { appointments, patients } from "@/db/schema";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const { id } = await params;
    const role = auth.session!.user.role;

    if (role === "admin" || role === "therapist") {
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id))
        .limit(1);

      if (!appointment) {
        return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
      }

      return NextResponse.json(appointment);
    }

    const userId = auth.session!.user.id;
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.patientId, patient.id)))
      .limit(1);

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("GET /api/portal/appointments/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamento." }, { status: 500 });
  }
}
