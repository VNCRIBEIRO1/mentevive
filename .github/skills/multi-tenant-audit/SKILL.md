---
name: multi-tenant-audit
description: "Audit and onboard new tenants on MenteVive multi-tenant SaaS. Use when: onboarding new client, adding tenant, multi-tenant audit, production readiness, new landing page, new psicologo, novo cliente, novo tenant, clonar landing, captar cliente, checklist produção, tenant setup, Stripe Connect onboarding, landing template clone."
---

# Multi-Tenant Audit & Onboarding — MenteVive

Skill para auditar o sistema multi-tenant e onboardar novos clientes (tenants) na plataforma MenteVive.

## Arquitetura (3 repos)

| Repo | Função | Deploy |
|------|--------|--------|
| `mentevive` | Plataforma SaaS (auth, admin, portal, API) | mentevive.vercel.app |
| `mentevive-{slug}` | Landing page do cliente (template clonável) | {slug}.vercel.app |
| `{slug-legado}` | (Opcional) Shell de redirect 301 do domínio antigo | domínio antigo |

## Quando Usar

- **Onboarding de novo cliente** → Seções A + B + C
- **Auditoria de produção** → Seções D + E + F
- **Escalar para domínios customizados** → Seção G

---

## A. Criar Tenant no Banco

1. Inserir registro na tabela `tenants`:
   - `slug` (único, lowercase, sem espaços — ex: `psicolobia`)
   - `name` (nome exibido — ex: `Psicolobia`)
   - `ownerUserId` (ID do profissional já cadastrado)
   - `landingDomain` (URL da landing — ex: `mentevive-psicolobia.vercel.app`)
   - `plan` (free/starter/professional/enterprise)
   - `branding` (JSONB — logo, cores)
   - `active: true`

2. Criar `tenantMembership`:
   - Vincular o profissional com `role: "admin"`
   - Verificar: não pode existir membership duplicada `(userId, tenantId)`

3. Stripe Connect (se cobrar sessões):
   - Acessar `/admin` > Stripe Connect
   - Criar conta Express via `POST /api/admin/stripe/connect`
   - Completar onboarding no Stripe Dashboard
   - Verificar: `stripeAccountId` e `stripeOnboardingComplete: true` no tenant

## B. Clonar Landing Page

1. Clonar `mentevive-psicolobia` como `mentevive-{novo-slug}`
2. Editar **apenas** `lib/tenant.config.ts`:
   - `slug` → slug do novo tenant
   - `name` → nome do consultório
   - `professional` → nome, CRP, especialidades, foto
   - `urls.whatsapp` → link WhatsApp do profissional
   - `social` → Instagram, TikTok (vazio se não tiver)
   - `branding` → cores do consultório
   - `seo` → título, keywords

3. Editar `.env.local`:
   - `NEXT_PUBLIC_PLATFORM_URL=https://mentevive.vercel.app`
   - `NEXT_PUBLIC_SITE_URL=https://mentevive-{slug}.vercel.app`

4. Substituir `/public/bia.png` com foto do novo profissional

5. Verificar que **nenhum valor hardcoded** permanece:
   - Buscar por "psicolobia" no repo (deve existir somente em `tenant.config.ts`)
   - Todas as URLs usam `PLATFORM_URL` e `TENANT_SLUG` de `lib/utils.ts`

## C. Configurar Vercel

### Projeto da Landing
1. Criar projeto Vercel apontando para o novo repo
2. Env vars:
   - `NEXT_PUBLIC_PLATFORM_URL` = `https://mentevive.vercel.app`
   - `NEXT_PUBLIC_SITE_URL` = URL final do projeto

### Projeto da Plataforma (mentevive)
1. Adicionar a URL da nova landing em `ALLOWED_LANDING_ORIGINS` (separado por vírgula):
   ```
   ALLOWED_LANDING_ORIGINS=https://mentevive-psicolobia.vercel.app,https://mentevive-{slug}.vercel.app
   ```
   (Necessário para CORS no formulário de contato)

2. Turnstile: adicionar domínio da nova landing no Cloudflare Turnstile (se usar captcha no contato)

---

## D. Checklist de Proteção de Rotas

| Item | O que verificar |
|------|-----------------|
| **middleware.ts** | Arquivo `src/middleware.ts` existe e importa `proxy` de `@/proxy` |
| **Rotas protegidas** | `/admin/*`, `/portal/*`, `/select-tenant` requerem JWT válido |
| **Role check** | `/admin/*` só permite `admin` ou `therapist` |
| **Tenant obrigatório** | Rotas protegidas redirecionam para `/select-tenant` se JWT sem `activeTenantId` |
| **Login tenant param** | `/login?tenant={slug}` resolve membership automaticamente no JWT |
| **callbackUrl** | Após login, redireciona para `callbackUrl` (só paths relativos `/...`) |
| **select-tenant JWT** | Após selecionar tenant, `useSession().update()` atualiza JWT (não só cookies) |
| **Subdomain injection** | Proxy extrai slug de subdomain e injeta `?tenant=` em `/login` e `/registro` |

## E. Checklist de Isolamento de Dados

| Item | O que verificar |
|------|-----------------|
| **tenantScope()** | Todas queries em `api/admin/*` e `api/portal/*` usam `tenantScope(tenantId)` |
| **requireAuth()** | API routes usam `requireAuth()` ou `requireAdmin()` de `lib/api-auth.ts` |
| **Sem fallback** | Nenhuma query usa fallback para "primeiro tenant" em rotas protegidas |
| **Notificações** | `createNotification()` sempre recebe `tenantId` |
| **Blog** | Blog posts são filtrados por `tenantId` |
| **Stripe** | Pagamentos usam `stripe_account` do tenant (Connect) |

## F. Checklist de Env Vars (Plataforma)

| Variável | Obrigatória | Onde |
|----------|-------------|------|
| `DATABASE_URL` | Sim | Neon Postgres |
| `NEXTAUTH_URL` | Sim | URL da plataforma |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Sim | Segredo JWT |
| `STRIPE_SECRET_KEY` | Sim | Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Sim | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Sim | Stripe |
| `TURNSTILE_SECRET_KEY` | Sim | Cloudflare |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sim | Cloudflare |
| `NEXT_PUBLIC_APP_URL` | Sim | URL frontend |
| `ALLOWED_LANDING_ORIGINS` | Sim (se landing existe) | URLs das landings separadas por vírgula |
| `SETUP_SECRET` | Opcional | Bootstrap |

## G. Escalar para Domínios Customizados

Quando um cliente quiser `www.consultorio.com.br` em vez de `.vercel.app`:

1. **Vercel**: Adicionar domínio customizado no projeto da landing
2. **DNS**: CNAME apontando para `cname.vercel-dns.com`
3. **Turnstile**: Registrar novo domínio no Cloudflare
4. **ALLOWED_LANDING_ORIGINS**: Adicionar `https://www.consultorio.com.br`
5. **Subdomain routing** (futuro): Para `slug.mentevive.com.br`, adicionar wildcard DNS e configurar no `proxy.ts` → `PLATFORM_HOSTS`
6. **tenants.landingDomain**: Atualizar no banco com o novo domínio

## H. Valores que NÃO Devem Estar Hardcoded

Estes devem vir de env vars ou do `tenant.config.ts`:

| Local | Valor | Deve ser |
|-------|-------|----------|
| `layout.tsx` metadataBase | URL hardcoded | `NEXTAUTH_URL` ou `NEXT_PUBLIC_APP_URL` |
| `sitemap.ts`, `robots.ts` | URL canônica | `NEXT_PUBLIC_APP_URL` |
| `proxy.ts` PLATFORM_HOSTS | Lista de hosts | Incluir prod domain quando migrar |
| Landing URLs | `?tenant=slug` | `TENANT_SLUG` de `tenant.config.ts` |
| `stripe.ts` fallback URL | URL da plataforma | `NEXTAUTH_URL` (já corrigido p/ throw) |

---

## Fluxo Completo de um Novo Paciente

```
Landing ({slug}.vercel.app)
  └─ Clica "Entrar"
      └─ GET mentevive.vercel.app/login?tenant={slug}
          └─ Faz login (signIn com tenantSlug)
              └─ auth.ts resolve membership pelo slug
                  ├─ 1 membership → auto-select → JWT com tenant claims
                  ├─ N memberships → /select-tenant → update JWT
                  └─ 0 memberships (novo) → /registro?tenant={slug}
                      └─ register API cria user + membership + patient
                          └─ redirect /login?tenant={slug}
```

## Fluxo de Formulário de Contato (Cross-Origin)

```
Landing Contact.tsx
  └─ POST {PLATFORM_URL}/api/contact?tenant={slug}
      └─ CORS check (ALLOWED_LANDING_ORIGINS)
          └─ getPublicTenantId() resolve via ?tenant= param
              └─ createNotification() → admin recebe no painel
```
