---
name: saas-flow-audit
description: "Audit and validate SaaS flows end-to-end: CDKey generation/redemption, trial activation (30/90 days), subscription lifecycle, plan feature gating, admin panel flows, psychologist admin flows, portal patient flows, landing page integration, auth guards, tenant onboarding. Use when: validating cdkey, testing trial, checking subscription, auditing admin routes, verifying feature unlock, testing flow end-to-end, verificar cdkey, testar trial, validar assinatura, auditar admin, verificar desbloqueio de recursos."
argument-hint: "Specify flow: 'cdkey', 'trial', 'subscription', 'admin', 'portal', 'landing', 'auth', 'full'"
---

# SaaS Flow Audit

End-to-end validation of all critical SaaS flows in the MenteVive ecosystem.

## When to Use

- Validating CDKey generation and redemption lifecycle
- Testing trial activation and expiration (30/90 days)
- Checking that plan features are properly gated
- Auditing admin panel functionality
- Verifying portal patient flows
- Testing landing page → platform integration
- After any change to auth, subscription, or tenant logic

## Critical Files Map

| Flow | Key Files |
|------|-----------|
| CDKey Generation | `src/app/api/super/cdkeys/route.ts`, `src/app/super/cdkeys/page.tsx` |
| CDKey Redemption | `src/app/api/admin/subscription/cdkey/route.ts`, `src/app/admin/assinatura/page.tsx` |
| Trial/Subscription | `src/db/schema.ts` (tenants table: plan, subscriptionStatus, trialEndsAt) |
| Auth Guards | `src/lib/api-auth.ts` (requireSuperAdmin, requireAdmin, requireAuth) |
| Tenant Resolution | `src/lib/tenant.ts`, `src/lib/tenant-db.ts` |
| Stripe | `src/lib/stripe.ts`, `src/app/api/stripe/*/route.ts` |
| Admin Layout | `src/app/admin/layout.tsx` |
| Super Layout | `src/app/super/layout.tsx` |
| Portal Layout | `src/app/portal/layout.tsx` |
| Landing Config | `mentevive-psicolobia/lib/tenant.config.ts` |

## Flow 1: CDKey Lifecycle

### 1.1 Generation (Super Admin)

**Route:** `POST /api/super/cdkeys`

**Validation checklist:**
- [ ] Auth: Only `isSuperAdmin === true` can access
- [ ] Input validation: plan (free/starter/professional/enterprise), quantity (1-50), durationDays
- [ ] Code format: 16-char hex, cryptographically random
- [ ] Uniqueness: codes must be unique in DB
- [ ] Batch creation: generates correct quantity
- [ ] Response: returns generated codes with metadata

**Test procedure:**
```bash
# 1. Check auth guard
grep -n "requireSuperAdmin\|isSuperAdmin" src/app/api/super/cdkeys/route.ts

# 2. Check code generation logic
grep -n "randomBytes\|crypto\|uuid\|nanoid" src/app/api/super/cdkeys/route.ts

# 3. Check DB insert
grep -n "insert\|cdkeys" src/app/api/super/cdkeys/route.ts
```

### 1.2 Listing (Super Admin)

**Route:** `GET /api/super/cdkeys`

**Validation checklist:**
- [ ] Returns all CDKeys with stats (total, redeemed, available)
- [ ] Includes: code, plan, durationDays, tenantId (if redeemed), redeemedAt, createdAt
- [ ] Pagination or reasonable limit

### 1.3 Redemption (Tenant Admin)

**Route:** `POST /api/admin/subscription/cdkey`

**Validation checklist:**
- [ ] Auth: `requireAdmin()` — must have tenantId
- [ ] Input: accepts `code` string
- [ ] Validates code exists and is NOT already redeemed (`redeemedAt IS NULL`)
- [ ] Sets `redeemedAt = now()` on the CDKey record
- [ ] Links CDKey to current tenant (`tenantId`)
- [ ] Updates tenant record:
  - `plan` → CDKey's plan value
  - `subscriptionStatus` → 'trialing' or 'active'
  - `trialEndsAt` → `now() + durationDays`
- [ ] Returns success with new subscription status
- [ ] Error handling: invalid code, already redeemed, expired

**Test procedure:**
```bash
# Check redemption logic
grep -n "redeemedAt\|trialEndsAt\|subscriptionStatus\|plan" src/app/api/admin/subscription/cdkey/route.ts
```

## Flow 2: Trial & Subscription Lifecycle

### 2.1 Trial Activation

After CDKey redemption, tenant should have:
- `plan`: matches CDKey plan
- `subscriptionStatus`: 'trialing'
- `trialEndsAt`: current date + durationDays (30 or 90)

### 2.2 Trial Expiration Check

**Must exist somewhere in the codebase:**
- Middleware or API check that compares `trialEndsAt` with `now()`
- If expired: restrict access to premium features or show upgrade prompt
- If active: allow full access per plan level

**Search for:**
```bash
grep -rn "trialEndsAt\|isTrialExpired\|subscription.*expired\|trial.*check" src/
```

### 2.3 Plan Feature Gating

Each plan should gate different features:

### Planos Reais do MenteVive

| Plano | Preço Setup | Trial | Mensal pós-trial | Anual pós-trial |
|-------|-------------|-------|-----------------|----------------|
| **Básico** | R$ 399 (único) | 30 dias | R$ 59,90/mês | R$ 499/ano |
| **Pro** | R$ 499 (único) | 90 dias | R$ 59,90/mês | R$ 499/ano |

| Feature | Básico (trial) | Pro (trial) | Pós-trial (pago) | Expirado |
|---------|---------------|-------------|-----------------|----------|
| Landing page | ✅ vitalícia | ✅ vitalícia | ✅ vitalícia | ✅ vitalícia |
| Pacientes | ✅ ilimitados | ✅ ilimitados | ✅ ilimitados | ❌ bloqueado |
| Agenda | ✅ | ✅ | ✅ | ❌ bloqueado |
| Prontuários | ✅ | ✅ | ✅ | ❌ bloqueado |
| Financeiro | ✅ | ✅ | ✅ | ❌ bloqueado |
| Sala de Espera | ✅ | ✅ | ✅ | ❌ bloqueado |
| Blog | ❌ | ✅ | ✅ | ❌ |
| Grupos | ❌ | ✅ | ✅ | ❌ |
| Stripe Connect | ❌ | ✅ | ✅ | ❌ |

**Verify:** Search for plan-based feature checks:
```bash
grep -rn "plan.*===\|checkPlan\|featureGat\|isPlanAllowed\|subscriptionStatus" src/
```

## Flow 3: Admin Panel Verification

### Routes to Check

| Route | Expected Behavior |
|-------|-------------------|
| `/admin` | Dashboard with tenant-scoped stats |
| `/admin/pacientes` | Patient list filtered by tenantId |
| `/admin/agenda` | Appointments for current tenant only |
| `/admin/financeiro` | Payments/invoices for tenant |
| `/admin/prontuarios` | Clinical records for tenant patients only |
| `/admin/horarios` | Availability slots for tenant therapist |
| `/admin/sala-espera` | Jitsi rooms for tenant appointments |
| `/admin/assinatura` | Current plan, trial status, CDKey input |
| `/admin/configuracoes` | Stripe Connect, profile settings |
| `/admin/blog` | Blog posts for tenant |
| `/admin/grupos` | Group therapy management |

### Verification per route:
1. Read the page component → check data fetching uses tenant-scoped queries
2. Read the API route it calls → check `requireAdmin()` is present
3. Check the DB query → `tenantId` filter present via `tenant-db.ts` helpers or explicit `.where()`

## Flow 4: Super Admin Panel

| Route | Expected |
|-------|----------|
| `/super` | Platform-wide dashboard (all tenants) |
| `/super/tenants` | List all tenants with status |
| `/super/tenants/[id]` | Edit tenant plan/status |
| `/super/cdkeys` | Generate and list CDKeys |

**Auth:** All routes must check `isSuperAdmin === true`.

## Flow 5: Portal Paciente

| Route | Expected |
|-------|----------|
| `/portal` | Patient dashboard (their appointments) |
| `/portal/sessoes` | Session list for patient in current tenant |
| `/portal/pagamentos` | Payment history |
| `/portal/documentos` | Shared documents |
| `/portal/triagem` | Intake/triage forms |
| `/portal/agendar` | Book new appointment |
| `/portal/sala-espera` | Join Jitsi room |

**Auth:** All routes check `requireAuth()` + verify patient belongs to current tenant.

## Flow 6: Landing → Platform Integration

### Checklist:
- [ ] `tenant.config.ts` has correct `platformUrl` pointing to MenteVive platform
- [ ] "Entrar" button links to `{platformUrl}/login?tenant={slug}`
- [ ] "Agendar" button links to `{platformUrl}/registro?tenant={slug}`
- [ ] No API calls from landing to platform (landing is static)
- [ ] SEO meta tags use tenant-specific data
- [ ] No hardcoded "localhost" or dev URLs in production config

### Test:
```bash
# In mentevive-psicolobia
grep -rn "platformUrl\|login\?tenant\|registro\?tenant\|localhost" app/ lib/
```

## Automated Audit Script

When running a full audit, execute these checks in sequence:

```bash
# 1. TypeScript compilation check
cd mentevive && npx tsc --noEmit 2>&1 | head -50

# 2. Multi-tenant scoping audit
grep -rn "\.where(" src/app/api/ | grep -v "tenantId\|node_modules" | head -30

# 3. Auth guard coverage
for route in $(find src/app/api -name "route.ts" | sort); do
  echo "--- $route ---"
  grep -c "requireAdmin\|requireAuth\|requireSuperAdmin" "$route" || echo "⚠️ NO AUTH GUARD"
done

# 4. CDKey references
grep -rn "cdkey\|cdKey\|CDKey\|cd_key" src/ --include="*.ts" --include="*.tsx"

# 5. Trial expiration references
grep -rn "trialEndsAt\|trial.*expir\|isExpired\|subscription.*check" src/ --include="*.ts" --include="*.tsx"

# 6. Hardcoded tenant references in platform
grep -rn "Psicolobia\|psicolobia\|Beatriz\|CRP.*06" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules\|\.next"

# 7. Landing integration
cd ../mentevive-psicolobia && grep -rn "platformUrl\|vercel\.app\|localhost" app/ lib/

# 8. Run tests
cd ../mentevive && npx vitest run 2>&1 | tail -20
```

## Remediation Patterns

### Missing tenantId filter
```typescript
// ❌ BAD — no tenant scoping
const patients = await db.select().from(patientsTable);

// ✅ GOOD — tenant-scoped
const patients = await db.select().from(patientsTable)
  .where(eq(patientsTable.tenantId, tenantId));
```

### Missing auth guard
```typescript
// ❌ BAD — no auth check
export async function GET(req: NextRequest) {
  const data = await db.select()...

// ✅ GOOD — auth + tenant extraction
export async function GET(req: NextRequest) {
  const { tenantId } = await requireAdmin();
  const data = await db.select()...where(eq(...tenantId))...
```

### Missing trial check
```typescript
// ✅ Add to admin layout or middleware
const tenant = await getTenant(tenantId);
if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) < new Date()) {
  // Trial expired — show upgrade prompt or restrict features
}
```
