import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq, sql, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { patients, payments } from "@/db/schema";
import {
  createCheckoutSession,
  getCheckoutSession,
  isStripeConfigured,
  mapStripeStatus,
} from "@/lib/stripe";

const createTestPaymentSchema = z.object({
  patientId: z.string().uuid().optional(),
  amount: z.coerce.number().positive().max(99999).optional().default(10),
  description: z.string().min(3).max(255).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Stripe não configurado neste ambiente.",
          requiredEnv: [
            "STRIPE_SECRET_KEY",
            "STRIPE_WEBHOOK_SECRET",
            "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
          ],
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createTestPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
        { status: 400 }
      );
    }

    const { patientId, amount, dueDate } = parsed.data;

    const tenantId = auth.tenantId!;

    const [patient] = patientId
      ? await db
          .select()
          .from(patients)
          .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
          .limit(1)
      : await db
          .select()
          .from(patients)
          .where(and(eq(patients.tenantId, tenantId), sql`${patients.email} is not null`))
          .orderBy(desc(patients.createdAt))
          .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: "Nenhum paciente elegível encontrado para criar pagamento de teste." },
        { status: 404 }
      );
    }

    const [payment] = await db
      .insert(payments)
      .values({
        tenantId,
        patientId: patient.id,
        amount: amount.toFixed(2),
        method: "stripe",
        status: "pending",
        dueDate: dueDate || todaySP(),
        description:
          parsed.data.description ||
          `[TESTE STRIPE] Validação de checkout para ${patient.name}`,
      })
      .returning();

    const checkout = await createCheckoutSession({
      paymentId: payment.id,
      amount,
      description: payment.description || `[TESTE STRIPE] ${patient.name}`,
      customerEmail: patient.email || undefined,
    });

    if (!checkout) {
      await db.delete(payments).where(and(eq(payments.tenantId, tenantId), eq(payments.id, payment.id)));
      return NextResponse.json(
        { error: "Falha ao criar checkout de teste." },
        { status: 500 }
      );
    }

    await db
      .update(payments)
      .set({
        stripeSessionId: checkout.sessionId,
        checkoutUrl: checkout.checkoutUrl,
        externalReference: payment.id,
      })
      .where(and(eq(payments.tenantId, tenantId), eq(payments.id, payment.id)));

    return NextResponse.json(
      {
        ok: true,
        mode: "stripe-test-flow",
        paymentId: payment.id,
        patientId: patient.id,
        patientName: patient.name,
        patientEmail: patient.email,
        amount: payment.amount,
        status: payment.status,
        checkoutUrl: checkout.checkoutUrl,
        sessionId: checkout.sessionId,
        cli: {
          listen:
            "stripe listen --forward-to http://localhost:3000/api/stripe/webhook",
          triggerCompleted:
            `stripe trigger checkout.session.completed --override checkout_session:client_reference_id=${payment.id}`,
        },
        nextStep:
          "Abra checkoutUrl para testar o pagamento ou use o comando do Stripe CLI para disparar o webhook de confirmação.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/stripe/test-flow error:", error);
    return NextResponse.json(
      { error: "Erro ao criar fluxo de teste do Stripe." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const paymentId = req.nextUrl.searchParams.get("paymentId");
    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId é obrigatório." },
        { status: 400 }
      );
    }

    const tenantId = auth.tenantId!;

    const [payment] = await db
      .select({
        payment: payments,
        patientName: patients.name,
        patientEmail: patients.email,
      })
      .from(payments)
      .leftJoin(
        patients,
        and(eq(payments.tenantId, patients.tenantId), eq(payments.patientId, patients.id))
      )
      .where(and(eq(payments.id, paymentId), eq(payments.tenantId, tenantId)))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento de teste não encontrado." },
        { status: 404 }
      );
    }

    let stripeSnapshot: Awaited<ReturnType<typeof getCheckoutSession>> = null;
    if (payment.payment.stripeSessionId && isStripeConfigured()) {
      stripeSnapshot = await getCheckoutSession(payment.payment.stripeSessionId);
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.payment.id,
      patientName: payment.patientName,
      patientEmail: payment.patientEmail,
      local: {
        status: payment.payment.status,
        stripeStatus: payment.payment.stripeStatus,
        stripeSessionId: payment.payment.stripeSessionId,
        stripePaymentIntentId: payment.payment.stripePaymentIntentId,
        checkoutUrl: payment.payment.checkoutUrl,
        paidAt: payment.payment.paidAt,
      },
      stripe: stripeSnapshot
        ? {
            status: stripeSnapshot.status,
            mappedStatus: mapStripeStatus(stripeSnapshot.status),
            paymentIntentId: stripeSnapshot.paymentIntentId,
            amount: stripeSnapshot.amount,
            paymentMethod: stripeSnapshot.paymentMethod,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/stripe/test-flow error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar fluxo de teste do Stripe." },
      { status: 500 }
    );
  }
}
