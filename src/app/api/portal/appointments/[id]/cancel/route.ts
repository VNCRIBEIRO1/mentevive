import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { appointments, patients, payments } from "@/db/schema";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { refundPayment } from "@/lib/stripe";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.response;

  const { id } = await params;
  const userId = auth.session!.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const tenantId = auth.tenantId!;

  const [patient] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(and(eq(patients.userId, userId), eq(patients.tenantId, tenantId)))
    .limit(1);

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, patient.id)))
    .limit(1);

  if (!appointment) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return NextResponse.json(
      { error: "Apenas sessões pendentes ou confirmadas podem ser canceladas." },
      { status: 400 }
    );
  }

  const sessionDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
  const hoursUntilSession = (sessionDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilSession < 24) {
    return NextResponse.json(
      { error: "Cancelamentos devem ser feitos com pelo menos 24h de antecedência." },
      { status: 400 }
    );
  }

  const linkedPayments = await db
    .select({
      id: payments.id,
      status: payments.status,
      stripePaymentIntentId: payments.stripePaymentIntentId,
    })
    .from(payments)
    .where(eq(payments.appointmentId, id));

  let cancelledCharges = 0;
  let refundedCharges = 0;
  let manualReviewCharges = 0;

  for (const payment of linkedPayments) {
    if (payment.status === "pending" || payment.status === "overdue") {
      await db
        .update(payments)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
      cancelledCharges += 1;
      continue;
    }

    if (payment.status !== "paid") {
      continue;
    }

    if (!payment.stripePaymentIntentId) {
      manualReviewCharges += 1;
      continue;
    }

    const refunded = await refundPayment(payment.stripePaymentIntentId);
    if (refunded) {
      await db
        .update(payments)
        .set({
          status: "refunded",
          stripeStatus: "refunded",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
      refundedCharges += 1;
      continue;
    }

    manualReviewCharges += 1;
  }

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(appointments.id, id));

  const paymentSummary = [
    cancelledCharges > 0
      ? `${cancelledCharges} cobrança${cancelledCharges > 1 ? "s" : ""} pendente${cancelledCharges > 1 ? "s" : ""} cancelada${cancelledCharges > 1 ? "s" : ""}`
      : null,
    refundedCharges > 0
      ? `${refundedCharges} pagamento${refundedCharges > 1 ? "s" : ""} enviado${refundedCharges > 1 ? "s" : ""} para estorno automático`
      : null,
    manualReviewCharges > 0
      ? `${manualReviewCharges} pagamento${manualReviewCharges > 1 ? "s" : ""} pendente${manualReviewCharges > 1 ? "m" : ""} de revisão manual`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  await createNotification({
    tenantId,
    type: "status_change",
    title: "Sessão cancelada pelo paciente",
    message: `Paciente cancelou a sessão de ${appointment.date} às ${appointment.startTime}.${paymentSummary ? ` ${paymentSummary}.` : ""}`,
    icon: "❌",
    linkUrl: "/admin/agenda",
    patientId: patient.id,
    appointmentId: id,
  });

  if (manualReviewCharges > 0) {
    await createNotification({
      tenantId,
      type: "payment",
      title: "Revisar pagamento de sessão cancelada",
      message: `A sessão cancelada de ${appointment.date} às ${appointment.startTime} possui ${manualReviewCharges} pagamento${manualReviewCharges > 1 ? "s" : ""} que exige${manualReviewCharges > 1 ? "m" : ""} conferência manual da equipe.`,
      linkUrl: "/admin/financeiro",
      patientId: patient.id,
      appointmentId: id,
    });
  }

  const userMessageParts = ["Sessão cancelada com sucesso."];
  if (cancelledCharges > 0) {
    userMessageParts.push(`Cobrança${cancelledCharges > 1 ? "s" : ""} pendente${cancelledCharges > 1 ? "s foram canceladas" : " foi cancelada"}.`);
  }
  if (refundedCharges > 0) {
    userMessageParts.push(`O sistema iniciou o estorno automático de ${refundedCharges > 1 ? "seus pagamentos" : "seu pagamento"}.`);
  }
  if (manualReviewCharges > 0) {
    userMessageParts.push("Nossa equipe foi avisada para revisar manualmente qualquer valor que não puder ser estornado automaticamente.");
  }

  return NextResponse.json({ message: userMessageParts.join(" ") });
}
