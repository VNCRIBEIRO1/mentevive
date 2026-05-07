# Auditoria Atualizada — MenteVive (white-label / venda B2B)

> Atualiza e complementa [AUDITORIA_ADEQUACAO.md](AUDITORIA_ADEQUACAO.md).
> Baseline validado: `npm run build` ✓ · `npm run test:run` 245/245 ✓ · 16/05/2026.

## Sumário executivo

O sistema **está mais maduro do que parece** quando lido sob a ótica de venda B2B replicável.
Multi-tenancy com isolamento por linha já existe, Stripe Connect Express já existe, planos já existem.
O que falta para clonar/vender em escala é: (1) branding por tenant verdadeiramente lido em todas as
telas, (2) provisioning self-service (de venda → tenant criado), (3) tutoriais guiados in-app, e
(4) refresh visual com cara de "ambiente de terapia" (hoje a UI está em dark mode azul).

---

## 1. O que JÁ existe (não precisa ser construído)

### 1.1 Multi-tenancy real (não simulado)

- **Schema** ([src/db/schema.ts:59-97](src/db/schema.ts#L59-L97)):
  - `tenants` com: `slug`, `name`, `ownerUserId`, `landingDomain`, **`branding (jsonb)`**,
    `stripeAccountId`, `stripeOnboardingComplete`, `stripeCustomerId`, `stripeSubscriptionId`,
    `subscriptionStatus`, `currentPeriodEnd`, `trialEndsAt`, `plan`, `maxPatients`,
    `maxAppointmentsPerMonth`, `active`.
  - `tenantMemberships` (user × tenant × role) com unique index e índices de performance.
  - Tabelas de domínio (`patients`, `appointments`, `payments`, `clinical_records`, `documents`)
    todas escopadas por `tenant_id` (verificado em `lib/tenant-guards.ts`).

- **Helper de scope** ([src/lib/tenant-db.ts](src/lib/tenant-db.ts)):
  `tenantScope(tenantId)` injeta tenantId em SELECT/INSERT/UPDATE/DELETE automaticamente.
  Helper bem desenhado, evita vazamento entre tenants.

- **Auth multi-tenant** ([src/lib/auth.ts](src/lib/auth.ts)):
  - JWT inclui `activeTenantId`, `tenantSlug`, `tenantName`, `membershipRole`, `needsTenantSelection`.
  - Login com `?tenantSlug=` faz match contra memberships.
  - Superadmin pode operar sem tenant ativo.
  - Single membership → auto-select; múltiplas → redireciona para `/select-tenant`.

- **Páginas existentes**:
  - `/super/tenants` (CRUD de tenants pelo superadmin)
  - `/super/cdkeys` (gestão de chaves de ativação)
  - `/select-tenant` (seletor de tenant para usuários multi-tenant)

### 1.2 Stripe Connect Express (psicólogo recebe direto)

- **API** ([src/app/api/admin/stripe/connect/route.ts](src/app/api/admin/stripe/connect/route.ts)):
  - GET: verifica status (`not_connected` / `pending_onboarding` / `active`)
  - POST: cria conta Express ou retorna refresh link
  - Persiste `stripeAccountId` e `stripeOnboardingComplete` no tenant.

- **Stripe lib** ([src/lib/stripe.ts](src/lib/stripe.ts)) com `createConnectAccount`,
  `refreshConnectOnboardingLink`, `checkConnectAccountReady`, `isStripeConfigured`.

- **Webhook** com signature verification ([src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts)).

### 1.3 Planos e feature gating

[src/lib/plans.ts](src/lib/plans.ts):
- Plans: `free`, `basico`, `pro`, `starter`, `professional`, `enterprise`.
- Trial: 30 dias (basico), 90 dias (pro).
- Pós-trial: R$ 59,90/mês (professional) ou R$ 499/ano (enterprise).
- `isFeatureAllowed(plan, feature)` faz gate de blog, grupos, stripe_connect.
- `AdminLayout` mostra `TrialExpiredOverlay` se trial expirou e não há subscription ativa.

### 1.4 Estrutura admin & portal

**Admin** (psicólogo) — todas presentes:
- `/admin` (dashboard com receita/sessões/pendentes)
- `/admin/pacientes`, `/admin/pacientes/[id]`, `/admin/pacientes/novo`
- `/admin/agenda`, `/admin/horarios`, `/admin/prontuarios`
- `/admin/financeiro`, `/admin/assinatura`, `/admin/configuracoes`
- `/admin/sala-espera/[id]`

**Portal** (paciente) — todas presentes:
- `/portal` (dashboard paciente)
- `/portal/agendar`, `/portal/sessoes`, `/portal/processo`
- `/portal/evolucao`, `/portal/documentos`, `/portal/pagamentos`
- `/portal/triagem/[id]`, `/portal/consentimento`
- `/portal/sala-espera/[id]`, `/portal/configuracoes`

### 1.5 Landing comercial pública

[src/components/platform/PlatformLanding.tsx](src/components/platform/PlatformLanding.tsx) já tem:
Nav, Hero, Problem, SocialProof, Professionals, Features, HowItWorks, Pricing, FAQ, CTA, Footer.

### 1.6 Outros elementos

- 245 tests passando (vitest)
- Build limpo (Next.js 16.2.2)
- Rate limiting (`@upstash/ratelimit`)
- Turnstile captcha no login
- Jitsi para sala virtual (com config próprio)
- Notification system

---

## 2. O que FALTA para venda B2B em escala

### 2.1 Branding por tenant não é lido em todo lugar 🔴 CRÍTICO

**Problema**: a coluna `tenants.branding (jsonb)` existe, mas:
- **AdminSidebar** ([src/components/admin/AdminSidebar.tsx:48-54](src/components/admin/AdminSidebar.tsx#L48-L54))
  mostra hardcoded "Ψ" como logo + `session.user.tenantName` como nome.
  Não lê `tenant.branding.logo`, `branding.primaryColor`, etc.
- Cores no CSS são fixas (Tailwind `primary: #5B9BD5`, `bg: #111520`).
- Não há helper `useBranding()` que retorne tokens dinâmicos por tenant.

**Solução proposta**:
- Criar `lib/branding.ts` com `getTenantBranding(tenantId)` retornando shape `{ logo, primaryColor, accentColor, fontHeading, displayName }`.
- Em layouts SSR (admin/portal/landing tenant), ler branding e injetar como CSS variables (`<style>:root { --tenant-primary: …; }</style>`).
- Refatorar Sidebar, headers, e botões CTA para usar `var(--tenant-primary)` em vez do `bg-primary` fixo.
- Aceitar fallback para branding global (MenteVive) quando tenant não definir.

### 2.2 Provisioning self-service (compra → tenant criado) 🔴 CRÍTICO

**Problema**: `/api/super/tenants` POST exige superadmin (você manualmente cria cada tenant).
Não há fluxo público "psicólogo paga → tenant nasce".

**Solução proposta** (Stripe Checkout self-service):
1. Adicionar página `/cadastro-psicologo` (pública) — formulário: nome do consultório, slug,
   email do dono, senha, plano (Mensal/Anual). Validação client-side de slug livre.
2. POST a `/api/public/signup-psychologist`:
   - cria User (admin) com senha bcrypt
   - cria Tenant com `slug`, `branding: {}`, `plan: "starter"` (trial 7 dias)
   - cria TenantMembership (admin)
   - retorna Stripe Checkout Session com `customer_email`, `client_reference_id: tenantId`,
     metadata `{ tenantId, plan }`
3. Webhook `checkout.session.completed` lê `client_reference_id`, atualiza
   `tenant.plan = professional|enterprise`, `subscriptionStatus = "active"`,
   `stripeSubscriptionId`, `currentPeriodEnd`.
4. Redirect post-checkout → `/admin/configuracoes` com `?welcome=1` que dispara o tutorial.

### 2.3 Tutorial guiado in-app (react-joyride) 🟡 IMPORTANTE

**Falta**: nenhum onboarding interativo. `react-joyride` confirmado como escolha.

**Solução proposta**:
- `npm i react-joyride`
- `src/components/onboarding/PsychologistTour.tsx` (steps via `data-tour="..."`):
  1. Boas-vindas (overlay central)
  2. Sidebar — "Aqui ficam suas áreas: pacientes, agenda, prontuários…"
  3. Configurações → "Conecte seu Stripe para receber pagamentos direto"
  4. Horários → "Cadastre seus horários disponíveis"
  5. Pacientes → "Adicione seu primeiro paciente"
  6. Header help button "(?)" — "Tutorial sempre disponível aqui"
- `PatientTour.tsx` análogo para `/portal`.
- Persistência: `localStorage` + flag `users.tour_completed_at` (migration nova).
- Botão "(?)": ícone `HelpCircle` no header de admin e portal, relança tour.
- Estilo: customizar cores via `styles` prop do Joyride para combinar com tokens de marca.

### 2.4 Refresh visual "ambiente de terapia" 🟡 IMPORTANTE

**Estado atual** ([tailwind.config.ts](tailwind.config.ts)): paleta **dark mode** azul-cinza.
- `bg: #111520`, `card: #1D2130`, `txt: #E1E5ED`
- `primary: #5B9BD5` (azul)
- Sensação: "tech dashboard", não "consultório".

**Solução proposta** (alinhar com identidade já estabelecida em psicolobia):
- Light mode quente (warm):
  - `bg: #FFF5EE`, `bg-warm: #F9EDE3`, `card: #FFFFFF`
  - `txt: #3D2B1F`, `txt-light: #6B5445`, `txt-muted: #7D6E62`
  - `primary: #D4A574` (warm brown), `accent: #E8A0BF` (rose), `teal: #0f766e`
  - `sage: #e6f0eb`
- Tipografia: Fraunces (heading) + Inter (body), igual psicolobia.
- Componentes mais arredondados (radius 16-18px), sombras quentes.
- Manter a opção de re-skinning por tenant via branding tokens.

### 2.5 Documentos jurídicos dinâmicos 🟡 IMPORTANTE

[src/app/portal/consentimento/page.tsx](src/app/portal/consentimento/page.tsx) cita Beatriz/CRP
hardcoded. Para cada novo psicólogo é fricção legal.

**Solução proposta**:
- Schema: adicionar `consent_template_md (text)` em `tenants` (markdown com placeholders
  `{{name}}`, `{{crp}}`, `{{tenantName}}`).
- Renderizar consentimento substituindo placeholders por dados do owner do tenant + tenantName.
- Permitir override via campo `tenants.branding.consentMarkdown`.

### 2.6 Email transacional (Resend recomendado) 🟡 IMPORTANTE

Confirmação da auditoria anterior: `forgot-password` ainda não envia email.
- Adicionar Resend (mais simples que SES). 1 ENV: `RESEND_API_KEY`.
- Templates: reset de senha, confirmação de cadastro, boas-vindas pós-pagamento.

### 2.7 Onboarding domain customizado (opcional avançado) 🟢 BACKLOG

`tenants.landingDomain` já existe mas nenhum middleware lê. Para entregar landing
do psicólogo em domínio próprio (`drsouza.com`), precisaria:
- Middleware Vercel que mapeia host → tenant.
- Rewrite para `/[tenantSlug]/landing` com tema injetado.
- Config Vercel custom domain por tenant (manual hoje).

Deixar como backlog: psicólogo iniciante usa subpath `mentevive.app/dr-souza/`.

### 2.8 Itens da auditoria anterior ainda abertos

- ☐ Rotação real de credenciais (operacional, não código)
- ☐ Reescrita de histórico Git se compartilhado publicamente
- ☐ Email transacional (cobrado em 2.6)

---

## 3. Recomendação de execução faseada

### Fase A — Provisioning self-service + Stripe Checkout (~3h)
Maior alavanca comercial. Sem ela você continua criando tenants manualmente.
Arquivos: rota pública `/api/public/signup-psychologist`, página `/cadastro-psicologo`,
extensão do webhook `checkout.session.completed`.

### Fase B — Branding por tenant (~3h)
Liberta UI da marca atual. Pré-requisito para clonar visualmente sem mexer em código.
Arquivos: `lib/branding.ts`, layout SSR injetando CSS vars, refatoração de AdminSidebar,
header e botões críticos.

### Fase C — Tutorial react-joyride (~2h)
Reduz suporte 1:1. Aumenta taxa de ativação.
Arquivos: `components/onboarding/PsychologistTour.tsx`, `PatientTour.tsx`,
data-tour attributes, header `(?)` button, migration `users.tour_completed_at`.

### Fase D — Refresh visual "ambiente de terapia" (~4h)
Maior impacto percebido. Faz sentido depois de B (branding) para já testar com tenant exemplo.
Arquivos: `tailwind.config.ts` (paleta), `globals.css` (tokens), revisão por tela.

### Fase E — Consentimento dinâmico + email transacional (~2h)
Compliance legal e operacional. Necessário antes de aceitar primeiro cliente real.

**Total estimado**: ~14h, em 5 PRs sequenciais.

---

## 4. Validação atual

```
npm run build:    ✓ exit 0 (todas rotas geradas, middleware ok)
npm run test:run: ✓ 20 files, 245 tests, 0 failures
```

---

## 5. Decisões pendentes do produto

Antes de executar, alinhar:

1. **Onboarding self-service deve criar tenant ANTES ou DEPOIS do pagamento?**
   - Antes: tenant nasce em estado "pending_payment" e ativa via webhook.
   - Depois: criamos só após `checkout.session.completed`. Mais rastreável mas usuário fica
     "perdido" entre form e webhook.

2. **Branding global (MenteVive) deve aparecer ou não na landing tenant?**
   - "Powered by MenteVive" pequeno no footer? Ou white-label total?

3. **Tutorial obrigatório no primeiro login ou opcional?**
   - Sugestão: rodar automaticamente, mas com botão "Pular" sempre visível.

4. **Tema dark do SaaS atual deve ser mantido como opção (preferência do tenant)?**
   - Recomendação: descontinuar dark, padronizar light (branding pode pedir dark depois).
