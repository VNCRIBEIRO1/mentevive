import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, payments } from "@/db/schema";
import { eq, ne, desc, and, gte, lte, lt, gt } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { createAppointmentSchema, formatZodError } from "@/lib/validations";
import { buildMeetingUrl } from "@/lib/jitsi";
import { getSessionPrice } from "@/lib/session-pricing";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const status = searchParams.get("status");

    const conditions = [];
    if (patientId) conditions.push(eq(appointments.patientId, patientId));
    if (status) conditions.push(eq(appointments.status, status as "pending" | "confirmed" | "cancelled" | "completed" | "no_show"));
    if (dateFrom) conditions.push(gte(appointments.date, dateFrom));
    if (dateTo) conditions.push(lte(appointments.date, dateTo));

    const result = await db
      .select({
        appointment: appointments,
        patientName: patients.name,
        patientPhone: patients.phone,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(appointments.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { patientId, date, startTime, endTime, modality, notes, status } = parsed.data;
    const initialStatus = status === "pending" ? "pending" : "confirmed";
    const finalModality = modality || "online";

    if (startTime >= endTime) {
      return NextResponse.json({ error: "O horário final deve ser maior que o inicial." }, { status: 400 });
    }

    // M1: Check for overlapping appointments (same logic as portal)
    const overlapping = await db
      .select({ id: appointments.id, startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.date, date),
          ne(appointments.status, "cancelled"),
          lt(appointments.startTime, endTime),
          gt(appointments.endTime, startTime)
        )
      )
      .limit(1);

    if (overlapping.length > 0) {
      const conflict = overlapping[0];
      return NextResponse.json({
        error: `Conflito de horário: já existe um agendamento das ${conflict.startTime} às ${conflict.endTime} nessa data.`,
      }, { status: 409 });
    }

    const [createdAppointment] = await db.insert(appointments).values({
      patientId,
      date,
      startTime,
      endTime,
      modality: finalModality,
      notes: notes || null,
      status: initialStatus,
    }).returning();

    let newAppointment = createdAppointment;
    // Only generate meeting URL for online sessions
    if (newAppointment.status === "confirmed" && finalModality === "online") {
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          meetingUrl: buildMeetingUrl(newAppointment.id),
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, newAppointment.id))
        .returning();

      if (updatedAppointment) {
        newAppointment = updatedAppointment;
      }
    }

    const modalityLabel = finalModality === "presencial" ? "presencial" : "online";
    const amount = await getSessionPrice(finalModality);
    let newPayment: typeof payments.$inferSelect | null = null;

    if (amount > 0) {
      [newPayment] = await db
        .insert(payments)
        .values({
          patientId,
          appointmentId: newAppointment.id,
          amount: amount.toFixed(2),
          method: isStripeConfigured() ? "stripe" : "pix",
          status: "pending",
          dueDate: date,
          description: `Sessão ${modalityLabel} em ${date} às ${startTime}`,
        })
        .returning();
    }

    // Get patient name for notification
    const [pat] = await db.select({ name: patients.name }).from(patients).where(eq(patients.id, patientId));
    await createNotification({
      type: "appointment",
      title: "Sessão agendada",
      message: `Sessão ${modalityLabel} agendada para ${pat?.name || "paciente"} em ${date} às ${startTime}.`,
      patientId,
      appointmentId: newAppointment.id,
      linkUrl: `/admin/agenda`,
    });

    if (newPayment) {
      await createNotification({
        type: "payment",
        title: "Cobrança criada",
        message: `Cobrança de R$ ${amount.toFixed(2)} criada para ${pat?.name || "paciente"} no fluxo da sessão agendada.`,
        patientId,
        appointmentId: newAppointment.id,
        paymentId: newPayment.id,
        linkUrl: `/admin/financeiro`,
      });
    }

    return NextResponse.json({ ...newAppointment, payment: newPayment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json({ error: "Erro ao criar agendamento." }, { status: 500 });
  }
}
