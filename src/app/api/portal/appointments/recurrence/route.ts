import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, availability, blockedDates, payments } from "@/db/schema";
import { eq, and, ne, lt, gt } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { getCustomAvailability } from "@/lib/custom-availability";
import { getSessionPrice } from "@/lib/session-pricing";
import { isStripeConfigured } from "@/lib/stripe";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/**
 * POST /api/portal/appointments/recurrence
 * Creates recurring appointments (weekly or biweekly) for a patient.
 *
 * Body: {
 *   startDate: string (YYYY-MM-DD) — first session date
 *   startTime: string (HH:MM)
 *   endTime: string (HH:MM)
 *   modality: "online"
 *   recurrenceType: "weekly" | "biweekly"
 *   weeks: number (how many weeks to generate, default 8)
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;

    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Registro de paciente não encontrado." }, { status: 404 });
    }

    const body = await req.json();
    const {
      startDate,
      startTime,
      endTime,
      modality = "online",
      recurrenceType,
      weeks = 8,
      notes,
    } = body;

    const finalModality = modality === "presencial" ? "presencial" : "online";

    if (!startDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Data, hora início e hora fim são obrigatórios." }, { status: 400 });
    }

    if (recurrenceType !== "weekly" && recurrenceType !== "biweekly") {
      return NextResponse.json({ error: "Tipo de recorrência deve ser 'weekly' ou 'biweekly'." }, { status: 400 });
    }

    const numWeeks = Math.min(Math.max(Number(weeks) || 8, 2), 24);
    const stepDays = recurrenceType === "weekly" ? 7 : 14;

    // Validate the first date
    const today = todaySP();
    if (startDate < today) {
      return NextResponse.json({ error: "Não é possível agendar em datas passadas." }, { status: 400 });
    }

    // Generate all dates
    const dates: string[] = [];
    const baseDate = new Date(startDate + "T12:00:00"); // noon to avoid DST issues
    for (let i = 0; i < numWeeks; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i * stepDays);
      const dateStr = d.toISOString().split("T")[0];
      dates.push(dateStr);
    }

    const dow = new Date(startDate + "T00:00:00").getDay();
    const [weeklySlots, customSlots] = await Promise.all([
      db
        .select()
        .from(availability)
        .where(and(eq(availability.dayOfWeek, dow), eq(availability.active, true))),
      getCustomAvailability(),
    ]);
    // Fetch blocked dates
    const allBlocked = await db
      .select({ date: blockedDates.date })
      .from(blockedDates);
    const blockedSet = new Set(allBlocked.map((b) => b.date));

    // Check each date for conflicts, skip blocked/conflicting ones
    const recurrenceGroupId = crypto.randomUUID();
    const created: typeof appointments.$inferSelect[] = [];
    const skipped: { date: string; reason: string }[] = [];

    for (const date of dates) {
      // Skip blocked
      if (blockedSet.has(date)) {
        skipped.push({ date, reason: "Data bloqueada" });
        continue;
      }

      const availSlots = [
        ...weeklySlots,
        ...customSlots.filter((slot) => slot.date === date),
      ];
      const withinAvailability = availSlots.some(
        (slot) => startTime >= slot.startTime && endTime <= slot.endTime
      );

      if (!withinAvailability) {
        skipped.push({ date, reason: "Fora da disponibilidade" });
        continue;
      }

      // Skip overlapping
      const overlapping = await db
        .select({ id: appointments.id })
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
        skipped.push({ date, reason: "Horário já ocupado" });
        continue;
      }

      // Insert appointment
      const [newApt] = await db
        .insert(appointments)
        .values({
          patientId: patient.id,
          date,
          startTime,
          endTime,
          modality: finalModality,
          notes: notes || null,
          status: "pending",
          recurrenceType,
          recurrenceGroupId,
        })
        .returning();

      created.push(newApt);
    }

    if (created.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma sessão pôde ser agendada. Todos os horários estão ocupados ou bloqueados." },
        { status: 409 }
      );
    }
    // Create pending payments for each created appointment
    try {
      const modalityLabel = finalModality === "presencial" ? "presencial" : "online";
      const amount = await getSessionPrice(finalModality);
      if (amount > 0) {
        const paymentMethod = isStripeConfigured() ? "stripe" : "pix";
        for (const apt of created) {
          await db.insert(payments).values({
            patientId: patient.id,
            appointmentId: apt.id,
            amount: amount.toFixed(2),
            method: paymentMethod,
            status: "pending",
            dueDate: apt.date,
            description: `Sessão ${modalityLabel} em ${apt.date} às ${startTime}`,
          });
        }
      }
    } catch (payErr) {
      console.error("Auto-create payments for recurrence error:", payErr);
    }
    // Notify admin
    const label = recurrenceType === "weekly" ? "semanal" : "quinzenal";
    await createNotification({
      type: "appointment",
      title: "Processo terapêutico agendado",
      message: `${patient.name} ativou processo ${label} — ${created.length} sessões a partir de ${startDate} às ${startTime}.`,
      patientId: patient.id,
      appointmentId: created[0].id,
      linkUrl: `/admin/agenda`,
    });

    return NextResponse.json(
      {
        message: `${created.length} sessões agendadas com sucesso.`,
        created: created.length,
        skipped: skipped.length,
        skippedDates: skipped,
        recurrenceGroupId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/portal/appointments/recurrence error:", error);
    return NextResponse.json({ error: "Erro ao criar agendamentos recorrentes." }, { status: 500 });
  }
}

