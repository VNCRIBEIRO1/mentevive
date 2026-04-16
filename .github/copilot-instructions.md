 # Copilot Instructions

## Project shape
- This is **MenteVive** — a **multi-tenant SaaS platform** for psychologists, built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v3**.
- **Multi-tenant architecture**: each clinic (consultório) is a tenant with isolated data, users, and billing.
- Architecture: Admin panel (`/admin`), Patient portal (`/portal`), Super admin (`/super`), Blog (`/blog`), Auth (`/login`, `/registro`, `/select-tenant`).
- Database: **Neon** (serverless Postgres) via **Drizzle ORM v0.45** — all data tables scoped by `tenantId`.
- Auth: **NextAuth.js v4** with credentials provider, JWT strategy, tenant-aware role-based access.
- Hosting: **Vercel** (auto-deploy from `master` branch) at `https://mentevive.vercel.app`.
- Video calls: **Jitsi Meet** (meet.jit.si External API) — no backend needed.
- Payments/Billing: **Stripe** for platform subscriptions (per-tenant) and session payments.
- **3 repos**: `mentevive` (main platform), `mentevive-psicolobia` (branded landing), `psicolobia` (legacy, being sunset).

## Tech stack summary
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | ^16.2.2 |
| Language | TypeScript | ^6.0.2 |
| Styling | Tailwind CSS | ^3.4.19 |
| Animations | Framer Motion | ^12.38.0 |
| Icons | Lucide React | latest |
| Database | Neon (serverless Postgres) | — |
| ORM | Drizzle ORM + drizzle-kit | ^0.45.2 |
| Auth | NextAuth.js (credentials, JWT) | ^4.24.13 |
| Hosting | Vercel (Hobby plan) | — |
| Video | Jitsi Meet External API | — |
| Payments | Stripe SDK | ^21.0.1 |
| Fonts | Fraunces + Inter (next/font/google) | — |
| Testing | Vitest | latest |

## Project structure
```
src/
├── app/
│   ├── page.tsx              # Landing page (14 sections)
│   ├── layout.tsx            # Root layout (fonts, metadata)
│   ├── globals.css           # Tailwind + custom design tokens
│   ├── login/page.tsx        # Auth login (tenant-aware redirect)
│   ├── registro/page.tsx     # Registration (role selection: therapist/patient)
│   ├── redefinir-senha/      # Password recovery flow
│   ├── blog/
│   │   ├── page.tsx          # Blog listing (public)
│   │   └── [slug]/page.tsx   # Blog post detail
│   ├── admin/                # Therapist/Admin panel (13 pages)
│   │   ├── layout.tsx        # Auth guard (membershipRole: admin|therapist)
│   │   ├── page.tsx          # Dashboard (tenant-scoped stats)
│   │   ├── pacientes/        # Patient CRUD
│   │   ├── agenda/           # Appointments + availability + blocked dates
│   │   ├── financeiro/       # Payments (Stripe integration)
│   │   ├── prontuarios/      # Clinical records
│   │   ├── triagem/          # Triage management
│   │   ├── blog/             # Blog CRUD
│   │   ├── grupos/           # Group therapy
│   │   ├── notificacoes/     # Notifications
│   │   ├── assinatura/       # Subscription management (Stripe)
│   │   └── configuracoes/    # Settings
│   ├── portal/               # Patient portal (11 pages)
│   │   ├── layout.tsx        # Auth guard (membershipRole: patient|admin|therapist)
│   │   ├── page.tsx          # Patient dashboard
│   │   ├── sessoes/          # Sessions view
│   │   ├── pagamentos/       # Payments view
│   │   ├── documentos/       # Documents view
│   │   ├── triagem/          # Pre-session triage form
│   │   ├── notificacoes/     # Patient notifications
│   │   ├── sala-espera/      # Waiting room + Jitsi video
│   │   └── perfil/           # Profile settings
│   ├── super/                # Super admin panel (4 pages)
│   │   ├── page.tsx          # Platform overview
│   │   ├── tenants/          # Manage all tenants
│   │   ├── users/            # Manage all platform users
│   │   └── cdkeys/           # CDKey management
│   └── api/                  # 56+ API routes (all tenant-scoped)
│       ├── auth/[...nextauth]/ # NextAuth config (multi-tenant)
│       ├── patients/         # CRUD patients
│       ├── appointments/     # CRUD appointments (recurrence)
│       ├── payments/         # CRUD payments
│       ├── clinical-records/ # CRUD records
│       ├── blog/             # CRUD blog posts
│       ├── groups/           # CRUD groups
│       ├── availability/     # Manage time slots
│       ├── blocked-dates/    # Manage blocked dates
│       ├── dashboard/        # Admin stats
│       ├── triage/           # Triage CRUD
│       ├── notifications/    # Notifications CRUD
│       ├── contact/          # Contact form (POST)
│       ├── settings/         # Tenant settings
│       ├── stripe/           # Stripe checkout, webhook, status, subscription
│       ├── subscription/     # CDKey redemption + plan management
│       ├── super/            # Super admin endpoints
│       ├── register/         # Multi-tenant registration
│       └── select-tenant/    # Tenant switching
├── components/
│   ├── JitsiMeet.tsx         # Jitsi video call component
│   ├── ScrollReveal.tsx      # IntersectionObserver animations
│   ├── TurnstileWidget.tsx   # Cloudflare Turnstile captcha
│   ├── admin/                # Admin panel components
│   ├── portal/               # Portal components
│   ├── landing/              # Landing page sections
│   └── waiting-room/         # Waiting room components
├── db/
│   └── schema.ts             # 18 tables, 10 enums, relations
├── lib/
│   ├── auth.ts               # NextAuth config (multi-tenant JWT)
│   ├── api-auth.ts           # requireAdmin(), requireAuth(), requireSuperAdmin()
│   ├── stripe.ts             # Stripe SDK init + helpers
│   ├── session-pricing.ts    # Session pricing logic
│   ├── payment-access.ts     # Payment access control
│   ├── availability-slots.ts # Availability slot logic
│   ├── custom-availability.ts # Custom availability overrides
│   ├── notifications.ts      # Notification helpers
│   ├── turnstile.ts          # Turnstile verification
│   ├── validations.ts        # Input validation utilities
│   └── utils.ts              # General utilities
└── types/
    ├── global.d.ts           # Global type declarations
    └── next-auth.d.ts        # NextAuth session type extensions
scripts/
├── seed.ts                   # Seed initial data
├── seed-lia-test.ts          # Test tenant seed
├── reset-and-seed-homolog.ts # Homolog reset script
├── ensure-stripe-schema.ts   # Stripe schema validation
└── validate-local-flow.ts    # Local flow validation
tests/                        # Vitest test suite
drizzle.config.ts             # Drizzle Kit config
vitest.config.ts              # Vitest config
```

## Database schema (18 tables, 10 enums)

### Core multi-tenant tables
- **tenants**: id, slug, name, ownerUserId FK, stripeAccountId, plan (tenantPlanEnum), subscriptionStatus (subscriptionStatusEnum), isActive, createdAt
- **tenantMemberships**: userId FK, tenantId FK, role (membershipRoleEnum: admin/therapist/patient), isActive — bridge table for user↔tenant access
- **users**: id, email, password, name, role (legacy userRoleEnum), platformRole (platformRoleEnum: superadmin/user), isSuperAdmin (boolean), phone, createdAt
- **cdkeys**: code, plan (tenantPlanEnum), durationDays, tenantId FK (nullable), redeemedAt — activation codes for plan upgrades

### Clinical + business tables (all have tenantId FK)
- **patients**: tenantId, userId FK (optional), name, email, cpf, phone, birthDate, status, emergencyContact, notes
- **appointments**: tenantId, patientId FK, date, startTime, endTime, status (appointmentStatusEnum), recurrenceType, modality (sessionModalityEnum), meetingUrl, notes
- **availability**: tenantId, dayOfWeek, startTime, endTime, isActive
- **blockedDates**: tenantId, date, reason
- **clinicalRecords**: tenantId, patientId FK, therapistId FK, sessionDate, chiefComplaint, clinicalNotes, type, isConfidential
- **payments**: tenantId, patientId FK, appointmentId FK, amount, status (paymentStatusEnum), method (paymentMethodEnum), stripeSessionId, stripePaymentIntentId, stripeStatus, checkoutUrl
- **documents**: tenantId, patientId FK, title, type, fileUrl
- **blogPosts**: tenantId, authorId FK, title, slug, content, excerpt, coverImage, status (blogStatusEnum), publishedAt
- **groups**: tenantId, name, modality, dayOfWeek, time, maxParticipants, therapistId FK, isActive
- **groupMembers**: tenantId, groupId FK, patientId FK, joinedAt
- **triages**: tenantId, appointmentId FK, mood, sleepQuality, anxietyLevel, mainConcern
- **notifications**: tenantId, type (triage/appointment/payment/registration/status_change), title, message, patientId FK, appointmentId FK, paymentId FK
- **settings**: tenantId, key, value — tenant-scoped key-value config
- **passwordResetTokens**: userId FK, token, expiresAt, usedAt

### Enums (10)
`platformRoleEnum`, `membershipRoleEnum`, `userRoleEnum` (legacy), `appointmentStatusEnum`, `sessionModalityEnum`, `paymentStatusEnum`, `paymentMethodEnum`, `blogStatusEnum`, `tenantPlanEnum`, `subscriptionStatusEnum`

### Multi-tenant rule — CRITICAL
Every data table (except `users`, `passwordResetTokens`, `cdkeys`) has a `tenantId` FK. **All queries MUST filter by `tenantId`**. New routes/queries without `tenantId` filtering are a security vulnerability.

## Auth system — Multi-tenant JWT

### Role hierarchy
| Level | Field | Values | Source |
|-------|-------|--------|--------|
| **Platform** | `isSuperAdmin` | `true/false` | `users` table |
| **Platform** | `platformRole` | `superadmin`, `user` | `users` table |
| **Tenant** | `membershipRole` | `admin`, `therapist`, `patient` | `tenantMemberships` table |
| **Legacy** | `role` | `admin`, `therapist`, `patient` | `users` table (backward compat) |

### Login flow
1. User enters email+password → NextAuth `authorize()` validates globally against `users` table
2. System fetches active `tenantMemberships` for that user
3. **1 membership** → auto-selects tenant
4. **2+ memberships** → sets `needsTenantSelection=true` → client redirects to `/select-tenant`
5. **0 memberships** (non-superadmin) → login fails
6. JWT stores: `activeTenantId`, `tenantSlug`, `tenantName`, `membershipRole`
7. Tenant switching: trigger `session.update()` → updates JWT context

### API auth guards (`src/lib/api-auth.ts`)
- `requireAdmin()` → authenticated + active tenant + (admin OR therapist) membershipRole
- `requireAuth()` → authenticated + active tenant (any role)
- `requireSuperAdmin()` → authenticated + `isSuperAdmin === true`

### Layout guards
- `/admin/layout.tsx` → checks `membershipRole` is `admin` or `therapist` (with fallback to legacy `role`)
- `/portal/layout.tsx` → checks `membershipRole` is `patient`, `admin`, or `therapist` (admins can also access portal)
- `/super/` → checks `isSuperAdmin` flag

### Registration flow
- **Therapist** registers → creates new `tenant` + `tenantMembership(admin)` → auto-login
- **Patient** registers → requires `tenantSlug` → creates `tenantMembership(patient)` in that tenant → auto-login

## Development workflow — OBRIGATÓRIO
- **Sempre crie tudo via terminal CLI** (npm, npx, etc.).
- **Sempre audite e teste** cada módulo após criação — `npm run build`, `npm run lint`, verificação manual de rotas.
- **Nunca pule testes** — rode `npm run build` antes de cada commit para validar que não há erros.
- **Build com mais memória** (se necessário): `$env:NODE_OPTIONS="--max-old-space-size=8192"; npm run build`
- **Integração WhatsApp**: NÃO implementar API de WhatsApp (nem oficial Meta Cloud API, nem não-oficial Evolution/Baileys) neste momento. Manter apenas links `wa.me/` estáticos.
- Ao criar novos módulos, siga o padrão existente de organização em `src/app/`, `src/components/`, `src/lib/`, `src/db/`.
- **Multi-tenant**: Toda nova rota API DEVE usar `requireAuth()` ou `requireAdmin()` e filtrar por `tenantId`. Toda nova query DEVE incluir `where tenantId = ?`.
- Testes unitários com **Vitest** — rodar `npm test` antes de commits em funcionalidades críticas.

## CLI setup guide (from scratch)

### 1. Clone e instalação
```bash
git clone https://github.com/VNCRIBEIRO1/mentevive.git
cd mentevive
npm install
```

### 1.5. Configuração Git (obrigatório para Vercel Hobby)
```bash
git config user.name "VNCRIBEIRO1"
git config user.email "VNCRIBEIRO1@users.noreply.github.com"
```
> **⚠️ OBRIGATÓRIO**: O plano Vercel Hobby bloqueia deploys de commits cujo autor Git não corresponde ao dono da conta Vercel. Se o `git config` global estiver com outro nome/e-mail, o Vercel rejeita o deploy com "Deployment Blocked — no git user associated with the commit". Sempre configure o git user **local** do repo antes de commitar.

### 2. Neon database (via neonctl)
```bash
npm install -g neonctl
neonctl auth                    # Abre browser para login
neonctl projects list           # Verifica projeto existente
# Ou criar novo: neonctl projects create --name mentevive
neonctl connection-string       # Copia a connection string
```

### 3. Variáveis de ambiente
Crie `.env.local` na raiz do projeto:
```env
DATABASE_URL="postgresql://USER:PASS@HOST/DB?sslmode=require"
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```
Para gerar o secret: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 4. Database schema push
```bash
npx drizzle-kit push            # Cria/atualiza tabelas no Neon
```

### 5. Seed data
```bash
npm run db:seed                  # Cria admin + tenant de teste
```

### 6. Desenvolvimento local
```bash
npm run dev                      # http://localhost:3000
```

### 7. Build e deploy
```bash
npm run build                    # Verifica erros antes de deploy
npx vercel --prod --yes          # Deploy para produção
```

### 8. Vercel env vars (produção)
```bash
npx vercel env add DATABASE_URL production    # Cola a connection string
npx vercel env add NEXTAUTH_SECRET production # Cola o secret
npx vercel env add NEXTAUTH_URL production    # https://mentevive.vercel.app
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add STRIPE_PRICE_MONTHLY production
npx vercel env add STRIPE_PRICE_ANNUAL production
```
> **Nota**: Se o Neon foi integrado via Vercel Marketplace, `DATABASE_URL` é configurado automaticamente.

## Professional identity
- **MenteVive** is the SaaS platform brand. Multiple clinics (tenants) can register.
- The first tenant is **Psicolobia** — run by **Beatriz (Bea)**, clinical psychologist, brand `@psicolobiaa`.
- **CRP 06/173961** — Conselho Regional de Psicologia de São Paulo.
- **Formação**: Universidade do Oeste Paulista — UNOESTE.
- **Certificação**: Transtorno Ansioso e Depressivo — Faculdade Israelita Albert Einstein (ago/2023).
- **Competências**: Terapia de Aceitação e Compromisso (ACT), Terapia para Tratamento de Traumas.
- Tagline: "Especialista no emocional de quem vive da internet".
- Key proof point: **+3.500 atendimentos realizados**.
- WhatsApp: `+55 11 98884-0525` → link `https://wa.me/5511988840525`.
- Social: Instagram `@psicolobiaa`, TikTok `@psicolobiaa`, Linktree `linktr.ee/psicolobiaa`.

### Experiência profissional
1. **Psicóloga Clínica — Autônoma** (ago/2024 – presente): 35 atendimentos semanais, público adulto, remoto (São Paulo). Especialidades: ACT e tratamento de traumas.
2. **Psicóloga Clínica — Privacy** (fev/2022 – ago/2024): 35-40 atendimentos semanais, criadores de conteúdo digital. Colunista semanal de psicologia no blog da empresa.
3. **Psicóloga — CRAS** (ago/2021 – fev/2022): Atenção a vulnerabilidade social, grupos, oficinas, visitas domiciliares, rede intersetorial (Tarabai-SP).
4. **Acompanhante Terapêutica — Colégio APOGEU** (fev/2019 – mai/2021): Inclusão escolar de criança autista (Presidente Prudente-SP).

## Content and design conventions
- The site copy is in **pt-BR** and uses Beatriz's warm, humanized brand voice ("sem pressa, sem moldes, sem máscaras"). Preserve that tone in headings, CTA labels, chatbot replies, and toast messages. Refer to the professional as "Bea" or "Beatriz" in informal/chatbot contexts and "Psicolobia" for the brand.
- **Design tokens** are defined in `src/app/globals.css` with Tailwind config: primary `#D4A574` (warm gold), accent `#E8A0BF` (soft pink), teal `#0f766e` (calm deep), sage `#e6f0eb` (soft green), background `#FFF5EE` (seashell), text `#3D2B1F` (dark brown). Liquid Glass 2.0 utilities (`.glass`, `.glass-strong`, `.glass-glow`). Fonts: Fraunces (headings) + Inter (body) via `next/font/google`.
- Responsive breakpoints: `1024px` (tablet) and `768px` (mobile); check both layouts after structural edits.
- Accessibility: skip link, `:focus-visible`, reduced-motion handling, JSON-LD structured data, OG metadata. Keep those intact when changing layout or metadata.

## React / Next.js patterns
- **Server Components** by default; use `"use client"` only when needed (interactivity, hooks, browser APIs).
- **API routes** use `NextResponse.json()` and auth guards from `src/lib/api-auth.ts` (`requireAdmin()`, `requireAuth()`, `requireSuperAdmin()`).
- **DB queries** use Drizzle ORM query builder — `db.select()`, `db.insert()`, `db.query.table.findMany()`. **Always include `.where(eq(table.tenantId, tenantId))`**.
- **Auth flow**: Login → NextAuth credentials → JWT (with tenant context) → membershipRole check → redirect (admin→/admin, patient→/portal, multi-tenant→/select-tenant).
- **Scheduling**: Client-side calendar state (`schedMonth`, `schedYear`, `schedSelDate`, `schedSelSlot`).
- **Waiting Room**: 15-min countdown → Jitsi video call via External API.

## Assets and external dependencies
- Local images: `public/` directory (migrated from repo root).
- Remote images: Unsplash (configured in `next.config.js` `images.remotePatterns`).
- Typography: Fraunces + Inter loaded via `next/font/google` in `src/app/layout.tsx` (zero FOUT, no external CSS import).
- `.vercel/` is gitignored. Canonical URL: `https://mentevive.vercel.app`.

## Working in this repo
- O projeto usa `npm` como gerenciador de pacotes.
- Comandos principais:
  - `npm run dev` — Servidor de desenvolvimento (http://localhost:3000)
  - `npm run build` — Build de produção (OBRIGATÓRIO antes de cada commit)
  - `npm run lint` — ESLint 9 (flat config em `eslint.config.mjs`)
  - `npm test` — Vitest test suite
  - `npm run db:seed` — Seed data (`npx tsx scripts/seed.ts`)
  - `npx drizzle-kit push` — Push schema para Neon
  - `npx drizzle-kit studio` — GUI para visualizar banco
  - `npx vercel --prod --yes` — Deploy para produção
- Variáveis de ambiente ficam em `.env.local` (nunca commitar). Use `.env.local.example` como referência.
- `README.md` contém instruções de setup e documentação da API.
- `_legacy/index.html` preserva a versão original do site estático para referência.

## Stripe integration
- **SDK**: `stripe` ^21.x — server-side only (`src/lib/stripe.ts`).
- **Stripe Account**: MenteVive Platform (acct_1TMsrUPO2zUrO8sv)
- **Subscription Plans**: Monthly R$59.90 (`STRIPE_PRICE_MONTHLY`), Annual R$499.00 (`STRIPE_PRICE_ANNUAL`)
- **Env vars** (all optional — app degrades gracefully when absent):
  - `STRIPE_SECRET_KEY` — `sk_test_...` (teste) ou `sk_live_...` (produção)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_test_...` ou `pk_live_...`
  - `STRIPE_WEBHOOK_SECRET` — `whsec_...` (do CLI para local, do Dashboard para produção)
  - `STRIPE_PRICE_MONTHLY` — Price ID for monthly subscription plan
  - `STRIPE_PRICE_ANNUAL` — Price ID for annual subscription plan
- **Rotas API Stripe**:
  - `POST /api/stripe/create-checkout` — cria Checkout Session (auth: qualquer logado)
  - `GET  /api/stripe/status?paymentId=...` — consulta status no Stripe (auth: qualquer logado)
  - `POST /api/stripe/webhook` — recebe eventos Stripe (público, valida assinatura)
  - `POST|GET /api/stripe/test-flow` — cria/consulta pagamento de teste (auth: admin only)
- **Métodos**: Card + PIX (BRL). PIX requer ativação no Stripe Dashboard.
- **Webhook events**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`.
- **Guard pattern**: `isStripeConfigured()` retorna false se `STRIPE_SECRET_KEY` ausente → rotas retornam 503.
- **Campos DB** (tabela `payments`): `stripeSessionId`, `stripePaymentIntentId`, `stripeStatus`, `checkoutUrl`, `externalReference`.

### Stripe: switch teste ↔ produção (checklist completa)
Ao alternar entre modo **teste** e modo **produção** do Stripe, **TODAS** as etapas abaixo devem ser executadas:

#### 1. Chaves API (Dashboard → https://dashboard.stripe.com/apikeys)
| Ambiente | Secret Key | Publishable Key |
|----------|-----------|----------------|
| **Teste** | `sk_test_51SGXPW...` | `pk_test_51SGXPW...` |
| **Produção** | `sk_live_...` | `pk_live_...` |

#### 2. `.env.local` (desenvolvimento local)
```env
# Trocar os 2 valores conforme o modo:
STRIPE_SECRET_KEY=sk_test_... ou sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... ou pk_live_...
# Webhook secret muda conforme a origem:
STRIPE_WEBHOOK_SECRET=whsec_... (do stripe listen para local, do Dashboard para produção)
```

#### 3. Vercel (produção)
```bash
# Sobrescrever com as chaves do modo desejado:
echo "sk_live_..." | npx vercel env add STRIPE_SECRET_KEY production --force
echo "pk_live_..." | npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --force
echo "whsec_..." | npx vercel env add STRIPE_WEBHOOK_SECRET production --force
# Redeploy obrigatório após trocar envs:
npx vercel --prod --yes
```

#### 4. Webhook endpoint (Stripe Dashboard → Webhooks)
| Ambiente | Endpoint | Signing Secret |
|----------|---------|---------------|
| **Local (teste)** | `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` | `whsec_...` exibido pelo CLI |
| **Vercel (teste)** | `https://mentevive.vercel.app/api/stripe/webhook` (webhook teste no Dashboard) | `whsec_...` do endpoint teste |
| **Vercel (produção)** | `https://mentevive.vercel.app/api/stripe/webhook` (webhook live no Dashboard) | `whsec_...` do endpoint live |

**Events para registrar**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`

#### 5. Stripe CLI (apenas desenvolvimento local)
```bash
stripe login                    # Auth via browser (expira em 90 dias)
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
# Copiar whsec_... exibido → STRIPE_WEBHOOK_SECRET no .env.local
```

#### 6. Validação após switch
```bash
# Local — subir app + stripe listen em terminais separados:
npm run dev
# Console do browser (logado como admin):
fetch("/api/stripe/test-flow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 10 }) }).then(r => r.json()).then(console.log)
# Deve retornar ok: true, checkoutUrl, sessionId
# Abrir checkoutUrl → cartão teste 4242 4242 4242 4242
# Consultar: fetch("/api/stripe/test-flow?paymentId=ID").then(r=>r.json()).then(console.log)
# Deve retornar local.status === "paid"
```

#### 7. Pontos de atenção no switch
- **Nunca misturar** chaves teste com webhook secret de produção (ou vice-versa).
- **`STRIPE_WEBHOOK_SECRET` é diferente** para cada endpoint registrado — local (CLI), teste (Dashboard), live (Dashboard).
- **Redeploy obrigatório** na Vercel após trocar qualquer env var.
- **Pagamentos criados em teste não existem em produção** — são ambientes isolados no Stripe.
- **PIX** requer ativação separada no Dashboard (teste e produção).
- Após trocar para live: **testar com valor real baixo** (R$ 1,00) antes de liberar para pacientes.

## Admin credentials (dev/staging)
- Criado via `npm run db:seed`. Nunca expor em produção.
- Credenciais variam por script de seed — verifique `scripts/seed.ts` para valores atuais.

## Commit & deploy — OBRIGATÓRIO após toda alteração
- **SEMPRE faça git add, commit e push ao final de CADA tarefa, sem exceção. Nunca espere o usuário pedir.**
- Sequência obrigatória: `npm run build` → `git add -A` → `git commit -m "<msg>"` → `git push origin master`.
- O Vercel detecta o push em `master` e faz o redeploy automaticamente em `https://mentevive.vercel.app`.
- Mensagem de commit deve seguir o padrão: `feat|fix|chore|style|content: descrição curta em pt-BR`.
- Nunca encerre uma tarefa sem confirmar que o push foi bem-sucedido.
- **Antes de cada commit**: rode `npm run build` (com `$env:NODE_OPTIONS="--max-old-space-size=8192"` se necessário) para validar que não há erros.
- Se o build falhar, corrija os erros e repita o ciclo build → commit → push.
- **Não pergunte se deve fazer deploy — faça automaticamente.**
