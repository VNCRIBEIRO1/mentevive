---
name: tenant-branding-audit
description: "Audit multi-tenant SaaS for hardcoded tenant branding: therapist names, CRP numbers, phone numbers, WhatsApp links, photos, bio text. Detects data leaks between tenants. Use when: checking branding isolation, auditing tenant data leaks, platform cleanup, removing hardcoded professional names, verificar vazamento de dados entre tenants, limpar branding hardcoded."
argument-hint: "Specify scope: 'full', 'landing', 'platform', 'api', 'consent'"
---

# Tenant Branding Audit

Systematic detection and remediation of hardcoded tenant-specific content in a shared multi-tenant platform.

## When to Use

- After migrating from single-tenant to multi-tenant
- Before onboarding a new tenant
- After significant UI/component changes
- When users report seeing another tenant's information
- Periodic compliance audits (LGPD)

## Risk Classification

| Severity | Pattern | Impact |
|----------|---------|--------|
| **CRITICAL** | Phone/WhatsApp hardcoded in shared components | Patient contacts wrong therapist |
| **CRITICAL** | Name/CRP in consent forms | Legal liability (invalid consent) |
| **HIGH** | Professional bio/photo in platform UI | Brand confusion, trust erosion |
| **MEDIUM** | Tenant-specific copy in shared landing | Incorrect onboarding experience |
| **LOW** | Dead code with old branding | Technical debt, no user impact |

## Scan Commands

### 1. Personal Names & CRP Numbers
```bash
# Search for hardcoded therapist names (adjust patterns per known tenants)
grep -rn "Beatriz\|Bea \|CRP.*06\|CRP.*[0-9]\{2\}/[0-9]" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .next

# Search for any CRP pattern (XX/XXXXXX)
grep -rn "CRP [0-9]\{2\}/[0-9]\{4,\}" src/ --include="*.ts" --include="*.tsx"
```

### 2. WhatsApp / Phone Numbers
```bash
# Hardcoded Brazilian phone numbers
grep -rn "wa\.me/55[0-9]\{10,\}\|5511[0-9]\{8,9\}\|(11).*[0-9]\{4\}-[0-9]\{4\}" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# WhatsApp fallback patterns
grep -rn "WHATSAPP_LINK\|whatsappHref\|wa\.me" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

### 3. Orphaned Components
```bash
# Find components that are never imported
for f in $(find src/components/landing -name "*.tsx" | sort); do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" src/ --include="*.ts" --include="*.tsx" | grep -v "$f" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "⚠️ ORPHANED: $f"
  fi
done
```

### 4. Consent & Legal Forms
```bash
# Legal text with personal references
grep -rn "psicólog[oa]\|terapeuta\|profissional" src/app/portal/consentimento/ --include="*.tsx"
grep -rn "CRP\|LGPD\|consentimento" src/ --include="*.tsx" | grep -v node_modules
```

### 5. Landing / Platform Shared Content
```bash
# Check if platform components reference tenant-specific data
grep -rn "PROFESSIONAL_NAME\|TENANT_DISPLAY\|WHATSAPP_DISPLAY" src/components/platform/ --include="*.tsx"

# Check env-driven vs hardcoded
grep -rn "process\.env\|import.*config\|import.*tenant" src/components/platform/ --include="*.tsx"
```

## Remediation Patterns

### Pattern 1: Replace hardcoded name with generic text
```typescript
// ❌ BAD — hardcoded professional name in shared platform
<p>Psicóloga Beatriz Ribeiro — CRP 06/173961</p>

// ✅ GOOD — generic reference
<p>O profissional responsável por este consultório</p>

// ✅ BETTER — dynamic from tenant config
<p>{tenant.professionalName} — {tenant.crpNumber}</p>
```

### Pattern 2: Conditional WhatsApp rendering
```typescript
// ❌ BAD — fallback to specific number
const whatsappHref = WHATSAPP_LINK || "https://wa.me/5511988840525";

// ✅ GOOD — hide when not configured
const whatsappHref = WHATSAPP_LINK || "";
// In JSX:
{whatsappHref && (
  <a href={whatsappHref}>WhatsApp</a>
)}
```

### Pattern 3: Orphaned component cleanup
```
1. Search for all imports of the component
2. If zero imports found → mark as orphaned
3. Check if component contains tenant-specific branding
4. If yes → DELETE (don't just comment out)
5. Update barrel files (index.ts) to remove exports
6. Run tsc --noEmit to verify no broken imports
7. Delete any tests that only test deleted components
```

### Pattern 4: Consent form with tenant-scoped data
```typescript
// ❌ BAD — hardcoded legal entity
"Ao utilizar os serviços de Beatriz Ribeiro (CRP 06/173961)..."

// ✅ GOOD — generic (if no tenant profile data available)
"Ao utilizar os serviços do profissional responsável por este consultório..."

// ✅ BETTER — fetch from tenant profile
const tenant = await getTenantProfile(tenantId);
`Ao utilizar os serviços de ${tenant.professionalName} (${tenant.crpNumber})...`
```

## Verification Checklist

After remediation, verify:

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `grep -rn "Beatriz\|CRP 06" src/` returns zero results (adjust per tenant)
- [ ] All platform components use env vars or tenant config, not hardcoded values
- [ ] Consent forms use generic or dynamic text
- [ ] WhatsApp links have conditional rendering
- [ ] No orphaned components remain
- [ ] Barrel exports (index.ts) match existing files only
- [ ] Tests reference only existing components

## Known Issues Found (2025-07-25 Audit)

| ID | Severity | File | Issue | Status |
|----|----------|------|-------|--------|
| C2 | CRITICAL | `portal/consentimento/page.tsx` | Hardcoded "Beatriz Ribeiro — CRP 06/173961" | ✅ Fixed |
| C3 | CRITICAL | `platform/Platform{Nav,Hero,CTA,Pricing}.tsx` | WhatsApp fallback to Beatriz's number | ✅ Fixed |
| C4 | MEDIUM | `components/landing/` (15 files) | Orphaned components with hardcoded branding | ✅ Deleted |
| M5 | MEDIUM | `platform/PlatformPricing.tsx` | "Basic" instead of "Básico" | ✅ Fixed |

## Known Issues Found (2025-07-26 Audit)

| ID | Severity | File | Issue | Status |
|----|----------|------|-------|--------|
| B1 | HIGH | `portal/agendar/page.tsx` | 3x hardcoded "Bea" in scheduling text | ✅ Fixed → PROFESSIONAL_NAME dynamic |

### Pattern 5: Dynamic professional name in platform
```typescript
// ❌ BAD — hardcoded nickname in shared platform page
"...mensagem com a Bea."
"...para a Bea, sem compromisso..."

// ✅ GOOD — dynamic with env var fallback
import { PROFESSIONAL_NAME } from "@/lib/utils";
`...mensagem com ${PROFESSIONAL_NAME || "seu/sua psicólogo(a)"}.`
`...para ${PROFESSIONAL_NAME || "seu/sua psicólogo(a)"}, sem compromisso...`
```
