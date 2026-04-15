---
name: multi-tenant-migration
description: 'Strategy C hybrid multi-tenant migration: separate landing sites per client + shared central platform backend. Use when: converting single-tenant to multi-tenant, adding tenantId, creating tenants table, tenant_memberships, global users, migrating Stripe to Connect, scoping DB queries, creating super-admin, scaffolding client landing sites, onboarding new psychologists. Covers: schema migration, global auth with tenant picker, Drizzle query layer, API routes, Stripe Connect, Jitsi rooms, landing site template, tests.'
argument-hint: 'Specify phase (analyze | schema | auth | queries | stripe | landing | platform-ui | tests) or "full" for complete migration'
---

# Multi-Tenant Migration — Strategy C (Hybrid)

Transform a single-tenant psychology practice platform into a multi-tenant SaaS using the **Hybrid** strategy: each client gets their own independent landing site + all system functionality lives in one shared central platform.

## When to Use

- Converting the system from single-tenant to multi-tenant
- Adding tenant isolation to any layer (DB, auth, API, UI)
- Onboarding new psychologists as independent tenants
- Scaffolding a new client landing site
- Debugging cross-tenant data leaks
- Setting up Stripe Connect for per-tenant payments

## Architecture Decision — Strategy C

**Hybrid: Separate Landing Sites + Central Platform Backend**

See [full architecture](./references/architecture.md) for domain flow diagrams.

| Factor | Decision | Rationale |
|--------|----------|-----------|
| Landing sites | **Separate Vercel project per client** | Full creative control, client owns their domain, SEO independent |
| System (admin/portal/API) | **Single shared deploy** on `app.MenteVive.com.br` | One codebase, one DB, one deploy — easy maintenance |
| DB isolation | Shared DB + `tenantId` per row | Neon serverless, cost-effective, single migration set |
| User identity | **Global users** (Option B) | `users` has NO `tenantId`; `tenant_memberships` links users to tenants |
| Patient flow | Global account → select consultório | Same patient can be in multiple practices |
| Payments | Stripe Connect (Standard) | Each tenant = Connected Account, platform fee |
| Auth | Global login → `activeTenantId` in JWT | Tenant picker if user has multiple memberships |
| Blog | Per landing site (static) or `/api/blog` | Each client's site has its own blog |

### Domain Layout

```
┌─ Phase 1: Vercel Hobby (free) ────────────────────────────┐
│  PLATFORM:  MenteVive.vercel.app                          │
│  LANDING:   MenteVive-psicolobia.vercel.app  (Bia)       │
│  LANDING:   MenteVive-{slug}.vercel.app      (future)    │
└───────────────────────────────────────────────────────────┘

┌─ Phase 2: Custom Domains (when ready) ────────────────────┐
│  PLATFORM:  app.MenteVive.com.br                          │
│  LANDING:   psicolobia.com.br             (Bia)          │
│  LANDING:   dranaconsultorio.com.br       (future)       │
└───────────────────────────────────────────────────────────┘

┌─ CENTRAL PLATFORM ROUTES ─────────────────────────────────┐
│  /login?tenant=psicolobia    → Login with tenant context  │
│  /select-tenant              → Tenant picker (multi)      │
│  /admin/*                    → Admin dashboard            │
│  /portal/*                   → Patient portal             │
│  /api/*                      → All API routes             │
│  /super/*                    → Platform super admin       │
└───────────────────────────────────────────────────────────┘
```

> **Platform name**: MenteVive. Initial deploy on Vercel Hobby (free).
> Upgrade to Pro ($20/mo) when monetizing. Use env var `NEXT_PUBLIC_PLATFORM_URL` for all domain references.

## Phases

Execute phases in order. Each phase is independently deployable and backward-compatible.

### Phase 1: ANALYZE — Full Codebase Audit

**Goal:** Produce a complete impact report before touching any code.

**Procedure:**

1. Run [analysis script](./scripts/analyze-tenant-gaps.ts) to scan all source files:
   ```
   npx tsx skills/multi-tenant-migration/scripts/analyze-tenant-gaps.ts
   ```
2. Review the generated report at `multi-tenant-audit.json`
3. Cross-reference with [codebase map](./references/codebase-map.md)
4. Identify files that need changes per [checklist](./references/migration-checklist.md)

**What the analysis detects:**
- DB queries missing `tenantId` filter
- API routes without tenant context
- JWT/session without `tenantId`
- Stripe calls without `stripeAccount` parameter
- Jitsi rooms without tenant namespace
- Hardcoded URLs and references to single domain
- Settings/config that should be per-tenant

### Phase 2: SCHEMA — Database Migration

**Goal:** Add `tenants` + `tenant_memberships` tables; add `tenantId` FK to data tables; keep `users` global.

**Procedure:**

1. Review [schema changes](./references/schema-changes.md) for the complete migration plan
2. Add `tenants` table to `src/db/schema.ts`
3. Add `tenant_memberships` table (links global users → tenants with role)
4. Add `tenantId` column to 13 data tables (**NOT** `users` — users are global)
5. Create Drizzle migration: `npx drizzle-kit generate`
6. Run [data migration script](./scripts/migrate-existing-data.ts) to:
   - Create tenant #1 for current therapist (Bia)
   - Create membership: Bia (admin) → tenant #1
   - Backfill `tenantId` on all data rows
   - Create memberships for existing patients
   - Add NOT NULL constraint after backfill
7. Validate: `npx drizzle-kit push`

**Key distinction from Strategy A:**
- `users` table has **NO** `tenantId` — it stays global
- `email` stays **globally unique** (one account per email)
- `tenant_memberships` holds `(userId, tenantId, role)` — a user can be patient in tenant A and patient in tenant B
- `passwordResetTokens` — no `tenantId` (global user operation)

**Tables requiring `tenantId`:**
| Table | FK Behavior | Notes |
|-------|-------------|-------|
| `patients` | `onDelete: cascade` | Patient profile per tenant |
| `appointments` | `onDelete: cascade` | Session within a tenant |
| `availability` | `onDelete: cascade` | Therapist schedule per tenant |
| `clinicalRecords` | `onDelete: cascade` | Sensitive — strict isolation |
| `payments` | `onDelete: cascade` | Financial — strict isolation |
| `documents` | `onDelete: cascade` | Patient documents |
| `blogPosts` | `onDelete: cascade` | Blog scoped per tenant (optional if blog is in landing) |
| `groups` | `onDelete: cascade` | Group therapy per tenant |
| `groupMembers` | `onDelete: cascade` | Via group's tenant |
| `triages` | `onDelete: cascade` | Pre-session per tenant |
| `blockedDates` | `onDelete: cascade` | Therapist schedule |
| `settings` | `onDelete: cascade` | Key-value per tenant |
| `notifications` | `onDelete: cascade` | Admin notifications per tenant |

**Tables that stay global (NO tenantId):**
| Table | Reason |
|-------|--------|
| `users` | Global identity — one account per email |
| `passwordResetTokens` | Global user operation |

### Phase 3: AUTH — Global Login + Tenant Picker

**Goal:** Users authenticate globally; tenant context is set via membership lookup or tenant picker.

**Procedure:**

1. Review [auth changes](./references/auth-changes.md)
2. Update `src/lib/auth.ts`:
   - In `authorize()`: authenticate user globally (no tenant filter)
   - After auth: look up `tenant_memberships` for this user
   - If 1 membership → auto-set `activeTenantId` + `role` in JWT
   - If N memberships → set `needsTenantSelection: true` in JWT
   - If `?tenant=SLUG` param → resolve membership for that tenant
3. New: `/api/auth/select-tenant` — switch active tenant (updates JWT)
4. New: `/select-tenant` page — tenant picker UI for multi-membership users
5. Update `src/types/next-auth.d.ts`: add `activeTenantId`, `tenantSlug`, `membershipRole`
6. Update `src/lib/api-auth.ts`:
   - `requireAdmin()` returns `activeTenantId` from session
   - `requireAuth()` returns `activeTenantId` from session
   - New: `requireSuperAdmin()` for platform-level operations
   - New: `requireTenantSelected()` — blocks if `needsTenantSelection` is true

### Phase 4: MIDDLEWARE — Platform Route Guards

**Goal:** Protect routes and enforce tenant selection on the central platform.

**Procedure:**

1. Review [middleware spec](./references/middleware-spec.md)
2. Update `src/proxy.ts`:
   - Remove subdomain parsing (not needed in Strategy C)
   - Keep auth guards for `/admin/*` and `/portal/*`
   - Add guard: redirect to `/select-tenant` if JWT has `needsTenantSelection`
   - Add guard: `/super/*` requires `superadmin` role
   - Public routes remain public (availability, settings, etc. — resolve tenant from query param or header)
3. Create `src/lib/tenant.ts` — utility for tenant resolution from JWT

### Phase 5: QUERIES — Tenant-Scoped Drizzle Layer

**Goal:** Every DB query automatically filters by `tenantId`. Zero chance of cross-tenant leak.

**Procedure:**

1. Review [query layer spec](./references/query-layer.md)
2. Create `src/lib/tenant-db.ts`:
   - Wrapper that injects `.where(eq(table.tenantId, tenantId))` into every query
   - Helper functions `selectForTenant()`, `insertForTenant()`, etc.
3. Update **every API route** (47 routes) to use tenant-scoped queries
4. Key files to update (see [codebase map](./references/codebase-map.md)):
   - All admin routes: inject `activeTenantId` from session
   - All portal routes: inject `activeTenantId` from session
   - Public routes (availability, settings): resolve from `?tenant=SLUG` query param
   - Webhook: resolve tenant from payment's `tenantId`
   - Cron: iterate all tenants
5. Update `src/lib/notifications.ts`: add `tenantId` to inserts
6. Update `src/lib/payment-access.ts`: add `tenantId` filter

### Phase 6: STRIPE — Connect Migration

**Goal:** Each tenant has their own Stripe Connected Account; platform collects fees.

**Procedure:**

1. Review [Stripe Connect spec](./references/stripe-connect.md)
2. Update `src/lib/stripe.ts`:
   - `getClient()` now accepts optional `stripeAccountId` for on-behalf-of
   - `createCheckoutSession()` uses `stripe_account` parameter
   - Webhook handler routes events by `account` field
3. Add Stripe Connect onboarding flow:
   - New API: `POST /api/admin/stripe/connect` — create Standard account
   - New API: `GET /api/admin/stripe/connect/callback` — complete onboarding
   - Store `stripeAccountId` in `tenants` table
4. Update webhook to handle multi-account events
5. Add platform `application_fee_amount` or `application_fee_percent`

### Phase 7: LANDING — Client Site Template + Scaffolding

**Goal:** Create a reusable template for each client's landing site. Enable fast onboarding.

**Procedure:**

1. Review [landing template spec](./references/landing-template.md)
2. Create `templates/landing-site/` — Next.js starter with:
   - Tenant-specific `env.local` (tenant slug, platform URL, branding)
   - Landing page (hero, about, services, contact, testimonials)
   - Blog (static or fetched from platform API)
   - Login button → `app.MenteVive.com.br/login?tenant=SLUG`
   - WhatsApp and contact links
   - SEO (robots, sitemap, OG tags)
3. Scaffolding script: `scripts/scaffold-client-site.ts`
   - Input: client name, slug, domain, branding colors, logo
   - Output: ready-to-deploy Next.js project
4. Document Vercel deploy flow:
   - Create Vercel project for client
   - Add custom domain
   - Link to GitHub repo (or deploy from template)

### Phase 8: PLATFORM-UI — Super Admin + System Polish

**Goal:** Platform admin dashboard + system adjustments for multi-tenant.

**Procedure:**

1. New role: `superadmin` (manages all tenants, onboarding, billing)
2. New pages on central platform:
   - `/super/tenants` — list, create, suspend tenants
   - `/super/tenants/[id]` — tenant detail, Stripe status, usage
   - `/super/billing` — platform revenue, fees
   - `/select-tenant` — tenant picker for multi-membership users
3. Update admin layout: show tenant name in header
4. Update portal layout: show practice name
5. Login page: accept `?tenant=SLUG` param for pre-selection
6. Registration page: accept `?tenant=SLUG` param
7. Jitsi rooms prefixed with tenant slug: `{tenantSlug}-{hash}`

### Phase 9: TESTS — Isolation Verification

**Goal:** Prove no data leaks between tenants.

**Procedure:**

1. Create test tenant A and tenant B with separate data
2. Test scenarios:
   - Tenant A admin cannot see Tenant B patients
   - Tenant A patient cannot see Tenant B appointments
   - Stripe webhook for Tenant A doesn't update Tenant B payments
   - User with memberships in both A and B sees correct data per active tenant
   - Tenant picker shows only user's memberships
3. Negative tests:
   - Manipulated `tenantId` in request is ignored (trusted from JWT only)
   - User without any membership → blocked
   - Expired/cancelled membership → access denied
4. Run existing test suite to check zero regressions

## Critical Rules

1. **NEVER trust `tenantId` from client** — always derive from JWT session (`activeTenantId`)
2. **Every new DB query on data tables MUST include `tenantId`** — no exceptions
3. **`users` table has NO `tenantId`** — it is global; use `tenant_memberships` for association
4. **Migrations must be reversible** — use Drizzle's migration system
5. **Existing data (Bia) becomes tenant #1** — zero data loss
6. **Email is globally unique** — one account per email across all tenants
7. **Settings key uniqueness is per-tenant** — composite unique (tenantId + key)
8. **Blog slug uniqueness is per-tenant** — composite unique (tenantId + slug)
9. **Stripe webhook verification** — validate both platform and connected account signatures
10. **Landing sites are separate projects** — do NOT serve landing pages from the central platform

## File Impact Summary

See [codebase map](./references/codebase-map.md) for file-by-file impact analysis.

| Category | Files Affected | Severity |
|----------|---------------|----------|
| Schema | 1 file (schema.ts) | 🔴 Critical — foundation |
| Auth | 4 files (auth.ts, api-auth.ts, proxy.ts, next-auth.d.ts) | 🔴 Critical |
| API Routes | 47 routes | 🟡 High — bulk update |
| Lib modules | 8 files (stripe, jitsi, notifications, payment-access, session-pricing, availability, validations, utils) | 🟡 High |
| Landing template | New project template | 🟢 New — phase 7 |
| Platform UI | Super admin pages + tenant picker | 🟡 High |
| Tests | All existing + new isolation tests | 🟡 High |
| Scripts | 5 existing + 2 new (scaffold, migrate) | 🟢 Medium |
| Config | drizzle.config.ts, next.config.js, vercel.json | 🟢 Low |
