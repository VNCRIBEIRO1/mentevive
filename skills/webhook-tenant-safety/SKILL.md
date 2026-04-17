---
name: webhook-tenant-safety
description: "Audit and fix Stripe webhook handlers for multi-tenant safety: ensure all mutation operations scope by tenantId, use lookup-first patterns, prevent cross-tenant data modification. Use when: auditing webhooks, fixing stripe handlers, adding tenant isolation to payment webhooks, verificar isolamento de tenant em webhooks."
argument-hint: "Specify: 'audit', 'fix', or specific event like 'charge.refunded'"
---

# Webhook Tenant Safety

Ensures all Stripe webhook event handlers correctly scope mutations by tenantId.

## When to Use

- After enabling Stripe webhooks in a multi-tenant platform
- Before onboarding new tenants to payment processing
- After modifying any webhook handler
- During security/compliance audits

## Risk: Cross-Tenant Mutation

Stripe webhooks receive events that include `paymentIntentId`, `subscriptionId`, etc. — but these are **Stripe-scoped**, not tenant-scoped. If the handler updates the DB using only the Stripe ID without verifying tenantId, it could theoretically modify any tenant's data.

## Audit Procedure

### 1. List all webhook handlers
```bash
grep -n "case ['\"]" src/app/api/stripe/webhook/route.ts
```

### 2. For each handler, check:
- Does it perform a DB write (insert/update/delete)?
- Does the write include a `tenantId` filter in the WHERE clause?
- If not → **CRITICAL**: needs lookup-first pattern

### 3. Lookup-first pattern
```typescript
// ❌ BAD — updates by Stripe ID only (could match any tenant)
await db.update(payments)
  .set({ status: "refunded" })
  .where(eq(payments.stripePaymentIntentId, piId));

// ✅ GOOD — lookup first, then scoped update
const [existing] = await db.select({ id: payments.id, tenantId: payments.tenantId })
  .from(payments)
  .where(eq(payments.stripePaymentIntentId, piId))
  .limit(1);

if (!existing) return; // or log warning

await db.update(payments)
  .set({ status: "refunded" })
  .where(and(
    eq(payments.tenantId, existing.tenantId),
    eq(payments.id, existing.id)
  ));
```

## Common Webhook Events to Audit

| Event | Mutation | Tenant Scope Required |
|-------|----------|-----------------------|
| `checkout.session.completed` | Insert/update payment + subscription | ✅ Use metadata.tenantId |
| `checkout.session.expired` | Update payment status | ✅ Lookup + scoped update |
| `charge.refunded` | Update payment status | ✅ Lookup + scoped update |
| `customer.subscription.created` | Update tenant subscription | ✅ Via customer metadata |
| `customer.subscription.updated` | Update tenant subscription | ✅ Via customer metadata |
| `customer.subscription.deleted` | Reset tenant subscription | ✅ Via customer metadata |
| `invoice.payment_failed` | Update subscription status | ✅ Via customer metadata |

## Metadata Strategy

Best practice: Always include `tenantId` in Stripe metadata when creating sessions:

```typescript
const session = await stripe.checkout.sessions.create({
  metadata: { tenantId: tenantId },
  // ...
});
```

Then in webhooks:
```typescript
const tenantId = session.metadata?.tenantId;
if (!tenantId) {
  console.error("Missing tenantId in webhook metadata");
  return NextResponse.json({ error: "missing tenant" }, { status: 400 });
}
```

## Known Issues Found (2025-07-25 Audit)

| Event | Issue | Status |
|-------|-------|--------|
| `charge.refunded` | Updated by stripePaymentIntentId without tenantId filter | ✅ Fixed — lookup-first pattern added |
| All others | Already had proper tenant scoping via metadata or customer lookup | ✅ OK |
