import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triages, appointments, patients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { getTenantPatientForUser } from "@/lib/tenant-guards";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const appointmentId = new URL(req.url).searchParams.get("appointmentId");
    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId é obrigatório." }, { status: 400 });
    }

    const tenantId = auth.tenantId!;
    const role = auth.role || auth.session!.user.membershipRole || auth.session!.user.role;

    let apt;
    if (role === "admin" || role === "therapist") {
      [apt] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.tenantId, tenantId)));
    } else {
      const patient = await getTenantPatientForUser(tenantId, auth.session!.user.id);
      [apt] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.tenantId, tenantId),
            eq(appointments.id, appointmentId),
            eq(appointments.patientId, patient?.id || "")
          )
        );
    }

    if (!apt) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const [triage] = await db
      .select()
      .from(triages)
      .where(and(eq(triages.tenantId, tenantId), eq(triages.appointmentId, appointmentId)));

    return NextResponse.json(triage || null);
  } catch (error) {
    console.error("GET /api/portal/triagem error:", error);
    return NextResponse.json({ error: "Erro ao buscar triagem." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const body = await req.json();
    const {
      appointmentId,
      mood,
      sleepQuality,
      anxietyLevel,
      mainConcern,
      recentEvents,
      medicationChanges,
      additionalNotes,
    } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId é obrigatório." }, { status: 400 });
    }

    const tenantId = auth.tenantId!;
    const patient = await getTenantPatientForUser(tenantId, auth.session!.user.id);
    if (!patient) {
      return NextResponse.json({ error: "Registro de paciente não encontrado." }, { status: 404 });
    }

    const [apt] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.id, appointmentId),
          eq(appointments.patientId, patient.id)
        )
      )
      .limit(1);

    if (!apt) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(triages)
      .where(and(eq(triages.tenantId, tenantId), eq(triages.appointmentId, appointmentId)));

    if (existing) {
      const [updated] = await db
        .update(triages)
        .set({
          mood,
          sleepQuality,
          anxietyLevel: anxietyLevel ? Number(anxietyLevel) : null,
          mainConcern,
          recentEvents,
          medicationChanges,
          additionalNotes,
          completed: true,
          updatedAt: new Date(),
        })
        .where(and(eq(triages.tenantId, tenantId), eq(triages.appointmentId, appointmentId)))
        .returning();

      const [aptForNotif] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, appointmentId)));
      if (aptForNotif) {
        const [pat] = await db
          .select({ name: patients.name })
          .from(patients)
          .where(and(eq(patients.tenantId, tenantId), eq(patients.id, aptForNotif.patientId)));
        await createNotification({
          tenantId,
          type: "triage",
          title: "Triagem atualizada",
          message: `${pat?.name || "Paciente"} atualizou a triagem da sessão de ${aptForNotif.date}.`,
          patientId: aptForNotif.patientId,
          appointmentId,
          linkUrl: `/admin/pacientes/${aptForNotif.patientId}`,
        });
      }
      return NextResponse.json(updated);
    }

    const [created] = await db
      .insert(triages)
      .values({
        tenantId,
        appointmentId,
        mood,
        sleepQuality,
        anxietyLevel: anxietyLevel ? Number(anxietyLevel) : null,
        mainConcern,
        recentEvents,
        medicationChanges,
        additionalNotes,
        completed: true,
      })
      .returning();

    const [aptForNotif2] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, appointmentId)));
    if (aptForNotif2) {
      const [pat] = await db
        .select({ name: patients.name })
        .from(patients)
        .where(and(eq(patients.tenantId, tenantId), eq(patients.id, aptForNotif2.patientId)));
      await createNotification({
        tenantId,
        type: "triage",
        title: "Nova triagem recebida",
        message: `${pat?.name || "Paciente"} preencheu a triagem pré-sessão de ${aptForNotif2.date}.${mainConcern ? ` Queixa: ${mainConcern.substring(0, 80)}${mainConcern.length > 80 ? "..." : ""}` : ""}`,
        patientId: aptForNotif2.patientId,
        appointmentId,
        linkUrl: `/admin/pacientes/${aptForNotif2.patientId}`,
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/portal/triagem error:", error);
    return NextResponse.json({ error: "Erro ao salvar triagem." }, { status: 500 });
  }
}
