import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { payments, patients, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createCheckoutSession, createConnectedCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { createCheckoutSchema, formatZodError } from "@/lib/validations";
import { getAuthorizedPayment } from "@/lib/payment-access";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe não está configurado. Entre em contato com o suporte." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = createCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { paymentId } = parsed.data;
    const tenantId = auth.tenantId!;
    const access = await getAuthorizedPayment(paymentId, auth.session!.user, tenantId);
    if (access.reason === "not_found") {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }
    if (access.reason === "forbidden") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const payment = access.payment!;

    if (payment.status === "paid") {
      return NextResponse.json({ error: "Este pagamento já foi confirmado." }, { status: 400 });
    }

    if (payment.status === "cancelled" || payment.status === "refunded") {
      return NextResponse.json({ error: "Este pagamento foi cancelado ou reembolsado." }, { status: 400 });
    }

    if (payment.checkoutUrl && payment.stripeSessionId) {
      return NextResponse.json({
        checkoutUrl: payment.checkoutUrl,
        sessionId: payment.stripeSessionId,
      });
    }

    const [patient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.tenantId, tenantId), eq(patients.id, payment.patientId)))
      .limit(1);

    const [tenant] = await db
      .select({
        stripeAccountId: tenants.stripeAccountId,
        stripeOnboardingComplete: tenants.stripeOnboardingComplete,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    const connectedAccountId =
      tenant?.stripeOnboardingComplete && tenant?.stripeAccountId
        ? tenant.stripeAccountId
        : null;

    const baseUrl = process.env.NEXTAUTH_URL || "https://psicolobia.vercel.app";
    let successUrl: string | undefined;
    let cancelUrl: string | undefined;

    if (payment.appointmentId) {
      const successParams = new URLSearchParams({
        stripe_status: "success",
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
      });
      const cancelParams = new URLSearchParams({
        stripe_status: "cancelled",
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
      });
      successUrl = `${baseUrl}/portal/agendar?${successParams.toString()}`;
      cancelUrl = `${baseUrl}/portal/agendar?${cancelParams.toString()}`;
    }

    const checkoutInput = {
      paymentId: payment.id,
      amount: parseFloat(payment.amount),
      description: payment.description || "Sessão de Psicologia - MenteVive",
      customerEmail: patient?.email || undefined,
      successUrl,
      cancelUrl,
    };

    const result = connectedAccountId
      ? await createConnectedCheckoutSession({
          ...checkoutInput,
          connectedAccountId,
          applicationFeeAmount: 0,
        })
      : await createCheckoutSession(checkoutInput);

    if (!result) {
      return NextResponse.json(
        { error: "Falha ao criar sessão de pagamento." },
        { status: 500 }
      );
    }

    await db
      .update(payments)
      .set({
        stripeSessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
        externalReference: payment.id,
      })
      .where(and(eq(payments.tenantId, tenantId), eq(payments.id, paymentId)));

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("POST /api/stripe/create-checkout error:", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de pagamento." },
      { status: 500 }
    );
  }
}
