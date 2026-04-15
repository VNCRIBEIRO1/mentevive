import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { payments, patients, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createCheckoutSession, createConnectedCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { createCheckoutSchema, formatZodError } from "@/lib/validations";
import { getAuthorizedPayment } from "@/lib/payment-access";

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout Session for a given payment.
 * Called when patient clicks "Pagar agora" or admin clicks "Gerar Link".
 *
 * Body: { paymentId: string }
 * Returns: { checkoutUrl: string, sessionId: string }
 */
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

    const access = await getAuthorizedPayment(paymentId, auth.session!.user, auth.tenantId!);
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

    // If a checkout URL already exists and session is still valid, return it
    if (payment.checkoutUrl && payment.stripeSessionId) {
      return NextResponse.json({
        checkoutUrl: payment.checkoutUrl,
        sessionId: payment.stripeSessionId,
      });
    }

    // Get patient info for customer email
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, payment.patientId))
      .limit(1);

    // Get tenant's Stripe Connect account (if onboarding complete)
    const [tenant] = await db
      .select({
        stripeAccountId: tenants.stripeAccountId,
        stripeOnboardingComplete: tenants.stripeOnboardingComplete,
      })
      .from(tenants)
      .where(eq(tenants.id, auth.tenantId!));
    const connectedAccountId =
      tenant?.stripeOnboardingComplete && tenant?.stripeAccountId
        ? tenant.stripeAccountId
        : null;

    // Build appointment-aware redirect URLs so the user can reach the waiting room
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
      description: payment.description || "Sessão de Psicologia — MenteVive",
      customerEmail: patient?.email || undefined,
      successUrl,
      cancelUrl,
    };

    const result = connectedAccountId
      ? await createConnectedCheckoutSession({
          ...checkoutInput,
          connectedAccountId,
          applicationFeeAmount: 0, // Platform fee (0 = no fee for now)
        })
      : await createCheckoutSession(checkoutInput);

    if (!result) {
      return NextResponse.json(
        { error: "Falha ao criar sessão de pagamento." },
        { status: 500 }
      );
    }

    // Save session data to payment record
    await db
      .update(payments)
      .set({
        stripeSessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
        externalReference: payment.id,
      })
      .where(eq(payments.id, paymentId));

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
