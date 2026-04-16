---
description: "Use when: validating multi-tenant flows, reviewing panels, checking route isolation, auditing access control, testing registration, verifying admin/portal/super features, checking buttons and navigation, verifying subscription billing, reviewing tenant separation, checking patient/therapist flows, multi-tenant audit, fluxo paciente, fluxo psicólogo, validação consultório."
---

# MenteVive — Validação Multi-Tenant Completa

## Arquitetura de Repositórios

| Repo | Função | Deploy | Banco |
|------|--------|--------|-------|
| **mentevive** | Plataforma SaaS multi-tenant (backend + admin + portal) | mentevive.vercel.app | Neon Postgres (multi-tenant) |
| **mentevive-psicolobia** | Landing page branded da Beatriz (shell, sem backend) | próprio Vercel | Nenhum |
| **psicolobia** | App legado standalone (será migrado/desativado) | psicolobia.vercel.app | Neon (standalone) |

> **Regra**: Todo código de backend, auth, API, DB deve estar APENAS em `mentevive`. Os outros repos são frontends ou legado.

---

## Modelo de Dados Multi-Tenant

### Hierarquia
```
Platform (MenteVive)
 └── Tenant (Consultório) ← tenants table
      ├── Owner (Psicólogo) ← users + tenantMemberships(role=admin)
      ├── Therapists ← users + tenantMemberships(role=therapist)
      └── Patients ← users + tenantMemberships(role=patient) + patients table
```

### Tabelas com tenantId obrigatório
TODAS as tabelas de dados exigem `tenantId` FK: `patients`, `appointments`, `payments`, `clinicalRecords`, `documents`, `blogPosts`, `groups`, `groupMembers`, `availability`, `customAvailability`, `blockedDates`, `notifications`, `settings`, `triages`.

### Roles do Sistema
| Campo | Escopo | Valores | Uso |
|-------|--------|---------|-----|
| `users.role` | Global | admin, therapist, patient | Legado, NÃO usar para controle de acesso |
| `tenantMemberships.role` | Por tenant | admin, therapist, patient | **AUTORITATIVE** — usar sempre |
| `users.isSuperAdmin` | Plataforma | boolean | Acesso a `/super` |
| `session.user.membershipRole` | JWT | admin, therapist, patient | Derivado de tenantMemberships |

> **REGRA CRÍTICA**: Nunca usar `session.user.role` para controle de acesso. Sempre usar `session.user.membershipRole` (per-tenant) ou `requireAdmin()`/`requireAuth()` que já extraem do JWT.

---

## Fluxo 1: Registro de Psicólogo (Cria Consultório)

**Rota**: `POST /api/auth/register` com `accountType: "therapist"`
**Página**: `/registro` (sem `?tenant=`)

### Sequência
1. Usuário acessa `/registro`, seleciona "Sou Psicólogo(a)"
2. Preenche: nome, email, senha, nome do consultório, CRP (opcional)
3. Frontend envia `POST /api/auth/register` com `accountType: "therapist"`
4. Backend:
   - Rate limit: 5 req/min por IP
   - Valida CAPTCHA (Turnstile)
   - Normaliza email (`.toLowerCase()`)
   - Verifica email único → 409 se existir
   - `slugify(clinicName)` → gera slug único (loop collision)
   - Cria `users` (role: therapist)
   - Cria `tenants` (slug, ownerUserId, plan: free)
   - Cria `tenantMemberships` (role: admin)
5. Retorna `{ tenantSlug }` → redireciona para `/login?tenant=slug`

### Validações obrigatórias
- [ ] Email normalizado antes de qualquer operação
- [ ] Slug único (loop até sem colisão)
- [ ] Constraint 23505 tratada → 409 (não 500)
- [ ] Payload inválido → 400 (não 500)
- [ ] CAPTCHA verificado
- [ ] Rate limit ativo

---

## Fluxo 2: Registro de Paciente (Entra no Consultório)

**Rota**: `POST /api/auth/register` com `accountType: "patient"` (ou sem)
**Página**: `/registro?tenant=slug-do-consultorio`

### Sequência
1. Paciente recebe link do consultório (ex: `mentevive.vercel.app/registro?tenant=psicolobia`)
2. Página detecta `?tenant=` → esconde seletor de tipo, assume paciente
3. Preenche: nome, email, senha, telefone
4. Frontend envia POST com `tenantSlug` no body
5. Backend:
   - Rate limit + CAPTCHA
   - **EXIGE `tenantSlug`** (sem fallback) → 400 se ausente
   - Valida tenant existe e está ativo → 404 se não
   - Se email já existe: usa user existente, verifica se já tem membership → 409 se duplicado
   - Se email novo: cria user (role: patient)
   - Cria `tenantMemberships` (role: patient)
   - Vincula ou cria registro `patients` (com tenantId)
   - Envia notificação ao admin do consultório
6. Retorna 201 → redireciona para `/login?tenant=slug`

### Validações obrigatórias
- [ ] `tenantSlug` OBRIGATÓRIO (nunca buscar "primeiro tenant disponível")
- [ ] Tenant deve estar `active: true`
- [ ] Email normalizado
- [ ] Paciente existente pode entrar em novo consultório (multi-membership)
- [ ] Paciente duplicado no mesmo consultório → 409
- [ ] Patient record vinculado por email se já existe no tenant

---

## Fluxo 3: Login + Seleção de Tenant

**Rota**: NextAuth CredentialsProvider → `/api/auth/select-tenant`
**Páginas**: `/login`, `/select-tenant`

### Sequência
1. Login com email + senha (rate limit: 8 tentativas/10min por IP+email)
2. CAPTCHA validado
3. Backend busca memberships ativas do usuário
4. Decisão:
   - **1 membership** → auto-seleciona tenant, JWT com `activeTenantId` + `membershipRole`
   - **N memberships** → `needsTenantSelection: true`, redireciona para `/select-tenant`
   - **0 memberships + superadmin** → login sem tenant, acessa `/super`
   - **0 memberships + não superadmin** → redireciona para `/login`
5. Se `/select-tenant`: lista consultórios, paciente seleciona, POST atualiza JWT
6. Redirect: `membershipRole === "patient"` → `/portal` | demais → `/admin`

### Validações obrigatórias
- [ ] `isSafeInternalCallback()` no callbackUrl (bloqueia open redirect)
- [ ] JWT contém `activeTenantId`, `membershipRole`, `tenantSlug`, `tenantName`
- [ ] Troca de tenant atualiza JWT completo (session.update)
- [ ] Proxy.ts valida JWT em TODAS as rotas protegidas

---

## Fluxo 4: Painel Admin (Psicólogo)

**Guard**: `requireAdmin()` → requer `membershipRole` = admin | therapist
**Layout**: `/admin/layout.tsx` com `AdminSidebar`

### Páginas e Funcionalidades

| Página | Rota | Funcionalidades | API Routes |
|--------|------|-----------------|------------|
| Dashboard | `/admin` | KPIs, contagem pacientes, receita | `GET /api/dashboard` |
| Pacientes | `/admin/pacientes` | Lista, busca, criar, editar, excluir | `GET/POST /api/patients`, `GET/PUT/DELETE /api/patients/[id]` |
| Novo Paciente | `/admin/pacientes/novo` | Formulário criação | `POST /api/patients` |
| Detalhe Paciente | `/admin/pacientes/[id]` | Editar, histórico, criar conta | `PUT /api/patients/[id]`, `POST /api/patients/[id]/create-account` |
| Agenda | `/admin/agenda` | Calendário, status, confirmar, lembrar | `GET/POST /api/appointments`, `PUT /api/appointments/[id]` |
| Horários | `/admin/horarios` | Disponibilidade, bloqueios | `GET/POST /api/availability`, `GET/POST/DELETE /api/blocked-dates` |
| Financeiro | `/admin/financeiro` | Pagamentos, Stripe status | `GET/POST /api/payments` |
| Prontuários | `/admin/prontuarios` | Notas clínicas | `GET/POST /api/clinical-records` |
| Blog | `/admin/blog` | CRUD posts | `GET/POST /api/blog`, `PUT/DELETE /api/blog/[id]` |
| Grupos | `/admin/grupos` | Terapia em grupo | `GET/POST /api/groups`, `/api/groups/[id]/members` |
| Assinatura | `/admin/assinatura` | Plano, trial, upgrade, CDKey | `GET/POST /api/admin/subscription`, `POST /api/admin/subscription/cdkey` |
| Configurações | `/admin/configuracoes` | Nome clínica, preços, horário | `GET/PUT /api/settings` |

### Validações por botão/ação
- [ ] **Criar paciente**: POST /api/patients → tenantId injetado do JWT
- [ ] **Editar paciente**: PUT /api/patients/[id] → filtra WHERE tenantId + id
- [ ] **Criar consulta**: POST /api/appointments → tenantId + patientId validados
- [ ] **Confirmar consulta**: PUT /api/appointments/[id] → status change + notificação
- [ ] **Registrar pagamento**: POST /api/payments → tenantId injetado
- [ ] **Nota clínica**: POST /api/clinical-records → tenantId + patientId validados
- [ ] **Publicar blog**: POST /api/blog → tenantId injetado, slug único por tenant
- [ ] **Upgrade plano**: POST /api/admin/subscription → cria Stripe checkout session
- [ ] **Resgatar CDKey**: POST /api/admin/subscription/cdkey → valida chave + ativa plano

---

## Fluxo 5: Portal do Paciente

**Guard**: `requireAuth()` + `membershipRole === "patient"`
**Layout**: `/portal/layout.tsx` com `PortalSidebar`

### Páginas e Funcionalidades

| Página | Rota | Funcionalidades | API Routes |
|--------|------|-----------------|------------|
| Início | `/portal` | Próximas consultas, progresso | `GET /api/portal/appointments` |
| Agendar | `/portal/agendar` | Selecionar data, horário, modalidade | `GET /api/portal/availability` (público), `POST /api/portal/appointments` |
| Processo | `/portal/processo` | Conteúdo educacional | Estático ou API |
| Sessões | `/portal/sessoes` | Histórico consultas, cancelar, entrar sala | `GET /api/portal/appointments` |
| Evolução | `/portal/evolucao` | Notas terapeuta, gráficos | `GET /api/portal/evolution` |
| Pagamentos | `/portal/pagamentos` | Histórico, faturas | `GET /api/portal/payments` |
| Documentos | `/portal/documentos` | Notas PDF, áudio | `GET /api/portal/documents` |
| LGPD | `/portal/consentimento` | Termos, permissões | `GET/POST /api/portal/consent` |
| Configurações | `/portal/configuracoes` | Perfil, senha, notificações | `GET/PUT /api/portal/settings` |
| Triagem | `/portal/triagem/[id]` | Formulário saúde mental | `GET/POST /api/portal/triagem` |
| Sala de Espera | `/portal/sala-espera/[id]` | Pré-sessão, Jitsi | `GET /api/portal/appointments/[id]` |

### Validações por ação
- [ ] **Agendar**: POST /api/portal/appointments → paciente só vê slots do SEU consultório
- [ ] **Cancelar**: POST /api/portal/appointments/[id]/cancel → paciente só cancela próprias consultas
- [ ] **Pagar**: POST /api/stripe/create-checkout → valida payment pertence ao paciente
- [ ] **Entrar sala**: Jitsi URL gerada apenas se consulta confirmada + horário correto
- [ ] **Ver pagamentos**: GET /api/portal/payments → filtra por userId + tenantId
- [ ] **Triagem**: POST /api/portal/triagem → vinculado ao appointmentId do paciente

---

## Fluxo 6: Super Admin (Plataforma)

**Guard**: `requireSuperAdmin()` → `isSuperAdmin: true`
**Layout**: `/super/layout.tsx`

| Página | Rota | Funcionalidades |
|--------|------|-----------------|
| Dashboard | `/super` | Métricas plataforma, total tenants |
| Consultórios | `/super/tenants` | Lista todos, plano, status Stripe |
| Detalhe | `/super/tenants/[id]` | Editar, ativar/desativar, mudar plano |
| CDKeys | `/super/cdkeys` | Gerar, listar, excluir chaves de ativação |

---

## Fluxo 7: Assinatura / Billing

**Stripe Account**: MenteVive Platform (`51TMsrUPO2zUrO8sv`)

### Planos
| Plano | Preço | Price ID | Funcionalidades |
|-------|-------|----------|-----------------|
| free | R$0 | — | Cadastro expirado sem acesso |
| starter | Trial/CDKey | — | Acesso básico temporário |
| professional | R$59,90/mês | `price_1TMsuvPO2zUrO8svtupLyfOt` | Todas features |
| enterprise | R$499,00/ano | `price_1TMsvaPO2zUrO8svsxb4kVOh` | Todas features + prioridade |

### Fluxo de upgrade
1. Admin acessa `/admin/assinatura`
2. Seleciona plano → POST /api/admin/subscription
3. Backend cria Stripe Checkout Session com `tenant_id` no metadata
4. Redirect para Stripe
5. Webhook `checkout.session.completed` → atualiza `tenants.plan`, `subscriptionStatus`
6. Webhook `customer.subscription.updated/deleted` → atualiza status
7. Webhook `invoice.payment_failed` → notifica admin

### Validações
- [ ] Stripe customer criado por tenant (não por user)
- [ ] Metadata contém `tenant_id` para webhook mapping
- [ ] CDKey: valida chave não usada, ativa plano correto, marca chave como usada
- [ ] Customer Portal funcional para gerenciar assinatura

---

## Isolamento de Tenant — Regras Obrigatórias

### Para TODA nova rota API
```typescript
// Admin route
const auth = await requireAdmin();
if (auth.error) return auth.response;
// auth.tenantId é OBRIGATÓRIO em todas as queries
const data = await db.select().from(table).where(eq(table.tenantId, auth.tenantId));
```

### Para TODA nova rota Portal
```typescript
// Portal route — filtra por tenant E por user
const auth = await requireAuth();
const patient = await getTenantPatientForUser(auth.tenantId, auth.session.user.id);
const data = await db.select().from(table)
  .where(and(eq(table.tenantId, auth.tenantId), eq(table.patientId, patient.id)));
```

### Para TODA nova página
- Admin layout: usar `membershipRole` (não `role`) no guard
- Portal layout: usar `membershipRole` (não `role`) no guard
- Proxy.ts: já valida server-side

### Checklist antes de qualquer merge/deploy
- [ ] Nova rota filtra por `tenantId`?
- [ ] Portal routes filtram também por `userId`/`patientId`?
- [ ] Rota pública precisa de `getPublicTenantId()` se retorna dados por tenant?
- [ ] Novas tabelas têm `tenantId` FK?
- [ ] Erros de constraint retornam 409 (não 500)?
- [ ] Rate limit ativo em rotas públicas?

---

## Proxy (Edge Middleware) — src/proxy.ts

### Rotas públicas (whitelist explícita)
`/api/auth/*`, `/api/stripe/webhook`, `/api/blog/*`, `/api/contact`, `/api/setup`, `/api/cron`, `/api/portal/availability`, `/api/portal/booked-slots`, `/api/portal/settings`, `/api/portal/blocked-dates`, `/_next/*`, `/favicon*`, `/`, `/login`, `/registro`, `/blog/*`

### Headers injetados
| Header | Valor | Uso |
|--------|-------|-----|
| `x-tenant-id` | UUID do tenant ativo | Backend extrai em routes |
| `x-membership-role` | admin/therapist/patient | Info adicional |
| `x-tenant-slug` | slug do subdomínio | Identificação por domínio |

### Redirecionamentos
| Condição | Destino |
|----------|---------|
| Não autenticado | `/login?callbackUrl=...` |
| Sem tenant selecionado + needsTenantSelection | `/select-tenant` |
| Patient tentando /admin | `/portal` |
| Non-super tentando /super | `/portal` |

---

## Smoke Tests Pós-Deploy

### Registro
1. Registrar como psicólogo → tenant criado → redirect para login
2. Registrar como paciente com `?tenant=slug` → membership criada → redirect para login
3. Registrar com email duplicado → 409
4. Registrar sem tenant (paciente) → 400
5. Registrar com tenant inativo → 404

### Login
1. Login psicólogo → redirect `/admin`
2. Login paciente (1 consultório) → redirect `/portal`
3. Login paciente (2+ consultórios) → redirect `/select-tenant`
4. Login com callbackUrl malicioso (`//evil.com`) → bloqueado por `isSafeInternalCallback()`

### Admin
5. Dashboard carrega KPIs do tenant correto
6. Listar pacientes → apenas do tenant
7. Criar paciente → vinculado ao tenant
8. Criar consulta → vinculada ao tenant + patient
9. Registrar pagamento → vinculado ao tenant
10. Publicar blog post → visível apenas no tenant
11. Upgrade plano → Stripe checkout funcional
12. Resgatar CDKey → plano ativado

### Portal
13. Agendar sessão → slots do consultório correto
14. Ver consultas → apenas próprias
15. Ver pagamentos → apenas próprios
16. Cancelar consulta → apenas próprias
17. Triagem → vinculada à consulta própria
18. Sala de espera → Jitsi URL válida

### Multi-tenant
19. Paciente em 2 consultórios → select-tenant funcional
20. Trocar tenant → JWT atualizado, dados mudam
21. Psicólogo A não vê dados do psicólogo B
22. Paciente no consultório A não vê dados do consultório B
