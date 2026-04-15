# Stripe Connect — Multi-Tenant Payment Integration

## Current State

- Single Stripe account via `STRIPE_SECRET_KEY` env var
- Direct charges (platform IS the merchant)
- Checkout Sessions with PIX + Card
- Webhook on `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`

## Target State

- **Stripe Connect (Standard)**: each tenant has their own Stripe account
- Platform creates checkout sessions on behalf of connected accounts
- Platform collects application fee per transaction
- Each tenant manages their own Stripe dashboard

## Architecture: Standard Connect

| Aspect | Detail |
|--------|--------|
| Account type | Standard (tenant controls their Stripe dashboard) |
| Charge type | Direct charges (customer pays connected account directly) |
| Platform fee | `application_fee_amount` on each PaymentIntent |
| Onboarding | Stripe-hosted (Account Links) |
| Payouts | Automatic to tenant's bank account |
| Disputes | Handled by tenant |

## Schema Addition

```typescript
// In tenants table:
stripeAccountId: varchar("stripe_account_id", { length: 255 }),    // acct_xxx
stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
```

## Updated `src/lib/stripe.ts`

```typescript
import Stripe from "stripe";

// Platform Stripe client (for Connect operations)
let _platformStripe: Stripe | null = null;

function getPlatformClient(): Stripe | null {
  if (_platformStripe) return _platformStripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  _platformStripe = new Stripe(secretKey);
  return _platformStripe;
}

/** Create Stripe Connected Account for a new tenant */
export async function createConnectedAccount(email: string): Promise<string | null> {
  const stripe = getPlatformClient();
  if (!stripe) return null;

  const account = await stripe.accounts.create({
    type: "standard",
    email,
    metadata: { platform: "psicolobia" },
  });

  return account.id; // acct_xxx
}

/** Generate onboarding link for tenant */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string | null> {
  const stripe = getPlatformClient();
  if (!stripe) return null;

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return link.url;
}

/** Check if connected account onboarding is complete */
export async function checkAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
} | null> {
  const stripe = getPlatformClient();
  if (!stripe) return null;

  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/** Create checkout session ON BEHALF of connected account */
export async function createCheckoutSession(
  input: CreateCheckoutInput & { stripeAccountId: string; applicationFee?: number }
): Promise<CreateCheckoutResult | null> {
  const stripe = getPlatformClient();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      // PIX only available in Brazil for connected accounts with BR bank
      mode: "payment",
      client_reference_id: input.paymentId,
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: input.description },
            unit_amount: Math.round(input.amount * 100), // centavos
          },
          quantity: 1,
        },
      ],
      payment_intent_data: input.applicationFee
        ? { application_fee_amount: input.applicationFee }
        : undefined,
      success_url: input.successUrl || `${getBaseUrl()}/portal/pagamentos?status=success`,
      cancel_url: input.cancelUrl || `${getBaseUrl()}/portal/pagamentos?status=cancelled`,
    },
    {
      stripeAccount: input.stripeAccountId, // KEY: creates charge on connected account
    }
  );

  return {
    sessionId: session.id,
    checkoutUrl: session.url!,
  };
}
```

## Webhook Changes

### Platform Receives Events for Connected Accounts

```typescript
// POST /api/stripe/webhook
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  const stripe = getPlatformClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  let event: Stripe.Event;

  try {
    // For connected account events, use the Connect webhook secret
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET! // platform-level webhook secret
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Connected account ID (if event came from a connected account)
  const connectedAccountId = event.account; // acct_xxx or undefined

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.client_reference_id;

      // Look up payment → get tenantId → scope all updates
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.externalReference, paymentId))
        .limit(1);

      if (!payment) break;

      const tdb = tenantScope(payment.tenantId);
      await tdb.update(payments).set({
        status: "paid",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent as string,
        stripeStatus: session.payment_status,
      }).where(eq(payments.id, payment.id));

      // ... update appointment, generate Jitsi URL, etc.
      break;
    }

    case "account.updated": {
      // Tenant completed onboarding or account status changed
      if (!connectedAccountId) break;

      const account = event.data.object as Stripe.Account;
      await db
        .update(tenants)
        .set({
          stripeOnboardingComplete: account.charges_enabled && account.details_submitted,
        })
        .where(eq(tenants.stripeAccountId, connectedAccountId));
      break;
    }

    // ... other events
  }

  return NextResponse.json({ received: true });
}
```

### Webhook Configuration in Stripe Dashboard

1. **Platform endpoint**: `https://app.MenteVive.com.br/api/stripe/webhook`
   - Subscribe to: `account.updated`
   - Under "Connected accounts": subscribe to `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
2. This single endpoint handles both platform and connected account events

## Onboarding Flow

### New API Routes

```
POST /api/admin/stripe/connect        → Create connected account + return onboarding URL
GET  /api/admin/stripe/connect/status  → Check if onboarding is complete
```

### Frontend Flow

1. Tenant admin visits `/admin/configuracoes`
2. Clicks "Conectar Stripe"
3. Backend creates Connected Account → returns AccountLink URL
4. Redirect to Stripe-hosted onboarding
5. Stripe redirects back to `/admin/configuracoes?stripe=complete`
6. Backend verifies `charges_enabled === true`
7. Show "Stripe conectado ✓" in UI

## Platform Fee Structure

```typescript
// Suggested pricing model
const PLATFORM_FEE_PERCENT = 5; // 5% of each transaction

function calculateApplicationFee(amountInCentavos: number): number {
  return Math.round(amountInCentavos * (PLATFORM_FEE_PERCENT / 100));
}
```

Options:
- **Percentage**: 3-10% per transaction
- **Flat fee**: R$ 2.00 per session
- **Plan-based**: Starter = 8%, Pro = 5%, Clinic = 3%
- **Hybrid**: flat monthly + lower percentage

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Platform | Platform's own Stripe secret key (for Connect operations) |
| `STRIPE_WEBHOOK_SECRET` | Platform | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Platform | Public key (for Stripe.js if needed) |
| `STRIPE_PLATFORM_FEE_PERCENT` | Platform | Default fee percentage |

**Per-tenant Stripe keys are NOT env vars** — they're stored as `tenants.stripeAccountId` and used via the Stripe Connect API.

## Fallback: Tenant Without Stripe

If tenant hasn't completed Stripe onboarding:
- Show "Configure Stripe para aceitar pagamentos online" banner
- Manual payment methods still work (cash, bank_transfer, PIX manual)
- Disable Checkout button in patient portal
- Payment status managed manually by therapist
