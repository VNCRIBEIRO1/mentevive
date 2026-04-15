# Architecture — Strategy C (Hybrid)

## Overview

**Strategy C** separates the **presentation layer** (landing sites) from the **system layer** (admin, portal, API).

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENTS' LANDING SITES                   │
│  (separate Vercel projects, each with their own domain)      │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ psicolobia.com  │  │ dranaconsult.   │  │ drpedro.     │ │
│  │   .br           │  │    com.br       │  │   com.br     │ │
│  │                 │  │                 │  │              │ │
│  │  Landing page   │  │  Landing page   │  │  Landing     │ │
│  │  Blog (static)  │  │  Blog (static)  │  │  Blog        │ │
│  │  Contact info   │  │  Contact info   │  │  Contact     │ │
│  │  WhatsApp link  │  │  WhatsApp link  │  │  WhatsApp    │ │
│  │                 │  │                 │  │              │ │
│  │  [Entrar] ──────┼──┼──────┐          │  │  [Entrar]──┐ │ │
│  └─────────────────┘  └──────┼──────────┘  └────────────┼─┘ │
│                              │                          │    │
└──────────────────────────────┼──────────────────────────┼────┘
                               │                          │
                               ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│                  CENTRAL PLATFORM                            │
│          app.MenteVive.com.br                             │
│          (single Vercel project)                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  /login?tenant=SLUG                                    │  │
│  │  Authenticate user → lookup memberships                │  │
│  │  1 membership → auto-select → redirect to dashboard    │  │
│  │  N memberships → show tenant picker                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐              │
│  │ /admin/*   │  │ /portal/*  │  │ /super/* │              │
│  │ Therapist  │  │ Patient    │  │ Platform │              │
│  │ Dashboard  │  │ Portal     │  │ Admin    │              │
│  └────────────┘  └────────────┘  └──────────┘              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  /api/*  — All backend routes, tenant-scoped via JWT   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Shared: Neon Postgres │ Stripe Connect │ Jitsi Meet   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Domain Configuration

### Client Landing Sites

Each client has their own Vercel project with their own domain:

### Phase 1: Vercel Hobby (Free)

| Client | Vercel Project | URL |
|--------|---------------|-----|
| **Platform** | `MenteVive` | `MenteVive.vercel.app` |
| Bia (tenant #1) | `MenteVive-psicolobia` | `MenteVive-psicolobia.vercel.app` |
| Future client | `MenteVive-{slug}` | `MenteVive-{slug}.vercel.app` |

### Phase 2: Custom Domains (When Ready)

| Client | Custom Domain | Vercel Project |
|--------|--------------|---------------|
| **Platform** | `app.MenteVive.com.br` | `MenteVive` |
| Bia (tenant #1) | `psicolobia.com.br` | `MenteVive-psicolobia` |
| Dra Ana (tenant #2) | `dranaconsultorio.com.br` | `MenteVive-dranacons` |

### DNS Setup (Phase 2 Only)

```
# Client's domain registrar
psicolobia.com.br        → CNAME → cname.vercel-dns.com  (MenteVive-psicolobia project)

# Platform domain
app.MenteVive.com.br  → CNAME → cname.vercel-dns.com  (MenteVive project)
```

> **Important**: Use env var `NEXT_PUBLIC_PLATFORM_URL` in all code.
> Phase 1: `https://MenteVive.vercel.app`
> Phase 2: `https://app.MenteVive.com.br`

## Login Flow

### From Client's Landing Site

```
1. User on psicolobia.com.br clicks [Entrar]
2. → Redirect to: app.MenteVive.com.br/login?tenant=psicolobia
3. → Login page shows: "Entrar no Consultório Psicolobia"
4. → User enters email + password
5. → Backend: authenticate globally → look up membership for tenant "psicolobia"
6. → JWT: { id, email, name, activeTenantId: "uuid", tenantSlug: "psicolobia", role: "patient" }
7. → Redirect to /portal (patient) or /admin (therapist/admin)
```

### Direct Platform Access (multi-membership)

```
1. User goes to app.MenteVive.com.br/login (no ?tenant param)
2. → Login page shows: "Entrar na Plataforma"
3. → User enters email + password
4. → Backend: authenticate → find 3 memberships (Bia=patient, Ana=patient, Pedro=admin)
5. → JWT: { id, email, name, needsTenantSelection: true }
6. → Redirect to /select-tenant
7. → Shows: "Selecione o consultório"
     ┌─────────────────────────────────┐
     │ 🏥 Consultório Psicolobia       │ ← paciente
     │ 🏥 Consultório Dra Ana          │ ← paciente
     │ 🏥 Consultório Dr Pedro         │ ← admin
     └─────────────────────────────────┘
8. → User clicks "Consultório Psicolobia"
9. → POST /api/auth/select-tenant { tenantSlug: "psicolobia" }
10. → JWT updated: { activeTenantId, tenantSlug, role: "patient" }
11. → Redirect to /portal
```

### Superadmin Access

```
1. Superadmin goes to app.MenteVive.com.br/login
2. → Logs in with superadmin email
3. → JWT: { id, email, role: "superadmin" }
4. → Redirect to /super/tenants
5. → Can switch into any tenant context for support
```

## Registration Flow

### Patient Registration (from client's site)

```
1. User on psicolobia.com.br clicks [Criar Conta] or therapist sends link
2. → Redirect to: app.MenteVive.com.br/registro?tenant=psicolobia
3. → Registration page: "Criar conta no Consultório Psicolobia"
4. → User fills name, email, password, phone
5. → Backend:
     a. Create global user (users table) — OR find existing if email already registered
     b. Create tenant_membership (userId, tenantId, role="patient")
     c. Create patient record with tenantId
6. → Auto-login → redirect to /portal
```

### Existing User Joining New Practice

```
1. User already has account (patient at Bia's)
2. Visits dranaconsultorio.com.br → clicks [Entrar]
3. → Redirect to: app.MenteVive.com.br/login?tenant=dranacons
4. → Logs in with existing credentials
5. → Backend: user exists, but no membership for "dranacons" tenant
6. → Option A: Auto-create membership → redirect to /portal
7. → Option B: Show "Solicitar acesso ao Consultório Dra Ana" → therapist approves
```

## Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Landing    │     │  Central         │     │  Neon Postgres  │
│  Sites      │     │  Platform        │     │  (shared DB)    │
│             │     │                  │     │                 │
│ Static HTML │────▶│ /api/*           │────▶│ tenants         │
│ No DB       │     │ JWT has          │     │ tenant_members  │
│ No Auth     │     │ activeTenantId   │     │ users (global)  │
│             │     │                  │     │ patients        │
│ Links to    │     │ Every query:     │     │ appointments    │
│ platform    │     │ WHERE tenant_id  │     │ payments        │
│ login       │     │ = activeTenantId │     │ ...all scoped   │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## Advantages of Strategy C

1. **Full creative control per client** — each landing site can be completely custom
2. **SEO independence** — each domain has its own SEO, backlinks, authority
3. **Client owns their domain** — if they leave the platform, they keep their domain
4. **Simple central platform** — no subdomain parsing, no wildcard DNS
5. **Easy to sell** — "you get a custom website + access to the system portal"
6. **Central deploy = easy maintenance** — one codebase for all system logic
7. **Scales linearly** — new tenant = new simple landing site + DB row

## Tradeoffs

1. **More Vercel projects** — 1 per client + 1 central (but landing sites are tiny/free tier)
2. **Redirect on login** — user leaves client domain → goes to platform domain
3. **Blog can be duplicated** — either static in landing OR dynamic from platform API
4. **Two repos to maintain** — landing template + central platform (but template is stable after v1)

## Vercel Cost Analysis

| Component | Vercel Plan | Cost |
|-----------|-------------|------|
| Central platform | Pro ($20/mo) | $20/mo |
| Each landing site | Hobby (free) | $0/mo |
| Custom domain per landing | Included in Hobby | $0 |
| Custom domain for platform | Included in Pro | $0 |

**Total: $20/mo fixed** + landing sites are free.
