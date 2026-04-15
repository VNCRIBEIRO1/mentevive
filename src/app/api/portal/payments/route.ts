import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, patients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;

    // Find the patient record linked to this user
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Registro de paciente não encontrado." }, { status: 404 });
    }

    const result = await db
      .select({
        payment: payments,
        patientName: patients.name,
      })
      .from(payments)
      .leftJoin(patients, eq(payments.patientId, patients.id))
      .where(eq(payments.patientId, patient.id))
      .orderBy(desc(payments.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/payments error:", error);
    return NextResponse.json({ error: "Erro ao buscar pagamentos." }, { status: 500 });
  }
}
