import Stripe from "stripe";

/* ============================================================
 * Stripe Checkout integration library.
 *
 * Uses the official `stripe` SDK with a lazy singleton pattern —
 * the client is only initialized when Stripe is configured.
 *
 * Graceful degradation: when STRIPE_SECRET_KEY is not set,
 * all public functions return null / false instead of throwing.
 * ============================================================ */

let _stripe: Stripe | null = null;

/** Get or create the Stripe client singleton. Returns null if unconfigured. */
function getClient(): Stripe | null {
  if (_stripe) return _stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  _stripe = new Stripe(secretKey);
  return _stripe;
}

/** Check if Stripe is configured and ready to use. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/* ── Checkout Session creation ── */

export type CreateCheckoutInput = {
  /** Internal payment UUID (used as client_reference_id) */
  paymentId: string;
  /** Amount in BRL as string (e.g. "150.00") — will be converted to centavos */
  amount: number;
  /** Description shown in Stripe checkout */
  description: string;
  /** Customer email (optional but improves UX) */
  customerEmail?: string;
  /** Optional override for the post-success redirect */
  successUrl?: string;
  /** Optional override for the cancelled/abandoned redirect */
  cancelUrl?: string;
};

export type CreateCheckoutResult = {
  sessionId: string;
  checkoutUrl: string;
};

/**
 * Create a Stripe Checkout Session.
 * Supports card and PIX (when enabled in Stripe dashboard).
 * Returns the session ID and checkout URL, or null if Stripe is not configured.
 */
export async function createCheckoutSession(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult | null> {
  const client = getClient();
  if (!client) return null;

  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("NEXTAUTH_URL is required for Stripe checkout");

  const session = await client.checkout.sessions.create({
    mode: "payment",
    currency: "brl",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: input.description,
            description: input.description,
          },
          unit_amount: Math.round(input.amount * 100), // BRL cents
        },
        quantity: 1,
      },
    ],
    customer_email: input.customerEmail || undefined,
    client_reference_id: input.paymentId,
    success_url: input.successUrl || `${baseUrl}/portal/pagamentos?stripe_status=success`,
    cancel_url: input.cancelUrl || `${baseUrl}/portal/pagamentos?stripe_status=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 24 * 3600, // 24h expiry
    metadata: {
      payment_id: input.paymentId,
      source: "mentevive",
    },
  });

  if (!session.id || !session.url) {
    throw new Error("Stripe não retornou ID ou URL de checkout.");
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

/* ── Payment Intent lookup ── */

export type StripePaymentInfo = {
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  clientReferenceId: string | null;
};

/**
 * Retrieve a Checkout Session from Stripe to get its payment status.
 * Returns null if Stripe is not configured.
 */
export async function getCheckoutSession(sessionId: string): Promise<StripePaymentInfo | null> {
  const client = getClient();
  if (!client) return null;

  const session = await client.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const pi = session.payment_intent as Stripe.PaymentIntent | null;

  return {
    paymentIntentId: pi?.id || "",
    status: session.payment_status || "unpaid",
    amount: session.amount_total ? session.amount_total / 100 : 0,
    currency: session.currency || "brl",
    paymentMethod: pi?.payment_method_types?.[0] || null,
    clientReferenceId: session.client_reference_id || null,
  };
}

/* ── Refund ── */

/**
 * Create a full refund for a Stripe Payment Intent.
 * Returns true if successful, false otherwise.
 */
export async function refundPayment(paymentIntentId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    await client.refunds.create({ payment_intent: paymentIntentId });
    return true;
  } catch (error) {
    console.error("Erro ao reembolsar pagamento no Stripe:", error);
    return false;
  }
}

/* ── Webhook signature validation ── */

/**
 * Validate a Stripe webhook signature.
 * Uses the Stripe SDK's built-in verification.
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("STRIPE_WEBHOOK_SECRET not configured — skipping validation");
    return null;
  }

  try {
    const stripe = getClient();
    if (!stripe) return null;
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Webhook signature validation failed:", error);
    return null;
  }
}

/* ── Stripe status → internal status mapping ── */

/**
 * Map Stripe payment/checkout status to our internal payment status enum.
 */
export function mapStripeStatus(stripeStatus: string): "pending" | "paid" | "cancelled" | "refunded" {
  switch (stripeStatus) {
    case "paid":
    case "complete":
    case "succeeded":
      return "paid";
    case "unpaid":
    case "no_payment_required":
    case "processing":
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "pending";
    case "canceled":
    case "cancelled":
    case "expired":
    case "failed":
      return "cancelled";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}

/* ── Stripe Connect ── */

export type CreateConnectAccountResult = {
  accountId: string;
  onboardingUrl: string;
};

/**
 * Create a Stripe Connect Express account for a tenant (v2 controller pattern).
 * Returns account ID + onboarding URL.
 */
export async function createConnectAccount(
  tenantSlug: string,
  tenantId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<CreateConnectAccountResult | null> {
  const client = getClient();
  if (!client) return null;

  // Use Accounts v1 with controller properties (v2 requires Bearer auth which is different)
  const account = await (client.accounts as any).create({
    controller: {
      stripe_dashboard: { type: "express" },
      fees: { payer: "application" },
      losses: { payments: "application" },
      requirement_collection: "stripe",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
    },
  });

  const link = await client.accountLinks.create({
    account: account.id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return {
    accountId: account.id,
    onboardingUrl: link.url,
  };
}

/**
 * Generate a new onboarding link for an existing Connect account (e.g. refresh).
 */
export async function refreshConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const link = await client.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return link.url;
}

/**
 * Check if a Connect account has completed onboarding.
 */
export async function checkConnectAccountReady(accountId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const account = await client.accounts.retrieve(accountId);
  return (
    account.details_submitted === true &&
    account.charges_enabled === true &&
    account.payouts_enabled === true
  );
}

/**
 * Create a Checkout Session using destination charge to a connected account.
 * The platform collects an application fee, and funds go to the tenant's account.
 */
export type CreateConnectedCheckoutInput = CreateCheckoutInput & {
  connectedAccountId: string;
  applicationFeeAmount?: number; // BRL cents (default: 0 for now)
};

export async function createConnectedCheckoutSession(
  input: CreateConnectedCheckoutInput
): Promise<CreateCheckoutResult | null> {
  const client = getClient();
  if (!client) return null;

  const baseUrl = process.env.NEXTAUTH_URL || "https://mentevive.vercel.app";

  const session = await client.checkout.sessions.create({
    mode: "payment",
    currency: "brl",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: input.description,
          },
          unit_amount: Math.round(input.amount * 100), // BRL cents
        },
        quantity: 1,
      },
    ],
    customer_email: input.customerEmail || undefined,
    client_reference_id: input.paymentId,
    success_url: input.successUrl || `${baseUrl}/portal/pagamentos?stripe_status=success`,
    cancel_url: input.cancelUrl || `${baseUrl}/portal/pagamentos?stripe_status=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 24 * 3600,
    payment_intent_data: {
      transfer_data: {
        destination: input.connectedAccountId,
      },
      ...(input.applicationFeeAmount && input.applicationFeeAmount > 0
        ? { application_fee_amount: input.applicationFeeAmount }
        : {}),
    },
    metadata: {
      payment_id: input.paymentId,
      tenant_id: input.paymentId, // overridden by caller metadata if needed
      source: "mentevive",
    },
  });

  if (!session.id || !session.url) {
    throw new Error("Stripe não retornou ID ou URL de checkout.");
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

