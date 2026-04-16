// @ts-nocheck
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { and, eq, ne, lt, gt, asc, sql } from "drizzle-orm";

function loadEnvFile(path: string) {
  if (!fs.existsSync(path)) return;
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");

import { db } from "../src/lib/db";
import {
  availability,
  appointments,
  blockedDates,
  notifications,
  patients,
  payments,
  users,
} from "../src/db/schema";
import { createCheckoutSession } from "../src/lib/stripe";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toMinuteString(time: string): string {
  return time.slice(0, 5);
}

function isLikelyEmail(value: string | null | undefined): value is string {
  return typeof value === "string" && value.includes("@") && value.includes(".");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupPayment(paymentId: string) {
  await db.delete(notifications).where(eq(notifications.paymentId, paymentId));
  await db.delete(payments).where(eq(payments.id, paymentId));
}

async function cleanupAppointments(ids: string[]) {
  if (ids.length === 0) return;
  for (const id of ids) {
    await db.delete(notifications).where(eq(notifications.appointmentId, id));
    await db.delete(appointments).where(eq(appointments.id, id));
  }
}

async function waitForPaid(paymentId: string, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const [payment] = await db
      .select({
        id: payments.id,
        status: payments.status,
        stripeStatus: payments.stripeStatus,
        stripePaymentIntentId: payments.stripePaymentIntentId,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (payment?.status === "paid") return payment;
    await sleep(1000);
  }
  return null;
}

async function findSingleSlot(patientId: string) {
  const activeSlots = await db
    .select()
    .from(availability)
    .where(eq(availability.active, true))
    .orderBy(asc(availability.dayOfWeek), asc(availability.startTime));

  const blocked = await db.select({ date: blockedDates.date }).from(blockedDates);
  const blockedSet = new Set(blocked.map((item) => item.date));
  const start = todaySP();

  for (let offset = 1; offset <= 45; offset++) {
    const date = addDays(start, offset);
    if (blockedSet.has(date)) continue;
    const dow = new Date(`${date}T00:00:00`).getDay();
    const daySlot = activeSlots.find((slot) => slot.dayOfWeek === dow);
    if (!daySlot) continue;

    const startTime = toMinuteString(daySlot.startTime);
    const endTime = `${String(Number(startTime.slice(0, 2)) + 1).padStart(2, "0")}:${startTime.slice(3, 5)}`;
    if (endTime > toMinuteString(daySlot.endTime)) continue;

    const overlapping = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.date, date),
          ne(appointments.status, "cancelled"),
          lt(appointments.startTime, `${endTime}:00`),
          gt(appointments.endTime, `${startTime}:00`)
        )
      )
      .limit(1);

    if (overlapping.length === 0) {
      return {
        patientId,
        date,
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
      };
    }
  }

  return null;
}

async function findRecurringDates(startDate: string, startTime: string, endTime: string) {
  const blocked = await db.select({ date: blockedDates.date }).from(blockedDates);
  const blockedSet = new Set(blocked.map((item) => item.date));
  const dates: string[] = [];

  for (let step = 0; step < 10 && dates.length < 3; step++) {
    const date = addDays(startDate, step * 7);
    if (blockedSet.has(date)) continue;

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

    if (overlapping.length === 0) dates.push(date);
  }

  return dates;
}

async function runStripeSmoke() {
  const [patient] = await db
    .select({
      id: patients.id,
      name: patients.name,
      email: patients.email,
    })
    .from(patients)
    .where(sql`${patients.email} is not null`)
    .limit(1);

  if (!patient) {
    throw new Error("Nenhum paciente com email encontrado para o smoke do Stripe.");
  }

  const [payment] = await db
    .insert(payments)
    .values({
      patientId: patient.id,
      amount: "10.00",
      method: "stripe",
      status: "pending",
      dueDate: todaySP(),
      description: "[SMOKE] Validacao local Stripe",
    })
    .returning();

  try {
    const checkout = await createCheckoutSession({
      paymentId: payment.id,
      amount: 10,
      description: payment.description || "[SMOKE] Stripe",
      customerEmail: isLikelyEmail(patient.email) ? patient.email : undefined,
    });

    if (!checkout) {
      throw new Error("Stripe nao configurado para criar Checkout Session.");
    }

    await db
      .update(payments)
      .set({
        stripeSessionId: checkout.sessionId,
        checkoutUrl: checkout.checkoutUrl,
        externalReference: payment.id,
      })
      .where(eq(payments.id, payment.id));

    execFileSync(
      "stripe",
      [
        "trigger",
        "checkout.session.completed",
        "--override",
        `checkout_session:client_reference_id=${payment.id}`,
      ],
      { stdio: "pipe" }
    );

    const paid = await waitForPaid(payment.id);
    if (!paid) {
      throw new Error("Webhook Stripe nao confirmou o pagamento dentro do tempo esperado.");
    }

    console.log(
      JSON.stringify({
        stage: "stripe",
        ok: true,
        paymentId: payment.id,
        status: paid.status,
        stripeStatus: paid.stripeStatus,
        paymentIntentId: paid.stripePaymentIntentId,
      })
    );
  } finally {
    await cleanupPayment(payment.id);
  }
}

async function runSchedulingSmoke() {
  const [patientUser] = await db
    .select({
      userId: users.id,
      patientId: patients.id,
      email: users.email,
    })
    .from(users)
    .innerJoin(patients, eq(patients.userId, users.id))
    .where(eq(users.role, "patient"))
    .limit(1);

  if (!patientUser) {
    throw new Error("Nenhum paciente vinculado a usuario encontrado para smoke do agendamento.");
  }

  const slot = await findSingleSlot(patientUser.patientId);
  if (!slot) {
    throw new Error("Nenhum horario livre encontrado para smoke de agendamento.");
  }

  const createdAppointmentIds: string[] = [];
  try {
    const [single] = await db
      .insert(appointments)
      .values({
        patientId: slot.patientId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        modality: "online",
        status: "pending",
        notes: "[SMOKE] Agendamento simples",
      })
      .returning({ id: appointments.id });

    createdAppointmentIds.push(single.id);

    const conflict = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.date, slot.date),
          ne(appointments.status, "cancelled"),
          lt(appointments.startTime, slot.endTime),
          gt(appointments.endTime, slot.startTime)
        )
      )
      .limit(2);

    const recurrenceDates = await findRecurringDates(
      addDays(slot.date, 7),
      slot.startTime,
      slot.endTime
    );

    const recurrenceGroupId = crypto.randomUUID();
    for (const date of recurrenceDates) {
      const [created] = await db
        .insert(appointments)
        .values({
          patientId: slot.patientId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          modality: "online",
          status: "pending",
          notes: "[SMOKE] Agendamento recorrente",
          recurrenceType: "weekly",
          recurrenceGroupId,
        })
        .returning({ id: appointments.id });

      createdAppointmentIds.push(created.id);
    }

    console.log(
      JSON.stringify({
        stage: "scheduling",
        ok: true,
        singleAppointmentDate: slot.date,
        singleAppointmentTime: slot.startTime,
        overlapDetectedAfterInsert: conflict.length > 0,
        recurringCreated: recurrenceDates.length,
      })
    );
  } finally {
    await cleanupAppointments(createdAppointmentIds);
  }
}

async function runAudit() {
  const counts = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(patients),
    db.select({ count: sql<number>`count(*)::int` }).from(appointments),
    db.select({ count: sql<number>`count(*)::int` }).from(payments),
    db.select({ count: sql<number>`count(*)::int` }).from(notifications),
  ]);

  console.log(
    JSON.stringify({
      stage: "audit",
      ok: true,
      users: counts[0][0].count,
      patients: counts[1][0].count,
      appointments: counts[2][0].count,
      payments: counts[3][0].count,
      notifications: counts[4][0].count,
    })
  );
}

async function main() {
  await runAudit();
  await runStripeSmoke();
  await runSchedulingSmoke();
  console.log(JSON.stringify({ stage: "done", ok: true }));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      stage: "error",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  );
  process.exit(1);
});
