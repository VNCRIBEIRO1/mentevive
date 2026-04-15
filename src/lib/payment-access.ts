import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { patients, payments } from "@/db/schema";

type AuthUser = {
  id: string;
  role: string;
};

export function isPrivilegedRole(role: string): boolean {
  return role === "admin" || role === "therapist";
}

export async function getAuthorizedPayment(paymentId: string, user: AuthUser) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) {
    return { payment: null, reason: "not_found" as const };
  }

  if (isPrivilegedRole(user.role)) {
    return { payment, reason: null };
  }

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, user.id))
    .limit(1);

  if (!patient || patient.id !== payment.patientId) {
    return { payment: null, reason: "forbidden" as const };
  }

  return { payment, reason: null };
}
