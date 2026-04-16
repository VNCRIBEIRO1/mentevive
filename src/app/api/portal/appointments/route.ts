import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, availability, blockedDates, payments } from "@/db/schema";
import { eq, desc, and, ne, lt, gt } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { getCustomAvailability } from "@/lib/custom-availability";
import { getSessionPrice } from "@/lib/session-pricing";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + (minutes || 0);
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;
    const tenantId = auth.tenantId!;

    // Find the patient record linked to this user
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.userId, userId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Registro de paciente não encontrado." }, { status: 404 });
    }

    const result = await db
      .select({
        appointment: appointments,
        patientName: patients.name,
      })
      .from(appointments)
      .leftJoin(
        patients,
        and(eq(appointments.tenantId, patients.tenantId), eq(appointments.patientId, patients.id))
      )
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.patientId, patient.id)))
      .orderBy(desc(appointments.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/appointments error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;
    const tenantId = auth.tenantId!;

    // Find the patient record linked to this user
    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.userId, userId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Registro de paciente não encontrado." }, { status: 404 });
    }

    const body = await req.json();
    const { date, startTime, notes, modality } = body;
    const finalModality = modality === "presencial" ? "presencial" : "online";

    if (!date || !startTime) {
      return NextResponse.json(
        { error: "Data e hora de início são obrigatórios." },
        { status: 400 }
      );
    }

    // Server-side endTime computation (never trust client)
    const [sh, sm] = startTime.split(":").map(Number);
    const endH = sh + 1; // 60-min sessions
    const endTime = `${String(endH).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;

    // H4: Validate date is not in the past
    const today = todaySP();
    if (date < today) {
      return NextResponse.json(
        { error: "N\u00e3o \u00e9 poss\u00edvel agendar em datas passadas." },
        { status: 400 }
      );
    }

    // H3: Check if date is blocked
    const [blocked] = await db
      .select({ id: blockedDates.id })
      .from(blockedDates)
      .where(and(eq(blockedDates.date, date), eq(blockedDates.tenantId, tenantId)))
      .limit(1);

    if (blocked) {
      return NextResponse.json(
        { error: "Esta data est\u00e1 bloqueada para agendamentos." },
        { status: 409 }
      );
    }

    // H3: Check if time falls within configured availability
    const dow = new Date(date + "T00:00:00").getDay();
    const [weeklySlots, customSlots] = await Promise.all([
      db
        .select()
        .from(availability)
        .where(
          and(
            eq(availability.tenantId, tenantId),
            eq(availability.dayOfWeek, dow),
            eq(availability.active, true)
          )
        ),
      getCustomAvailability(tenantId),
    ]);
    const availSlots = [
      ...weeklySlots,
      ...customSlots.filter((slot) => slot.date === date),
    ];

    const requestedStart = timeToMinutes(startTime);
    const requestedEnd = timeToMinutes(endTime);
    const withinAvailability = availSlots.some((s) => {
      const availableStart = timeToMinutes(s.startTime);
      const availableEnd = timeToMinutes(s.endTime);
      return requestedStart >= availableStart && requestedEnd <= availableEnd;
    });

    if (!withinAvailability) {
      return NextResponse.json(
        { error: "Hor\u00e1rio fora da disponibilidade configurada." },
        { status: 409 }
      );
    }

    // H2: Check for overlapping appointments (time-range overlap, not just exact match)
    const overlapping = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.date, date),
          ne(appointments.status, "cancelled"),
          lt(appointments.startTime, endTime),
          gt(appointments.endTime, startTime)
        )
      )
      .limit(1);

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: "Este horário já está ocupado. Escolha outro horário." },
        { status: 409 }
      );
    }

    const [newAppointment] = await db
      .insert(appointments)
      .values({
        tenantId,
        patientId: patient.id,
        date,
        startTime,
        endTime,
        modality: finalModality,
        notes: notes || null,
        status: "pending",
      })
      .returning();

    const modalityLabel = finalModality === "presencial" ? "presencial" : "online";
    const amount = await getSessionPrice(tenantId, finalModality);
    const [newPayment] = await db
      .insert(payments)
      .values({
        tenantId,
        patientId: patient.id,
        appointmentId: newAppointment.id,
        amount: amount.toFixed(2),
        method: isStripeConfigured() ? "stripe" : "pix",
        status: "pending",
        dueDate: date,
        description: `Sessão ${modalityLabel} em ${date} às ${startTime}`,
      })
      .returning();

    let checkout: { checkoutUrl: string; sessionId: string } | null = null;
    let checkoutWarning: string | null = null;
    if (isStripeConfigured()) {
      const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
      const successParams = new URLSearchParams({
        stripe_status: "success",
        paymentId: newPayment.id,
        appointmentId: newAppointment.id,
        date,
        time: startTime,
        modality: finalModality,
      });
      const cancelParams = new URLSearchParams({
        stripe_status: "cancelled",
        paymentId: newPayment.id,
        appointmentId: newAppointment.id,
        date,
        time: startTime,
        modality: finalModality,
      });

      try {
        checkout = await createCheckoutSession({
          paymentId: newPayment.id,
          amount,
          description: newPayment.description || "Sessão de Psicologia",
          customerEmail: patient.email || undefined,
          successUrl: `${baseUrl}/portal/agendar?${successParams.toString()}`,
          cancelUrl: `${baseUrl}/portal/agendar?${cancelParams.toString()}`,
        });

        if (checkout) {
          await db
            .update(payments)
            .set({
              stripeSessionId: checkout.sessionId,
              checkoutUrl: checkout.checkoutUrl,
              externalReference: newPayment.id,
            })
            .where(and(eq(payments.tenantId, tenantId), eq(payments.id, newPayment.id)));
        }
      } catch (checkoutError) {
        checkoutWarning = "Falha ao gerar o checkout agora.";
        console.error("POST /api/portal/appointments checkout error:", checkoutError);
      }
    }

    // Notify admin about new appointment from patient
    await createNotification({
      tenantId,
      type: "appointment",
      title: "Novo agendamento",
      message: `${patient.name} solicitou agendamento para ${date} às ${startTime}.`,
      patientId: patient.id,
      appointmentId: newAppointment.id,
      linkUrl: `/admin/agenda`,
    });

    return NextResponse.json({
      ...newAppointment,
      appointment: newAppointment,
      payment: newPayment,
      checkout,
      checkoutWarning,
      stripeEnabled: isStripeConfigured(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/portal/appointments error:", error);
    return NextResponse.json({ error: "Erro ao criar agendamento." }, { status: 500 });
  }
}
