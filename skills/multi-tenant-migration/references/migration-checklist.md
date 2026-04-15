# Migration Checklist — Strategy C (Hybrid + Option B)

Use this checklist to track progress across all phases. Each item should be checked after implementation AND testing.

## Phase 1: Analysis
- [ ] Run `analyze-tenant-gaps.ts` script
- [ ] Review `multi-tenant-audit.json` output
- [ ] Identify all files requiring changes
- [ ] Create branch `feat/multi-tenant`
- [ ] Document any edge cases discovered

## Phase 2: Schema (Option B — Global Users)
- [ ] Add `tenants` table to `src/db/schema.ts`
- [ ] Add `tenant_memberships` table to `src/db/schema.ts`
- [ ] Add `isSuperAdmin` column to `users` table
- [ ] Change `users.role` to be platform-level only (`superadmin` | `user`)
- [ ] **DO NOT** add `tenantId` to `users` table (it stays global)
- [ ] Add `tenantId` column to `patients` (nullable initially)
- [ ] Add `tenantId` column to `appointments`
- [ ] Add `tenantId` column to `availability`
- [ ] Add `tenantId` column to `clinicalRecords`
- [ ] Add `tenantId` column to `payments`
- [ ] Add `tenantId` column to `documents`
- [ ] Add `tenantId` column to `blogPosts`
- [ ] Add `tenantId` column to `groups`
- [ ] Add `tenantId` column to `groupMembers`
- [ ] Add `tenantId` column to `triages`
- [ ] Add `tenantId` column to `blockedDates`
- [ ] Add `tenantId` column to `settings`
- [ ] Add `tenantId` column to `notifications`
- [ ] Add `tenants` relations (owner, memberships, data tables)
- [ ] Add `tenantMemberships` relations (user, tenant)
- [ ] Add tenant relation to all 13 data tables
- [ ] Generate Drizzle migration: `npx drizzle-kit generate`
- [ ] Run migration on dev DB
- [ ] Execute data backfill script:
  - [ ] Create tenant #1 (Bia / psicolobia)
  - [ ] Create admin membership for Bia
  - [ ] Create patient memberships for all existing patients
  - [ ] Backfill `tenantId` on all 13 data tables
  - [ ] Migrate `users.role` values to `tenant_memberships.role`
  - [ ] Set `users.role` to `user` for all
  - [ ] Set platform owner to `superadmin`
- [ ] Add NOT NULL constraint on `tenantId` after backfill
- [ ] Replace global unique constraints with composite:
  - [ ] `blogPosts.slug` → `(tenantId, slug)`
  - [ ] `blockedDates.date` → `(tenantId, date)`
  - [ ] `settings.key` → `(tenantId, key)`
  - [ ] `patients.userId` → `(tenantId, userId)` — same user can be patient in multiple tenants
- [ ] **Keep** `users.email` as globally unique (Option B)
- [ ] Add performance indexes on `tenantId` columns
- [ ] Add indexes on `tenant_memberships` (userId, tenantId)
- [ ] Verify: `npx drizzle-kit push` succeeds
- [ ] Verify: existing data intact after migration

## Phase 3: Auth (Global Login + Tenant Picker)
- [ ] Update `src/types/next-auth.d.ts`:
  - [ ] Add `isSuperAdmin`, `activeTenantId`, `tenantSlug`, `membershipRole`, `needsTenantSelection`
  - [ ] Remove old `role` from JWT/Session (replaced by `membershipRole`)
- [ ] Update `src/lib/auth.ts`:
  - [ ] `authorize()`: authenticate globally (no tenant filter)
  - [ ] Look up `tenant_memberships` after auth
  - [ ] Handle `?tenant=SLUG` from client's login button
  - [ ] Auto-select if 1 membership
  - [ ] Set `needsTenantSelection` if N memberships
  - [ ] Reject if 0 memberships (and not superadmin)
  - [ ] JWT callback: propagate new fields
  - [ ] Session callback: expose new fields
- [ ] Create `POST /api/auth/select-tenant`:
  - [ ] Validate membership exists for user+tenant
  - [ ] Set `active-tenant-id`, `active-tenant-slug`, `membership-role` cookies
- [ ] Create `/select-tenant` page (tenant picker UI)
- [ ] Update `src/lib/api-auth.ts`:
  - [ ] `requireAdmin()` returns `activeTenantId` from JWT/cookie
  - [ ] `requireAuth()` returns `activeTenantId` from JWT/cookie
  - [ ] New: `requireSuperAdmin()` — checks `isSuperAdmin`
  - [ ] New: `requireTenantSelected()` — redirects if no active tenant
- [ ] Update `/login` page to accept `?tenant=SLUG`
- [ ] Update `/registro` page to accept `?tenant=SLUG`
- [ ] Test: login with ?tenant → auto-select → correct dashboard
- [ ] Test: login without ?tenant, 1 membership → auto-select
- [ ] Test: login without ?tenant, N memberships → tenant picker
- [ ] Test: superadmin login → /super dashboard
- [ ] Test: login with 0 memberships → rejected

## Phase 4: Middleware (Platform Route Guards)
- [ ] Update `src/proxy.ts`:
  - [ ] Remove any subdomain parsing logic
  - [ ] Add: redirect to `/select-tenant` if no `activeTenantId` for `/admin/*` or `/portal/*`
  - [ ] Add: `/super/*` requires `isSuperAdmin`
  - [ ] Keep existing auth guards for `/admin/*` and `/portal/*`
  - [ ] Read `activeTenantId` from JWT + cookie fallback
  - [ ] Read `membershipRole` from JWT + cookie fallback
- [ ] Test: unauthenticated → redirect to /login
- [ ] Test: no tenant selected → redirect to /select-tenant
- [ ] Test: non-superadmin accessing /super → 403
- [ ] Test: public routes still work without auth

## Phase 5: Query Layer
- [ ] Create `src/lib/tenant-db.ts` (tenant-scoped query helpers)
- [ ] Create `src/lib/tenant.ts` (public tenant resolution from `?tenant=` param)
- [ ] Update admin routes (18 route files):
  - [ ] `/api/dashboard`
  - [ ] `/api/appointments` + `/api/appointments/[id]`
  - [ ] `/api/payments`
  - [ ] `/api/patients` + `/api/patients/[id]` + subroutes
  - [ ] `/api/clinical-records` + `/api/clinical-records/[id]`
  - [ ] `/api/blog` + `/api/blog/[id]`
  - [ ] `/api/groups` + `/api/groups/[id]` + members
  - [ ] `/api/availability`
  - [ ] `/api/blocked-dates`
  - [ ] `/api/settings`
  - [ ] `/api/notifications`
  - [ ] `/api/profile`
- [ ] Update portal routes (14 route files):
  - [ ] `/api/portal/appointments` + subroutes (4 files)
  - [ ] `/api/portal/availability` → accept `?tenant=` param (public)
  - [ ] `/api/portal/booked-slots` → accept `?tenant=` param (public)
  - [ ] `/api/portal/settings` → accept `?tenant=` param (public)
  - [ ] `/api/portal/blocked-dates` → accept `?tenant=` param (public)
  - [ ] `/api/portal/payments`
  - [ ] `/api/portal/documents`
  - [ ] `/api/portal/consent`
  - [ ] `/api/portal/triagem`
  - [ ] `/api/portal/evolution`
  - [ ] `/api/portal/profile/password`
- [ ] Update auth routes:
  - [ ] `/api/auth/register` — accept `tenantSlug`, create global user + membership + patient
  - [ ] `/api/auth/forgot-password` — global user lookup (no tenant filter)
  - [ ] `/api/auth/reset-password` — global operation
- [ ] Update Stripe routes:
  - [ ] `/api/stripe/create-checkout` — use tenant's `stripeAccountId`
  - [ ] `/api/stripe/webhook` — resolve tenant from payment
  - [ ] `/api/stripe/status` — verify payment belongs to tenant
  - [ ] `/api/stripe/test-flow` — add tenant context
- [ ] Update platform routes:
  - [ ] `/api/setup` — create tenant + admin + membership
  - [ ] `/api/cron/overdue-payments` — iterate all tenants
  - [ ] `/api/contact` — route to tenant
- [ ] Update lib modules:
  - [ ] `src/lib/notifications.ts` — tenantId param
  - [ ] `src/lib/payment-access.ts` — tenantId filter
  - [ ] `src/lib/jitsi.ts` — tenant prefix in room names
  - [ ] `src/lib/session-pricing.ts` — per-tenant pricing
  - [ ] `src/lib/availability-slots.ts` — per-tenant slots

## Phase 6: Stripe Connect
- [ ] Update `src/lib/stripe.ts`:
  - [ ] `getPlatformClient()` — platform Stripe client
  - [ ] `createConnectedAccount()`
  - [ ] `createAccountLink()`
  - [ ] `checkAccountStatus()`
  - [ ] `createCheckoutSession()` with `stripeAccount` param
- [ ] New route: `POST /api/admin/stripe/connect`
- [ ] New route: `GET /api/admin/stripe/connect/status`
- [ ] Update webhook for multi-account events (`event.account`)
- [ ] Add `account.updated` event handler
- [ ] Configure platform application fee
- [ ] Update Stripe dashboard webhook URL to `app.MenteVive.com.br/api/stripe/webhook`
- [ ] Test: connected account onboarding flow
- [ ] Test: checkout on behalf of connected account
- [ ] Test: webhook routes to correct tenant

## Phase 7: Landing Site Template
- [ ] Create `templates/landing-site/` directory structure
- [ ] Extract landing components from current `src/app/page.tsx`
- [ ] Make components configurable via env vars
- [ ] Create `LoginButton.tsx` → redirect to platform `/login?tenant=SLUG`
- [ ] Create `RegisterButton.tsx` → redirect to platform `/registro?tenant=SLUG`
- [ ] Create `.env.local.example` with all required vars
- [ ] Create `scripts/scaffold-client-site.ts`
- [ ] Test scaffold: generate a test landing site
- [ ] Deploy test landing site to Vercel
- [ ] Test login flow: landing → platform → admin dashboard
- [ ] Document: Vercel deploy & domain setup process
- [ ] Migrate Bia's landing site content to template
- [ ] Update central platform `/` to be platform homepage (not Bia's landing)

## Phase 8: Platform UI
- [ ] New role: `superadmin` guards in middleware + UI
- [ ] Create `/super/tenants` page (list tenants)
- [ ] Create `/super/tenants/[id]` page (tenant detail, usage, Stripe status)
- [ ] Create `/super/billing` page (platform revenue)
- [ ] Create `/select-tenant` page (tenant picker)
- [ ] Update admin layout: show tenant name in header
- [ ] Update portal layout: show practice name
- [ ] Update login page: accept `?tenant=` for pre-selection
- [ ] Update register page: accept `?tenant=` for context
- [ ] Update Jitsi room names: prefix with tenant slug
- [ ] Test: each tenant sees their own branding in admin/portal
- [ ] Test: super admin can view all tenants

## Phase 9: Tests
- [ ] Create `tests/multi-tenant-isolation.test.ts`
- [ ] Test: Tenant A admin cannot see Tenant B patients
- [ ] Test: Tenant A patient cannot see Tenant B appointments
- [ ] Test: Stripe webhook for Tenant A doesn't update Tenant B
- [ ] Test: User with memberships in A+B sees correct data per active tenant
- [ ] Test: Tenant picker shows only user's memberships
- [ ] Test: Manipulated tenantId in request is ignored
- [ ] Test: User without membership → blocked
- [ ] Test: Expired/cancelled membership → access denied
- [ ] Test: Global user operations (password reset) work regardless of tenant
- [ ] Run existing test suite: zero regressions
- [ ] Test: scaffold script generates working landing site
- [ ] Test: login flow from each client's landing → platform → dashboard
- [ ] Load test: 10 tenants × 50 patients each

## Deployment
- [ ] Set up platform Vercel project (Pro plan, $20/mo)
- [ ] Configure platform domain: `app.MenteVive.com.br`
- [ ] Run DB migration on production Neon
- [ ] Run data backfill script on production
- [ ] Deploy platform to Vercel
- [ ] Deploy Bia's landing site as separate Vercel project
- [ ] Configure DNS for `psicolobia.com.br` → landing site
- [ ] Test full flow in production
- [ ] Verify Stripe Connect webhook endpoint updated
- [ ] Monitor: zero errors for 48h before onboarding next tenant
- [ ] Test: Tenant A admin cannot see Tenant B data
- [ ] Test: Tenant A patient cannot see Tenant B data
- [ ] Test: Cross-tenant JWT rejected
- [ ] Test: Public routes scoped by subdomain
- [ ] Test: Stripe webhook routes correctly per tenant
- [ ] Test: Blog posts scoped per tenant
- [ ] Test: Jitsi rooms different per tenant
- [ ] Test: Registration creates user in correct tenant
- [ ] Test: Cron job processes all tenants
- [ ] Run existing test suite — zero regressions
- [ ] Manual E2E test with two test tenants

## Deployment
- [ ] Configure wildcard domain on Vercel
- [ ] Configure DNS (A/AAAA + CNAME wildcard)
- [ ] Run migration on production DB
- [ ] Execute production backfill (current data → tenant #1)
- [ ] Verify production: all existing functionality works
- [ ] Create first additional test tenant
- [ ] Verify test tenant: register, login, schedule, pay
- [ ] Monitor for 48h: errors, cross-tenant issues
