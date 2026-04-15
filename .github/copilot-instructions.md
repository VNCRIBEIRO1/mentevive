 # Copilot Instructions

## Project shape
- This is a **Next.js 16 (App Router) SaaS** for psychologists, built with **TypeScript + Tailwind CSS v3**.
- The original landing page was migrated from a single `index.html` (preserved at repo root) to `src/app/page.tsx`.
- Architecture: Landing page (public), Admin panel (`/admin`), Patient portal (`/portal`), Blog (`/blog`), Auth (`/login`, `/registro`).
- Database: **Neon** (serverless Postgres, project `neon-fuchsia-queen`) via **Drizzle ORM v0.45**.
- Auth: **NextAuth.js v4** with credentials provider, JWT strategy, role-based access (admin/therapist/patient).
- Hosting: **Vercel** (auto-deploy from `main` branch) at `https://psicolobia.vercel.app`.
- Video calls: **Jitsi Meet** (meet.jit.si External API) — no backend needed.
- The page sections (`#jornada`, `#sobre`, `#servicos`, `#agendamento`, `#sala-espera`, `#grupos`, `#blog`, `#contato`) are preserved in the landing page component.

## Tech stack summary
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.2 |
| Language | TypeScript | 6.x |
| Styling | Tailwind CSS | 3.4.x |
| Animations | Framer Motion | 12.x |
| Icons | Lucide React | latest |
| Database | Neon (serverless Postgres) | — |
| ORM | Drizzle ORM + drizzle-kit | 0.45.x |
| Auth | NextAuth.js (credentials) | 4.24.x |
| Hosting | Vercel | — |
| Video | Jitsi Meet External API | — |
| Payments | Stripe SDK | ^21.x |
| Fonts | Fraunces + Inter (next/font/google) | — |

## Project structure
```
src/
├── app/
│   ├── page.tsx              # Landing page (14 sections)
│   ├── layout.tsx            # Root layout (fonts, metadata)
│   ├── globals.css           # Tailwind + custom design tokens
│   ├── login/page.tsx        # Auth login (role-based redirect)
│   ├── registro/page.tsx     # Patient registration
│   ├── blog/
│   │   ├── page.tsx          # Blog listing (public)
│   │   └── [slug]/page.tsx   # Blog post detail
│   ├── admin/
│   │   ├── layout.tsx        # Admin layout (sidebar + auth guard)
│   │   ├── page.tsx          # Dashboard (stats from DB)
│   │   ├── pacientes/        # Patient CRUD
│   │   ├── agenda/           # Appointments + availability
│   │   ├── financeiro/       # Payments
│   │   ├── prontuarios/      # Clinical records
│   │   ├── blog/             # Blog CRUD
│   │   ├── grupos/           # Group therapy
│   │   └── configuracoes/    # Settings
│   ├── portal/
│   │   ├── layout.tsx        # Portal layout (patient auth)
│   │   ├── page.tsx          # Patient dashboard
│   │   ├── sessoes/          # Sessions view
│   │   ├── pagamentos/       # Payments view
│   │   └── documentos/       # Documents view
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth config
│       ├── patients/         # CRUD patients
│       ├── appointments/     # CRUD appointments
│       ├── payments/         # CRUD payments
│       ├── clinical-records/ # CRUD records
│       ├── blog/             # CRUD blog posts
│       ├── groups/           # CRUD groups
│       ├── availability/     # Manage time slots
│       ├── dashboard/        # Admin stats
│       ├── contact/          # Contact form (POST)
│       └── setup/            # Initial setup
├── components/
│   ├── AdminSidebar.tsx      # Admin nav (mobile hamburger)
│   ├── Blog.tsx              # Blog section (landing)
│   ├── Chatbot.tsx           # 12 intents + text input
│   ├── Contact.tsx           # Contact form → POST /api/contact
│   ├── JitsiMeet.tsx         # Jitsi video call component
│   ├── Scheduling.tsx        # Appointment scheduling UI
│   ├── ScrollReveal.tsx      # IntersectionObserver animations
│   ├── WaitingRoom.tsx       # Pre-session waiting room + Jitsi
│   └── ... (other sections)
├── db/
│   ├── index.ts              # Neon + Drizzle connection (lazy)
│   └── schema.ts             # 10 tables, 6 enums, relations
└── lib/
    ├── auth.ts               # NextAuth config
    └── api-auth.ts           # requireAdmin() / requireAuth() guards
scripts/
└── seed.ts                   # Seed admin user
drizzle.config.ts             # Drizzle Kit config
```

## Database schema (10 tables, 6 enums)
- **users**: id, name, email, password, role (admin/therapist/patient), phone, createdAt
- **patients**: userId FK, birthDate, cpf, emergencyContact, notes, status, createdAt
- **appointments**: patientId FK, therapistId FK, dateTime, duration, type (enum), status (enum), meetingUrl, notes
- **availability**: therapistId FK, dayOfWeek, startTime, endTime, isActive
- **clinicalRecords**: patientId FK, therapistId FK, sessionDate, content, type, isConfidential
- **payments**: patientId FK, appointmentId FK, amount, status (enum), method (enum), dueDate, paidAt
- **documents**: patientId FK, name, type, url, uploadedAt
- **blogPosts**: authorId FK, title, slug, content, excerpt, coverImage, published, publishedAt
- **groups**: name, description, therapistId FK, maxParticipants, schedule, isActive
- **groupMembers**: groupId FK, patientId FK, joinedAt

## Development workflow — OBRIGATÓRIO
- **Sempre crie tudo via terminal CLI** (npm, npx, etc.).
- **Sempre audite e teste** cada módulo após criação — `npm run build`, `npm run lint`, verificação manual de rotas.
- **Nunca pule testes** — rode `npm run build` antes de cada commit para validar que não há erros.
- **Build com mais memória** (se necessário): `$env:NODE_OPTIONS="--max-old-space-size=8192"; npm run build`
- **Integração WhatsApp**: NÃO implementar API de WhatsApp (nem oficial Meta Cloud API, nem não-oficial Evolution/Baileys) neste momento. Manter apenas links `wa.me/` estáticos.
- Ao criar novos módulos, siga o padrão existente de organização em `src/app/`, `src/components/`, `src/lib/`, `src/db/`.
- Testes E2E e unitários devem ser escritos para funcionalidades críticas (auth, CRUD pacientes, agendamentos).

## CLI setup guide (from scratch)

### 1. Clone e instalação
```bash
git clone https://github.com/VNCRIBEIRO1/psicolobia.git
cd psicolobia
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
# Ou criar novo: neonctl projects create --name psicolobia
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

### 5. Seed do admin
```bash
npm run db:seed                  # Cria admin@psicolobia.com.br / Psicolobia@2026
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
npx vercel env add NEXTAUTH_URL production    # https://psicolobia.vercel.app
```
> **Nota**: Se o Neon foi integrado via Vercel Marketplace, `DATABASE_URL` é configurado automaticamente.

## Professional identity
- The professional is **Beatriz (Bea)**, a clinical psychologist who brands as **Psicolobia** / **@psicolobiaa**.
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
- **Client components**: Chatbot, Scheduling, WaitingRoom, Contact, Blog, JitsiMeet, ScrollReveal, AdminSidebar.
- **API routes** use `NextResponse.json()` and auth guards from `src/lib/api-auth.ts` (`requireAdmin()`, `requireAuth()`).
- **DB queries** use Drizzle ORM query builder — `db.select()`, `db.insert()`, `db.query.table.findMany()`.
- **Auth flow**: Login → NextAuth credentials → JWT → role check → redirect (admin→/admin, patient→/portal).
- **Chatbot**: 12 intents with keyword matching + quick-reply buttons. New intents follow `botResponses` map pattern in `src/components/Chatbot.tsx`.
- **Scheduling**: Client-side calendar state (`schedMonth`, `schedYear`, `schedSelDate`, `schedSelSlot`).
- **Waiting Room**: 15-min countdown → Jitsi video call via External API.

## Assets and external dependencies
- Local images: `public/` directory (migrated from repo root).
- Remote images: Unsplash (configured in `next.config.js` `images.remotePatterns`).
- Typography: Fraunces + Inter loaded via `next/font/google` in `src/app/layout.tsx` (zero FOUT, no external CSS import).
- `.vercel/` is gitignored. Canonical URL: `https://psicolobia.vercel.app`.

## Working in this repo
- O projeto usa `npm` como gerenciador de pacotes.
- Comandos principais:
  - `npm run dev` — Servidor de desenvolvimento (http://localhost:3000)
  - `npm run build` — Build de produção (OBRIGATÓRIO antes de cada commit)
  - `npm run lint` — ESLint 9 (flat config em `eslint.config.mjs`)
  - `npm run db:seed` — Seed do admin (`npx tsx scripts/seed.ts`)
  - `npx drizzle-kit push` — Push schema para Neon
  - `npx drizzle-kit studio` — GUI para visualizar banco
  - `npx vercel --prod --yes` — Deploy para produção
- Variáveis de ambiente ficam em `.env.local` (nunca commitar). Use `.env.local.example` como referência.
- `README.md` contém instruções de setup e documentação da API.
- `index.html` na raiz preserva a versão original do site estático para referência (_legacy_).

## Stripe integration
- **SDK**: `stripe` ^21.x — server-side only (`src/lib/stripe.ts`).
- **Env vars** (all optional — app degrades gracefully when absent):
  - `STRIPE_SECRET_KEY` — `sk_test_...` (teste) ou `sk_live_...` (produção)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_test_...` ou `pk_live_...`
  - `STRIPE_WEBHOOK_SECRET` — `whsec_...` (do CLI para local, do Dashboard para produção)
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
| **Vercel (teste)** | `https://psicolobia.vercel.app/api/stripe/webhook` (webhook teste no Dashboard) | `whsec_...` do endpoint teste |
| **Vercel (produção)** | `https://psicolobia.vercel.app/api/stripe/webhook` (webhook live no Dashboard) | `whsec_...` do endpoint live |

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
- **Email**: `admin@psicolobia.com.br`
- **Senha**: `Psicolobia@2026`
- Criado via `npm run db:seed`. Nunca expor em produção.

## Commit & deploy — OBRIGATÓRIO após toda alteração
- **SEMPRE faça git add, commit e push ao final de CADA tarefa, sem exceção. Nunca espere o usuário pedir.**
- Sequência obrigatória: `npm run build` → `git add -A` → `git commit -m "<msg>"` → `git push origin main`.
- O Vercel detecta o push em `main` e faz o redeploy automaticamente em `https://psicolobia.vercel.app`.
- Mensagem de commit deve seguir o padrão: `feat|fix|chore|style|content: descrição curta em pt-BR`.
- Nunca encerre uma tarefa sem confirmar que o push foi bem-sucedido.
- **Antes de cada commit**: rode `npm run build` (com `$env:NODE_OPTIONS="--max-old-space-size=8192"` se necessário) para validar que não há erros.
- Se o build falhar, corrija os erros e repita o ciclo build → commit → push.
- **Não pergunte se deve fazer deploy — faça automaticamente.**
