import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { appointments } from "@/db/schema";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getTenantPatientForUser } from "@/lib/tenant-guards";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const { id } = await params;
    const tenantId = auth.tenantId!;
    const role = auth.role || auth.session!.user.membershipRole || auth.session!.user.role;

    if (role === "admin" || role === "therapist") {
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
        .limit(1);

      if (!appointment) {
        return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
      }

      return NextResponse.json(appointment);
    }

    const patient = await getTenantPatientForUser(tenantId, auth.session!.user.id);
    if (!patient) {
      return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id), eq(appointments.patientId, patient.id)))
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
