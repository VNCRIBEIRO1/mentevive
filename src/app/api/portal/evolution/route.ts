import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, clinicalRecords } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;
    const tenantId = auth.tenantId!;

    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.userId, userId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Completed sessions with feedback
    const sessions = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        modality: appointments.modality,
        status: appointments.status,
        therapistFeedback: appointments.therapistFeedback,
        patientNotes: appointments.patientNotes,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patient.id),
          eq(appointments.tenantId, tenantId),
          eq(appointments.status, "completed")
        )
      )
      .orderBy(desc(appointments.date))
      .limit(50);

    // Non-confidential clinical records
    const records = await db
      .select({
        id: clinicalRecords.id,
        sessionDate: clinicalRecords.sessionDate,
      })
      .from(clinicalRecords)
      .where(
        and(
          eq(clinicalRecords.patientId, patient.id),
          eq(clinicalRecords.tenantId, tenantId),
          eq(clinicalRecords.private, false)
        )
      )
      .orderBy(desc(clinicalRecords.sessionDate));

    return NextResponse.json({
      totalSessions: sessions.length,
      sessions,
      records: records.map(r => ({
        id: r.id,
        sessionDate: r.sessionDate,
      })),
    });
  } catch (error) {
    console.error("GET /api/portal/evolution error:", error);
    return NextResponse.json({ error: "Erro ao buscar evolução." }, { status: 500 });
  }
}
