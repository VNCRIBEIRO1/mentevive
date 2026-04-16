---
name: tenant-ux-audit
description: "Audit multi-tenant UX/UI separation across repos. Use when: checking branding leaks, mapping components that belong to landing vs platform, finding hardcoded tenant references, verifying redirect chains, auditing cross-tenant contamination, tenant UX audit, refatorar landing, separar landing da plataforma, branding mismatch."
---

# Tenant UX/UI Audit

Systematic checklist for auditing and mapping UX/UI issues in a multi-tenant architecture with separated repos for **platform** (MenteVive) and **tenant landings** (per-client sites).

## Architecture Rules

These are the source-of-truth rules. Any violation is an audit finding.

| Layer | Repo | Purpose | Branding |
|-------|------|---------|----------|
| **Platform** | `mentevive/` | Login, registro, admin, portal, super admin | Neutral "MenteVive" — no tenant-specific branding |
| **Tenant Landing** | `mentevive-{slug}/` | Public website of each psychologist | Dynamic via `tenant.config.ts` |
| **Legacy** | `psicolobia/` | Redirect-only — must NOT render pages | N/A (308 redirects) |

### Component Ownership

| Component Type | Belongs To | NOT In |
|---------------|-----------|--------|
| Landing components (Hero, Footer, About, Contact, Services, Testimonials, Groups, Journey, Scheduling, Blog list, Chatbot, WhatsApp float) | **Tenant Landing repo** | ❌ Platform repo |
| Blog pages (list + article) | **Tenant Landing repo** | ❌ Platform repo |
| Auth pages (login, registro, redefinir-senha, select-tenant) | **Platform** | |
| Admin panel (/admin/*) | **Platform** | |
| Patient portal (/portal/*) | **Platform** | |
| Super admin (/super/*) | **Platform** | |
| Shared UI (GlassCard, AnimatedSection, FloatingOrbs, SectionDivider, ScrollReveal) | **Both** (copied) | |

### URL Rules

| From | To | Method |
|------|-----|--------|
| Tenant landing "Entrar" | `{PLATFORM_URL}/login?tenant={slug}` | Link |
| Tenant landing "Agendar" | `{PLATFORM_URL}/registro?tenant={slug}` | Link |
| Legacy domain | Tenant landing (/) or platform (/login, /portal, /admin) | 308 redirect |
| Platform root (`/`) | `/login` | `redirect()` server-side |

---

## Audit Procedure

Run each checklist in order. Log every finding with severity.

### Phase 1 — Platform Repo (mentevive/)

#### 1.1 Hardcoded Tenant Branding

Search the entire `src/` for strings that belong to a specific tenant, not the platform:

```
Strings to grep:
- "Psicolobia" / "psicolobia" (tenant name)
- "Beatriz" / "Bea" (professional name)
- "CRP" (professional registration)
- "@psicolobiaa" (social handles)
- "(11) 98884" / "5511988840525" (phone/whatsapp)
- "psicolobia.vercel.app" (old domain)
- "/bia.png" / "bia.png" (tenant-specific images)
- "psicolobia_" in localStorage keys (tenant-namespaced storage)
```

**Expected result:** Zero matches outside of:
- `tenant.config.ts` (if one exists in platform for seeding)
- Test fixtures / seed scripts
- Comments referencing migration history

**Severity:** CRITICAL if found in user-facing pages/components, LOW if in tests/scripts.

#### 1.2 Orphaned Landing Components

Check if `src/components/landing/` exists in the platform repo.

**Expected result:** Directory should NOT exist. All landing components belong in tenant landing repos.

**Severity:** MEDIUM — Dead code that misleads developers and inflates bundle.

Specific files to flag:
```
src/components/landing/Hero.tsx
src/components/landing/Footer.tsx
src/components/landing/Contact.tsx
src/components/landing/Chatbot.tsx
src/components/landing/About.tsx
src/components/landing/Services.tsx
src/components/landing/Testimonials.tsx
src/components/landing/Groups.tsx
src/components/landing/Journey.tsx
src/components/landing/Scheduling.tsx
src/components/landing/Blog.tsx
src/components/landing/WhatsAppFloat.tsx
src/components/landing/PortalShowcase.tsx
src/components/landing/PortalScreenCarousel.tsx
src/components/landing/WaitingRoom.tsx
src/components/landing/index.ts
```

#### 1.3 Blog Pages in Platform

Check if `/blog` and `/blog/[slug]` pages exist.

**Expected result:** Blog pages should NOT exist in platform. Blog belongs to each tenant's landing.

**Severity:** HIGH — Wrong canonical URLs, wrong author attribution, SEO confusion.

Files to flag:
```
src/app/blog/page.tsx
src/app/blog/[slug]/page.tsx
```

Also check blog API routes — if blog data is managed via admin panel, the **API** stays in platform but the **public-facing pages** move to landing.

#### 1.4 Layout Metadata

Read `src/app/layout.tsx` and verify:

| Field | Expected Value |
|-------|---------------|
| `metadataBase` | Platform URL (mentevive domain) |
| `title` | Contains "MenteVive", NO tenant names |
| `description` | Generic platform description |
| `robots` | `{ index: false, follow: false }` (platform is not public-facing) |
| `openGraph.siteName` | "MenteVive" |
| `openGraph.images` | Platform logo, NOT tenant photo |
| `authors` | Omitted or "MenteVive" |
| `keywords` | Generic or omitted |

**Severity:** MEDIUM — SEO/branding leak.

#### 1.5 Portal Hardcoded Messages

Search portal pages for tenant-specific text strings embedded in user-facing messages:

```
Files to check:
- src/app/portal/processo/page.tsx (WhatsApp share message with tenant name)
- src/app/portal/agendar/page.tsx (booking confirmation message)
- src/app/portal/consentimento/page.tsx (consent text with professional name/CRP)
- src/app/portal/layout.tsx (sidebar branding, logo references)
- src/app/admin/configuracoes/page.tsx (localStorage keys like "psicolobia_pricing")
- src/components/admin/AdminSidebar.tsx (sidebar branding)
- src/components/admin/AppointmentDetailModal.tsx (detail display)
- src/components/JitsiMeet.tsx (meeting room naming)
```

**Expected result:** Portal messages should reference generic terms or pull from tenant config / session context, not hardcode a specific psychologist.

**Severity:** HIGH — Patient sees wrong professional's info.

#### 1.6 Root Page

Read `src/app/page.tsx`.

**Expected result:** Should be `redirect("/login")` and nothing else. No landing page content.

**Severity:** CRITICAL if it renders a landing page.

---

### Phase 2 — Tenant Landing Repo (mentevive-{slug}/)

#### 2.1 Centralized Config

Verify `lib/tenant.config.ts` (or equivalent) exists and contains:

```
Required fields:
- slug
- name
- professional: { name, nickname, title, crp, photo }
- urls: { siteUrl, platformUrl, whatsapp }
- social: { instagram, tiktok, linktree }
- branding: { primaryColor, ... } (optional)
```

**Severity:** HIGH if missing — means branding is scattered/hardcoded.

#### 2.2 Platform Links Use Config

Search all components for links to platform. Every link should use `PLATFORM_URL` or equivalent from config:

```
Pattern to search:
- "mentevive.vercel.app" (hardcoded platform URL)
- "/login" without PLATFORM_URL prefix
- "/registro" without PLATFORM_URL prefix
```

**Expected result:** All platform links built dynamically: `${PLATFORM_URL}/login?tenant=${slug}`

**Severity:** HIGH if hardcoded — breaks when platform domain changes.

#### 2.3 Tenant Slug in Auth Links

Every link to `/login` or `/registro` must include `?tenant={slug}`.

**Expected result:** `?tenant=` present in all auth-related links.

**Severity:** CRITICAL — Without it, registration fails (500) and login can't scope to tenant.

#### 2.4 Layout Metadata

Read `app/layout.tsx` and verify:

| Field | Expected Value |
|-------|---------------|
| `robots` | `{ index: true, follow: true }` (landing IS public-facing) |
| `title` | From tenant config |
| `canonical` | Tenant's own domain |
| `openGraph.images` | Professional's photo from config |

**Severity:** MEDIUM

---

### Phase 3 — Legacy Repo (psicolobia/ or original)

#### 3.1 Redirect Coverage

Read `next.config.js` and verify redirects exist for ALL routes:

```
Required redirects:
/              → tenant landing URL
/blog/:path*   → tenant landing /blog/:path*
/login         → {PLATFORM_URL}/login?tenant={slug}
/registro      → {PLATFORM_URL}/registro?tenant={slug}
/admin/:path*  → {PLATFORM_URL}/admin/:path*
/portal/:path* → {PLATFORM_URL}/portal/:path*
/redefinir-senha/:path* → {PLATFORM_URL}/redefinir-senha/:path*
```

All redirects must be `permanent: true` (308).

**Severity:** CRITICAL if missing — users hit broken pages.

#### 3.2 Robots

Check `robots.ts` or `public/robots.txt`:

**Expected result:** `Disallow: /` — legacy domain should not be indexed.

**Severity:** MEDIUM — SEO duplicate content risk.

#### 3.3 Residual Pages

Check if `src/app/` still has page components that could render if redirects fail.

**Expected result:** Ideally delete all page files. If kept, at minimum set robots to noindex.

**Severity:** LOW (redirects prevent rendering) but MEDIUM for local dev confusion.

---

### Phase 4 — Cross-Repo Consistency

#### 4.1 Redirect Chain Validation

For each route, trace the full redirect chain and confirm no loops or broken hops:

```
Test with curl -I:
1. {legacy-domain}/           → tenant landing (200)
2. {legacy-domain}/login      → platform/login?tenant={slug} (200)
3. {legacy-domain}/registro   → platform/registro?tenant={slug} (200)
4. {legacy-domain}/admin      → platform/admin (200 or auth redirect)
5. {legacy-domain}/portal     → platform/portal (200 or auth redirect)
6. {tenant-landing}/          → 200
7. {platform}/                → 200 (redirect to /login)
8. {platform}/login?tenant=X  → 200
9. {platform}/registro?tenant=X → 200
```

**Severity:** CRITICAL if any chain breaks.

#### 4.2 OG Image / Favicon Audit

Verify each repo has the correct visual assets:

| Repo | favicon | OG image | Professional photo |
|------|---------|----------|-------------------|
| Platform | MenteVive logo | MenteVive brand | ❌ NO |
| Tenant landing | Tenant branding | Professional photo | ✅ YES |
| Legacy | N/A (redirects) | N/A | N/A |

**Severity:** MEDIUM

---

## Severity Reference

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Wrong data shown to users, broken flows, security | Fix immediately |
| HIGH | Wrong branding visible, SEO damage, wrong URLs | Fix before next deploy |
| MEDIUM | Dead code, cosmetic issues, dev confusion | Fix in next cleanup sprint |
| LOW | Minor inconsistency, only visible in edge cases | Track for later |

---

## Output Format

After running all phases, produce a table:

```
| # | Phase | Check | Finding | Severity | File(s) |
|---|-------|-------|---------|----------|---------|
| 1 | 1.1   | Hardcoded branding | "Psicolobia" in Footer.tsx | CRITICAL | src/components/landing/Footer.tsx:19 |
| 2 | 1.2   | Orphaned components | 16 landing components in platform | MEDIUM | src/components/landing/* |
| ...
```

Sort by severity (CRITICAL first), then by phase.
