import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, patients } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { createNotification } from "@/lib/notifications";
import { createPaymentSchema, updatePaymentSchema, formatZodError } from "@/lib/validations";
import { refundPayment } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const conditions = [];
    conditions.push(eq(payments.tenantId, tenantId));
    if (patientId) conditions.push(eq(payments.patientId, patientId));
    if (status) conditions.push(eq(payments.status, status as "pending" | "paid" | "overdue" | "cancelled" | "refunded"));

    const result = await db
      .select({
        payment: payments,
        patientName: patients.name,
      })
      .from(payments)
      .leftJoin(patients, eq(payments.patientId, patients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Erro ao buscar pagamentos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();

    // Zod validation
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { patientId, appointmentId, amount, method, dueDate, description } = parsed.data;

    const [newPayment] = await db.insert(payments).values({
      patientId,
      appointmentId: appointmentId || null,
      amount: String(amount),
      method: method || "pix",
      dueDate: dueDate || null,
      description: description || null,
      status: "pending",
      tenantId: auth.tenantId!,
    }).returning();

    // Notify about new payment created
    const [pat] = await db.select({ name: patients.name }).from(patients).where(eq(patients.id, patientId));
    await createNotification({
      type: "payment",
      title: "Cobrança criada",
      message: `Cobrança de R$ ${Number(amount).toFixed(2)} criada para ${pat?.name || "paciente"}.`,
      patientId,
      paymentId: newPayment.id,
      linkUrl: `/admin/financeiro`,
      tenantId: auth.tenantId!,
    });

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "Erro ao criar pagamento." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do pagamento é obrigatório." }, { status: 400 });
    }

    // Validate update fields with Zod
    const parsed = updatePaymentSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { status, paidAt, method, amount, dueDate, description } = parsed.data;

    // If refunding a MP payment, call the MP Refund API first
    if (status === "refunded") {
      const [existing] = await db.select().from(payments).where(and(eq(payments.tenantId, auth.tenantId!), eq(payments.id, id))).limit(1);
      if (existing?.stripePaymentIntentId) {
        const refunded = await refundPayment(existing.stripePaymentIntentId);
        if (!refunded) {
          console.warn(`Stripe refund failed for payment ${id}, proceeding with local refund.`);
        }
      }
    }

    const [updated] = await db.update(payments).set({
      ...(status !== undefined && { status }),
      ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
      ...(method !== undefined && { method }),
      ...(amount !== undefined && { amount: String(amount) }),
      ...(dueDate !== undefined && { dueDate }),
      ...(description !== undefined && { description }),
    }).where(and(eq(payments.tenantId, auth.tenantId!), eq(payments.id, id))).returning();

    if (!updated) {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }

    // Notify about payment status change
    if (status !== undefined) {
      const statusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Atrasado", cancelled: "Cancelado", refunded: "Reembolsado" };
      const [pat] = await db.select({ name: patients.name }).from(patients).where(eq(patients.id, updated.patientId));
      await createNotification({
        type: "payment",
        title: `Pagamento ${statusLabels[status] || status}`,
        message: `Pagamento de R$ ${Number(updated.amount).toFixed(2)} de ${pat?.name || "paciente"} atualizado para ${statusLabels[status] || status}.`,
        patientId: updated.patientId,
        paymentId: updated.id,
        linkUrl: `/admin/financeiro`,
        tenantId: auth.tenantId!,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/payments error:", error);
    return NextResponse.json({ error: "Erro ao atualizar pagamento." }, { status: 500 });
  }
}
