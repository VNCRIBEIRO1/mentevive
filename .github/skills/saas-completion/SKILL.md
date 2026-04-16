---
name: saas-completion
description: "Audit and implement missing SaaS features for MenteVive. Use when: completing platform gaps, building landing page, implementing email service, adding paywall enforcement, finishing Stripe Connect onboarding, adding Redis/caching, implementing tenant branding UI, SaaS readiness check, completar plataforma, o que falta, landing page, email transacional, paywall, stripe connect, escalabilidade."
argument-hint: "Specify which gap to work on: landing | email | paywall | connect | scalability | branding | audit"
---

# MenteVive SaaS Completion

## Purpose

Map, prioritize, and implement everything missing for MenteVive to be a production-ready multi-tenant SaaS. Each gap has a dedicated reference file with section-by-section specs.

## Current State (Apr 2026)

| Pillar | Status | Reference |
|--------|--------|-----------|
| Multi-tenancy | ✅ Complete | — |
| Auth & Roles | ✅ Complete | — |
| Onboarding | ✅ Complete | — |
| Self-service | ✅ Complete | — |
| Super Admin | ✅ Complete | — |
| Security | ✅ Complete | — |
| **Platform Landing** | ❌ Missing | [landing.md](./references/landing.md) |
| **Email Transacional** | ❌ Missing | [email.md](./references/email.md) |
| **Paywall Enforcement** | ❌ Missing | [paywall.md](./references/paywall.md) |
| **Stripe Connect UI** | ⚠️ Partial | [stripe-connect.md](./references/stripe-connect.md) |
| **Scalability** | ⚠️ Partial | [scalability.md](./references/scalability.md) |
| **Tenant Branding** | ⚠️ Partial | [branding.md](./references/branding.md) |

## Priority Order

```
🔴 P0 — Blocks production launch
  1. Email transacional (forgot-password broken in prod)
  2. Paywall enforcement (tenants use for free forever)

🟠 P1 — Blocks monetization
  3. Stripe Connect onboarding UI (therapists can't receive payments)

🟡 P2 — Blocks growth
  4. Platform landing page (no marketing/SEO presence)
  5. Scalability (rate-limit resets on cold start)

🟢 P3 — Polish
  6. Tenant branding UI (schema ready, no frontend)
```

## Procedure

### Step 1 — Audit (if running `/saas-completion audit`)

1. Read `src/db/schema.ts` — count tables, verify tenantId on all
2. Search for `console.log|console.warn` in API routes — find placeholder implementations
3. Search for `subscriptionStatus` — check if enforced in middleware/guards
4. Check `src/lib/stripe.ts` — verify Connect functions exist
5. Check `src/app/page.tsx` — verify if landing or redirect
6. Search for email providers (resend, sendgrid, nodemailer)
7. Output: status table matching the one above with current findings

### Step 2 — Implement (if running `/saas-completion <gap>`)

Load the corresponding reference file and follow its step-by-step implementation guide:

| Argument | Reference | Creates |
|----------|-----------|---------|
| `landing` | [landing.md](./references/landing.md) | Public platform homepage with hero, features, pricing, CTA |
| `email` | [email.md](./references/email.md) | Resend integration + 6 transactional templates |
| `paywall` | [paywall.md](./references/paywall.md) | Middleware + guards checking subscription status + plan limits |
| `connect` | [stripe-connect.md](./references/stripe-connect.md) | Tenant onboarding UI for Stripe Connect |
| `scalability` | [scalability.md](./references/scalability.md) | Upstash Redis for rate-limit + caching |
| `branding` | [branding.md](./references/branding.md) | Admin UI for tenant logo/colors + dynamic theme |

### Step 3 — Validate

After each implementation:
1. `npm run build` — must pass clean
2. `npm test` — no regressions
3. Verify the specific smoke tests listed in each reference file
4. Commit with conventional prefix: `feat: implement <gap-name>`

## Existing Infrastructure to Leverage

These already exist and should be REUSED (not duplicated):

| What | Where | Notes |
|------|-------|-------|
| Stripe SDK initialized | `src/lib/stripe.ts` | Has `createConnectAccount()`, `createConnectedCheckoutSession()` |
| Subscription webhook | `src/app/api/stripe/webhook/route.ts` | Handles `customer.subscription.*`, `invoice.payment_failed` |
| Subscription UI | `src/app/admin/assinatura/page.tsx` | Trial countdown, plan display, CDKey input |
| Branding JSONB column | `src/db/schema.ts` → `tenants.branding` | `{ logo, primaryColor, accentColor }` |
| Notifications table | `src/db/schema.ts` → `notifications` | In-app only, no email delivery |
| Rate limiter (in-memory) | `src/lib/rate-limit.ts` | Sliding window Map, needs Redis swap |
| Landing components | `src/components/landing/` | Hero, Journey, FAQ — exist but unused |
| Turnstile CAPTCHA | `src/lib/turnstile.ts` | Already on login/register |
| Plan limits in schema | `tenants.maxPatients`, `maxAppointmentsPerMonth` | Columns exist, not validated |
| Connect account fields | `tenants.stripeAccountId`, `stripeOnboardingComplete` | Schema ready |
| Proxy middleware | `src/proxy.ts` | Subdomain routing, role guards, public paths |

## Design Tokens (for any new UI)

```
Primary:    #D4A574 (warm gold)
Accent:     #E8A0BF (soft pink)
Teal:       #0f766e (calm deep)
Sage:       #e6f0eb (soft green)
Background: #FFF5EE (seashell)
Text:       #3D2B1F (dark brown)
Fonts:      Fraunces (headings) + Inter (body)
Glass:      .glass, .glass-strong, .glass-glow utilities
```
