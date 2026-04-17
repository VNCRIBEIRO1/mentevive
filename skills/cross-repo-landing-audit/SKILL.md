---
name: cross-repo-landing-audit
description: "Audit cross-repo URL consistency, redirect chains, SEO files, and branding isolation across multi-tenant SaaS repos (platform, tenant landing, legacy redirect). Use when: deploying new tenant, renaming Vercel project, checking redirect chains, auditing canonical URLs, verifying SEO consistency across repos, fixing stale URLs in sitemap/robots, verificar URLs entre repos, auditoria de redirecionamento, consistência de branding entre repos."
argument-hint: "Specify scope: 'full', 'urls-only', 'seo-only', 'redirects-only', 'branding-only'"
---

# Cross-Repo Landing Audit

Systematic audit of URL consistency, redirect chains, and branding isolation across the multi-repo ecosystem.

## Architecture

```
Platform repo (mentevive)        → mentevive.vercel.app
Tenant landing repo (clone)      → {tenant}.vercel.app
Legacy redirect repo (psicolobia) → psicolobia.com → {tenant}.vercel.app
```

Each tenant gets a clone of the landing template. The platform is shared. Legacy repos redirect to the correct tenant landing.

## When to Use

- Before/after deploying a new tenant landing
- After renaming a Vercel project
- After changing a custom domain
- Before onboarding a second tenant
- Periodic consistency checks

## Audit Checklist

### 1. URL Consistency Across Repos

Every repo that references the tenant landing must use the SAME canonical URL.

```bash
# In tenant landing repo — find all URL references
grep -rn "vercel\.app\|\.com\.br\|https://" lib/ app/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# In legacy redirect repo — check all redirect destinations
grep -rn "destination\|redirect\|href\|url" next.config.js src/ --include="*.ts" --include="*.tsx" --include="*.js"

# In platform repo — check for stale tenant URLs
grep -rn "mentevive-psicolobia\|psicolobia\.vercel" src/ --include="*.ts" --include="*.tsx"
```

**Key files to verify:**
| File | What to check |
|------|---------------|
| `tenant.config.ts` → `urls.siteUrl` | Canonical URL (used in SEO, og:url, canonical) |
| `package.json` → `name` | Must match tenant slug, not old project name |
| `next.config.js` (legacy) | All redirect `destination` fields |
| `page.tsx` (legacy) | `redirect()` target |
| `error.tsx` (legacy) | Fallback link href |
| `sitemap.ts` | All `url` values |
| `robots.ts` | Sitemap URL reference |
| `.env.local` | `NEXT_PUBLIC_SITE_URL` must match canonical |

### 2. Redirect Chain Validation

Ensure no redirect loops or stale hops.

```bash
# Test redirect chain from legacy domain
curl -sI https://psicolobia.vercel.app | head -5
curl -sI https://psicolobia.vercel.app/login | head -5

# Verify each redirect destination resolves
# Expected: 
#   / → {tenant}.vercel.app (landing)
#   /login → mentevive.vercel.app/login (platform)
#   /portal/* → mentevive.vercel.app/portal/* (platform)
#   /admin/* → mentevive.vercel.app/admin/* (platform)
```

**Split rules:**
| Path pattern | Must redirect to | Why |
|-------------|-----------------|-----|
| `/` | Tenant landing | Client's public site |
| `/blog/*` | Tenant landing `/blog/*` | Client's blog |
| `/login`, `/registro` | Platform `/login`, `/registro` | Shared auth |
| `/admin/*` | Platform `/admin/*` | Shared dashboard |
| `/portal/*` | Platform `/portal/*` | Shared patient portal |
| `/redefinir-senha` | Platform `/redefinir-senha` | Shared auth |

### 3. SEO Consistency

```bash
# sitemap.ts must reference ONLY the tenant landing URL
grep -n "url:" app/sitemap.ts  # or src/app/sitemap.ts

# robots.ts sitemap must match sitemap.ts base URL
grep -n "sitemap" app/robots.ts  # or src/app/robots.ts

# og:url / canonical in layout.tsx must use tenant config URL
grep -rn "og:url\|canonical\|metadataBase" app/layout.tsx
```

### 4. Branding Isolation (Platform name vs Client name)

**Acceptable references to platform name ("MenteVive") in tenant landing:**
- CTAs that upsell the platform: "Crie seu consultório no MenteVive"
- Platform login/register links
- Chatbot suggesting platform features
- Comments in code referencing the template origin

**NOT acceptable:**
- Footer saying "Psicolobia e MenteVive" (client footer should only show client name)
- Page titles mixing both names
- SEO metadata with platform name instead of client name

```bash
# Find platform name in tenant landing
grep -rn "MenteVive\|mentevive" app/ lib/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Classify each match as:
# ✅ ACCEPTABLE: platform upsell CTA, code comments, config references
# ❌ NOT ACCEPTABLE: footer branding, page title, SEO metadata, canonical URL
```

### 5. Environment Variables

```bash
# Tenant landing .env.local must have:
# NEXT_PUBLIC_PLATFORM_URL=https://mentevive.vercel.app
# NEXT_PUBLIC_SITE_URL=https://{tenant}.vercel.app
# NEXT_PUBLIC_TENANT_SLUG={tenant-slug}

# Verify .env.local exists and has all required vars
cat .env.local 2>/dev/null || echo "⚠️ .env.local missing"
```

**Critical: `siteUrl` in tenant.config.ts has a fallback.** If `.env.local` is missing `NEXT_PUBLIC_SITE_URL`, the fallback URL will be used for ALL SEO (sitemap, robots, og:url, canonical). This was the root cause of the mentevive-psicolobia URL leak.

### 6. Vercel Project Settings

**Cannot be fixed via code — must check Vercel dashboard:**
- `.vercel/project.json` → `projectName` matches desired subdomain?
- Vercel dashboard → Project → Settings → Domains → correct domain(s) configured?
- If renaming project: Vercel does NOT auto-update the `{name}.vercel.app` subdomain. You need to create a new project or add a custom domain.

## Remediation Patterns

### Pattern 1: URL migration across repos
```
1. Update tenant.config.ts siteUrl fallback
2. Add/update NEXT_PUBLIC_SITE_URL in .env.local
3. Update package.json name
4. Update legacy repo redirects (next.config.js)
5. Update legacy repo pages (page.tsx, error.tsx)
6. Update legacy repo SEO (sitemap.ts, robots.ts)
7. Run tsc --noEmit on ALL repos
8. Commit and push ALL repos
9. Verify Vercel deployment picks up changes
```

### Pattern 2: Footer branding fix
```typescript
// ❌ BAD — mixing platform and client names in client footer
"Psicolobia e MenteVive - {year}."

// ✅ GOOD — client name only
"Psicolobia © {year}"

// ✅ ALSO GOOD — if dynamic
`${tenantConfig.name} © ${new Date().getFullYear()}`
```

### Pattern 3: .env.local protection
```
# .env.local should ALWAYS be in .gitignore
# But fallbacks in tenant.config.ts MUST match the intended production URL
# because .env.local won't exist in Vercel build unless Vercel env vars are set
```

## Known Issues Found (2025-07-26 Audit)

| ID | Severity | Repo | File | Issue | Status |
|----|----------|------|------|-------|--------|
| U1 | CRITICAL | mentevive-psicolobia | `tenant.config.ts` | siteUrl fallback → mentevive-psicolobia.vercel.app | ✅ Fixed → psicolobia.vercel.app |
| U2 | CRITICAL | psicolobia | `next.config.js` | 2 redirect destinations → mentevive-psicolobia | ✅ Fixed |
| U3 | CRITICAL | psicolobia | `page.tsx` | redirect() target → mentevive-psicolobia | ✅ Fixed |
| U4 | HIGH | psicolobia | `sitemap.ts` | Canonical URL → mentevive-psicolobia | ✅ Fixed |
| U5 | HIGH | psicolobia | `robots.ts` | Sitemap URL → mentevive-psicolobia | ✅ Fixed |
| U6 | HIGH | psicolobia | `error.tsx` | Fallback link → mentevive-psicolobia | ✅ Fixed |
| U7 | MEDIUM | mentevive-psicolobia | `Footer.tsx` | "Psicolobia e MenteVive" in client footer | ✅ Fixed → "Psicolobia ©" |
| U8 | MEDIUM | mentevive-psicolobia | `package.json` | name = "mentevive-psicolobia" | ✅ Fixed → "psicolobia" |
| U9 | LOW | mentevive-psicolobia | `.env.local` | Missing NEXT_PUBLIC_SITE_URL | ✅ Fixed (added) |
| U10 | INFO | mentevive-psicolobia | `.vercel/project.json` | projectName still "mentevive-psicolobia" | ⚠️ Vercel dashboard action needed |
