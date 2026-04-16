import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  patients,
  payments,
  tenantMemberships,
} from "@/db/schema";

export async function getTenantPatientById(tenantId: string, patientId: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patientId)))
    .limit(1);

  return patient;
}

export async function getTenantPatientForUser(tenantId: string, userId: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.tenantId, tenantId), eq(patients.userId, userId)))
    .limit(1);

  return patient;
}

export async function getTenantAppointmentById(tenantId: string, appointmentId: string) {
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, appointmentId)))
    .limit(1);

  return appointment;
}

export async function getTenantPaymentById(tenantId: string, paymentId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.tenantId, tenantId), eq(payments.id, paymentId)))
    .limit(1);

  return payment;
}

export async function ensureTenantMembership(
  tenantId: string,
  userId: string,
  role: "admin" | "therapist" | "patient" = "patient",
) {
  await db
    .insert(tenantMemberships)
    .values({
      tenantId,
      userId,
      role,
      active: true,
    })
    .onConflictDoNothing({
      target: [tenantMemberships.userId, tenantMemberships.tenantId],
    });
}
