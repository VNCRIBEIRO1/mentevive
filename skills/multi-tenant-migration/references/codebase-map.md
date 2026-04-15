# Codebase Map — Strategy C Impact Analysis

Every file in the project and what changes for multi-tenant (Strategy C: hybrid landing + central platform, Option B: global users).

## Legend

- 🔴 **Critical** — Must change, blocks other phases
- 🟡 **High** — Must change, required for full isolation
- 🟢 **Medium** — Should change, but system works without
- ⚪ **None** — No changes needed
- 🆕 **New** — File does not exist yet

---

## Schema (`src/db/schema.ts`)

| Item | Impact | Change Required |
|------|--------|-----------------|
| `users` table | 🟡 | Add `isSuperAdmin` boolean. Change `role` to `superadmin \| user`. **NO tenantId** (global) |
| `patients` table | 🔴 | Add `tenantId` FK. Composite unique on `(tenantId, userId)` — same user can be patient in multiple practices |
| `appointments` table | 🔴 | Add `tenantId` FK |
| `availability` table | 🔴 | Add `tenantId` FK |
| `clinicalRecords` table | 🔴 | Add `tenantId` FK |
| `payments` table | 🔴 | Add `tenantId` FK |
| `documents` table | 🟡 | Add `tenantId` FK |
| `blogPosts` table | 🟡 | Add `tenantId` FK; slug composite unique `(tenantId, slug)` |
| `groups` table | 🟡 | Add `tenantId` FK |
| `groupMembers` table | 🟡 | Add `tenantId` FK |
| `triages` table | 🟡 | Add `tenantId` FK |
| `blockedDates` table | 🟡 | Add `tenantId` FK; date composite unique `(tenantId, date)` |
| `settings` table | 🟡 | Add `tenantId` FK; key composite unique `(tenantId, key)` |
| `notifications` table | 🟡 | Add `tenantId` FK |
| `passwordResetTokens` table | ⚪ | Global operation — user resets password for their single global account |
| Relations | 🟡 | Add tenant relations to all 13 data tables + tenantMemberships |
| **NEW: `tenants` table** | 🆕 | slug, name, ownerUserId, branding (JSON), landingDomain, stripeAccountId, plan, active |
| **NEW: `tenant_memberships` table** | 🆕 | userId FK, tenantId FK, role (admin/patient), active, unique `(userId, tenantId)` |

**Key Rule**: `users.email` stays **globally unique** (Option B). Email is the single identity across all tenants.

---

## Auth & Middleware

| File | Impact | Change Required |
|------|--------|-----------------|
| `src/proxy.ts` | 🔴 | **No subdomain parsing.** Read `activeTenantId` from JWT + cookie. Redirect to `/select-tenant` if missing. Guard `/super/*` for superadmin only. |
| `src/lib/auth.ts` | 🔴 | Global auth (no tenant filter). After login: look up memberships → auto-select if 1, tenant picker if N. Support `?tenant=SLUG` from landing site. |
| `src/lib/api-auth.ts` | 🔴 | `requireAdmin()`/`requireAuth()` returns `activeTenantId` from JWT+cookie. New: `requireSuperAdmin()`, `requireTenantSelected()`. |
| `src/lib/auth-secret.ts` | ⚪ | No change (platform-level secret) |
| `src/types/next-auth.d.ts` | 🔴 | Add `isSuperAdmin`, `activeTenantId`, `tenantSlug`, `membershipRole`, `needsTenantSelection` |

---

## API Routes (47 total)

### Authentication Routes

| Route | Impact | Change |
|-------|--------|--------|
| `POST /api/auth/register` | 🔴 | Accept `tenantSlug` param. Create global user (or reuse if email exists) + create membership + patient. Handle existing user joining new practice. |
| `POST /api/auth/forgot-password` | 🟡 | Global lookup by email (no tenant filter — email is globally unique) |
| `POST /api/auth/reset-password` | 🟡 | Global operation (token → user, no tenant scope) |
| `GET/POST /api/auth/[...nextauth]` | 🔴 | Handled via auth.ts changes |
| **NEW: `POST /api/auth/select-tenant`** | 🆕 | Validate membership, set `active-tenant-id`/`active-tenant-slug`/`membership-role` cookies |

### Admin Routes

| Route | Impact | Change |
|-------|--------|--------|
| `GET /api/dashboard` | 🟡 | All aggregate queries add `WHERE tenantId = activeTenantId` |
| `GET,POST /api/appointments` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT,DELETE /api/appointments/[id]` | 🟡 | Verify appointment belongs to active tenant |
| `GET,POST,PUT /api/payments` | 🟡 | Filter by `activeTenantId` |
| `GET,POST /api/patients` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT,DELETE /api/patients/[id]` | 🟡 | Verify patient belongs to active tenant |
| `POST /api/patients/[id]/create-account` | 🟡 | Create global user (or reuse) + create membership + patient under active tenant |
| `POST /api/patients/[id]/merge` | 🟡 | Both patients must belong to same tenant |
| `GET,POST /api/clinical-records` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT,DELETE /api/clinical-records/[id]` | 🟡 | Verify record belongs to active tenant |
| `GET,POST /api/blog` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT,DELETE /api/blog/[id]` | 🟡 | Verify post belongs to active tenant |
| `GET,POST /api/groups` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT,DELETE /api/groups/[id]` | 🟡 | Verify group belongs to active tenant |
| `GET,POST /api/groups/[id]/members` | 🟡 | Verify group belongs to active tenant |
| `GET,POST /api/availability` | 🟡 | Filter by `activeTenantId` |
| `GET,POST,DELETE /api/blocked-dates` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT /api/settings` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT,DELETE /api/notifications` | 🟡 | Filter by `activeTenantId` |
| `GET,PUT /api/profile` | 🟡 | User is global; role comes from active membership |

### Portal (Patient) Routes

| Route | Impact | Change |
|-------|--------|--------|
| `GET,POST /api/portal/appointments` | 🟡 | Already patient-scoped; add `activeTenantId` check |
| `GET,PUT /api/portal/appointments/[id]` | 🟡 | Verify appointment's tenant matches session |
| `PUT /api/portal/appointments/[id]/notes` | 🟡 | Verify tenant |
| `POST /api/portal/appointments/[id]/cancel` | 🟡 | Verify tenant |
| `POST /api/portal/appointments/recurrence` | 🟡 | Set `tenantId` on new appointments |
| `GET /api/portal/availability` | 🔴 | **Public** — resolve tenant from `?tenant=SLUG` query param |
| `GET /api/portal/booked-slots` | 🔴 | **Public** — resolve tenant from `?tenant=SLUG` query param |
| `GET /api/portal/settings` | 🔴 | **Public** — resolve tenant from `?tenant=SLUG` query param |
| `GET /api/portal/blocked-dates` | 🔴 | **Public** — resolve tenant from `?tenant=SLUG` query param |
| `GET /api/portal/payments` | 🟡 | Verify tenant |
| `GET /api/portal/documents` | 🟡 | Verify tenant |
| `GET,POST /api/portal/consent` | 🟡 | Verify tenant |
| `POST /api/portal/triagem` | 🟡 | Set `tenantId` on triage + notification |
| `GET /api/portal/evolution` | 🟡 | Filter by tenant |
| `PUT /api/portal/profile/password` | ⚪ | Global operation (password is on the global user, no tenant scope) |

### Stripe Routes

| Route | Impact | Change |
|-------|--------|--------|
| `POST /api/stripe/create-checkout` | 🔴 | Use tenant's `stripeAccountId` for Connected Account |
| `POST /api/stripe/webhook` | 🔴 | Route events by `event.account`; resolve tenant from payment metadata |
| `GET /api/stripe/status` | 🟡 | Verify payment belongs to active tenant |
| `POST /api/stripe/test-flow` | 🟢 | Dev only — add tenant context |

### Platform Routes

| Route | Impact | Change |
|-------|--------|--------|
| `POST /api/setup` | 🟢 | Create tenant + admin user + membership in one shot |
| `GET /api/cron/overdue-payments` | 🟡 | Iterate all tenants |
| `POST /api/contact` | 🟢 | Route to tenant via `tenantSlug` in body (from landing site) |

---

## Lib Modules

| File | Impact | Change |
|------|--------|--------|
| `src/lib/db.ts` | ⚪ | No change (singleton, platform-level) |
| `src/lib/stripe.ts` | 🔴 | `getPlatformClient()` + per-tenant `createCheckoutSession()` with `stripe_account`; webhook multi-account |
| `src/lib/jitsi.ts` | 🟡 | `buildRoomName()` prefix with tenant slug |
| `src/lib/notifications.ts` | 🟡 | `createNotification()` requires `tenantId` param |
| `src/lib/payment-access.ts` | 🟡 | `getAuthorizedPayment()` add `tenantId` filter |
| `src/lib/session-pricing.ts` | 🟡 | Pricing per tenant (from `settings` scoped by `tenantId`) |
| `src/lib/availability-slots.ts` | 🟡 | Compute slots per tenant's availability |
| `src/lib/custom-availability.ts` | 🟡 | Per-tenant custom rules |
| `src/lib/rate-limit.ts` | 🟢 | Include `tenantId` in rate-limit key (optional) |
| `src/lib/validations.ts` | 🟢 | Add tenant-related schemas (tenantSlug, onboarding) |
| `src/lib/turnstile.ts` | ⚪ | Platform-level (no change) |
| `src/lib/utils.ts` | 🟢 | WHATSAPP_LINK per tenant (from settings) |
| `src/lib/constants.ts` | ⚪ | No change |
| `src/lib/env.ts` | 🟢 | Add `PLATFORM_DOMAIN`, `PLATFORM_NAME` env vars |

---

## Pages & Components

### Central Platform (`app.MenteVive.com.br`)

| File | Impact | Change |
|------|--------|--------|
| `src/app/page.tsx` | 🟡 | **No longer Bia's landing.** Becomes platform homepage or redirect to `/login`. Bia's landing moves to separate project. |
| `src/app/blog/page.tsx` | 🟡 | Remove from central platform (blog lives on each client's landing site) OR filter by `?tenant=SLUG` |
| `src/app/blog/[slug]/page.tsx` | 🟡 | Same: move to landing site or scope by tenant |
| `src/app/layout.tsx` | 🟢 | Platform-level layout, no tenant branding needed (each page shows tenant name from session) |
| `src/app/admin/layout.tsx` | 🟢 | Show active tenant name in header |
| `src/app/portal/layout.tsx` | 🟢 | Show practice name from active tenant |
| `src/app/login/page.tsx` | 🟡 | Accept `?tenant=SLUG` for pre-selection. Show generic platform branding. |
| `src/app/registro/page.tsx` | 🟡 | Accept `?tenant=SLUG` for context. Create global user + membership. |
| `src/app/robots.ts` | 🟢 | Platform-level robots |
| `src/app/sitemap.ts` | 🟢 | Platform-level sitemap (or remove — landing sites have their own) |
| `src/components/landing/*` | ⚪ | **Move to landing site template.** Not used in central platform. |
| `src/components/JitsiMeet.tsx` | ⚪ | Room name comes from server (already correct) |
| `src/components/TurnstileWidget.tsx` | ⚪ | Platform-level |

### New Pages

| File | Purpose |
|------|---------|
| `src/app/select-tenant/page.tsx` | 🆕 Tenant picker for users with multiple memberships |
| `src/app/super/page.tsx` | 🆕 Super admin dashboard |
| `src/app/super/tenants/page.tsx` | 🆕 List all tenants |
| `src/app/super/tenants/[id]/page.tsx` | 🆕 Tenant detail (usage, Stripe status, branding) |
| `src/app/super/billing/page.tsx` | 🆕 Platform revenue overview |

---

## Scripts

| File | Impact | Change |
|------|--------|--------|
| `scripts/seed.ts` | 🟡 | Create tenant + admin user + membership first, then seed data under that tenant |
| `scripts/reset-and-seed-homolog.ts` | 🟡 | Seed multiple test tenants with memberships |
| `scripts/seed-lia-test.ts` | 🟡 | Assign test data to a specific tenant |
| `scripts/ensure-stripe-schema.ts` | 🟢 | Verify `tenantId` columns + `tenants`/`tenant_memberships` tables exist |
| `scripts/validate-local-flow.ts` | 🟡 | Test with tenant context (login → select tenant → admin) |
| **NEW: `scripts/scaffold-client-site.ts`** | 🆕 | Interactive CLI to scaffold a new client landing site from template |
| **NEW: `scripts/migrate-existing-data.ts`** | 🆕 | Backfill tenant #1, create memberships from existing roles, set tenantId on data |

---

## Config Files

| File | Impact | Change |
|------|--------|--------|
| `drizzle.config.ts` | ⚪ | No change |
| `next.config.js` | ⚪ | No domain rewrites needed (Strategy C — no subdomains) |
| `vercel.json` | ⚪ | No wildcard domains needed (Strategy C — separate projects per client) |
| `package.json` | 🟢 | Add `scaffold` and `migrate-data` scripts |
| `tsconfig.json` | ⚪ | No change |

---

## New Files to Create

### Central Platform

| File | Purpose |
|------|---------|
| `src/lib/tenant.ts` | Public tenant resolution from `?tenant=SLUG` param (for public API routes) |
| `src/lib/tenant-db.ts` | Tenant-scoped Drizzle query helpers (`tenantScope()`, `getPublicTenantScope()`) |
| `src/app/select-tenant/page.tsx` | Tenant picker UI |
| `src/app/api/auth/select-tenant/route.ts` | Set tenant cookies after picker selection |
| `src/app/super/*` | Super admin pages (tenant list, detail, billing) |
| `src/app/api/super/*` | Super admin API routes |
| `src/app/api/admin/stripe/connect/route.ts` | Stripe Connect onboarding start |
| `src/app/api/admin/stripe/connect/status/route.ts` | Stripe Connect account status |
| `tests/multi-tenant-isolation.test.ts` | Cross-tenant isolation tests |
| Migration SQL files | Via `drizzle-kit generate` |

### Landing Site Template (Separate Repo)

| File | Purpose |
|------|---------|
| `templates/landing-site/` | Complete Next.js project template for client landing sites |
| `templates/landing-site/src/components/LoginButton.tsx` | Redirect to `app.MenteVive.com.br/login?tenant=SLUG` |
| `templates/landing-site/src/components/RegisterButton.tsx` | Redirect to `app.MenteVive.com.br/registro?tenant=SLUG` |
| `templates/landing-site/.env.local.example` | Required env vars (TENANT_NAME, TENANT_SLUG, PLATFORM_URL, etc.) |

---

## What Does NOT Change (Strategy C Simplifications)

| Item | Why |
|------|-----|
| No subdomain parsing in middleware | Each client has their own landing project. Central platform uses JWT/cookies. |
| No wildcard DNS | No subdomains to resolve. Each landing site has its own custom domain. |
| No `vercel.json` domain config | Separate Vercel projects handle their own domains. |
| `users.email` stays globally unique | Option B: single identity across all tenants. |
| `users` has NO `tenantId` | User is global. Membership links user to tenant. |
| `passwordResetTokens` unchanged | Global operation on global user. |
| No tenant branding in central platform login | Generic platform branding. Client branding only on their own landing site. |
