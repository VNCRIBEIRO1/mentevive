# Paywall Enforcement — MenteVive

## Estado Atual
- `subscriptionStatus` salvo em `tenants` via webhook Stripe (created/updated/deleted/payment_failed)
- `tenantPlanEnum`: free, starter, professional, enterprise
- `subscriptionStatusEnum`: trialing, active, past_due, canceled, unpaid, incomplete
- Plan limits no schema: `maxPatients`, `maxAppointmentsPerMonth` — **NÃO validados em nenhum lugar**
- Trial: 14 dias (CDKey ou Stripe trial period)
- Webhook atualiza status corretamente, MAS **nenhum guard checa status**
- Um tenant `canceled` continua acessando TUDO normalmente

## Objetivo
Bloquear acesso a funcionalidades quando a subscription está inativa, e enforcer limites de plano.

---

## Modelo de Acesso por Plano

| Feature | free | starter | professional | enterprise |
|---------|------|---------|-------------|------------|
| Pacientes | 5 | 20 | ∞ | ∞ |
| Agendamentos/mês | 20 | 100 | ∞ | ∞ |
| Prontuários | ✅ | ✅ | ✅ | ✅ |
| Blog | ❌ | ✅ | ✅ | ✅ |
| Grupos | ❌ | ❌ | ✅ | ✅ |
| Pagamentos Stripe | ❌ | ✅ | ✅ | ✅ |
| Videochamada | ✅ | ✅ | ✅ | ✅ |
| Notificações | ✅ | ✅ | ✅ | ✅ |
| Multi-profissional | ❌ | ❌ | ❌ | ✅ |
| Branding custom | ❌ | ❌ | ❌ | ✅ |

## Status do Tenant → Ação

| subscriptionStatus | Acesso |
|-------------------|--------|
| `trialing` | ✅ Full access (plano trial, 14 dias) |
| `active` | ✅ Full access (conforme plano) |
| `past_due` | ⚠️ Acesso read-only por 7 dias, depois bloqueia |
| `canceled` | ❌ Block — redirecionar para /admin/assinatura |
| `unpaid` | ❌ Block — redirecionar para /admin/assinatura |
| `incomplete` | ❌ Block — redirecionar para /admin/assinatura |

### Grace period (past_due)
- Quando `invoice.payment_failed` → status vira `past_due`
- 7 dias de grace period: acesso read-only (pode VER dados, NÃO pode criar/editar/deletar)
- Após 7 dias: mesmo tratamento que `canceled`

---

## Arquitetura de Implementação

### Opção escolhida: Guard layer no `api-auth.ts` + banner no layout

```
Fluxo:
1. User faz request → proxy.ts (auth check apenas)
2. API route chama requireAdmin() ou requireAuth()
3. Guard faz query do tenant (já tem tenantId do JWT)
4. Checa subscriptionStatus + plan limits
5. Se blocked → retorna 403 com mensagem específica
6. Se read-only (past_due grace) → permite GET, bloqueia POST/PUT/DELETE
```

### NÃO fazer no proxy.ts
O proxy já é complexo (edge middleware, JWT parsing). A lógica de subscription deve ficar no `api-auth.ts` onde já existe o tenant context.

---

## Implementação Step-by-Step

### 1. Helper de subscription check (`src/lib/subscription-access.ts`)

```typescript
import { db } from './db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

type AccessLevel = 'full' | 'read-only' | 'blocked';

interface SubscriptionAccess {
  level: AccessLevel;
  plan: string;
  message?: string;
  limits: {
    maxPatients: number | null;
    maxAppointmentsPerMonth: number | null;
  };
}

const GRACE_PERIOD_DAYS = 7;

export async function checkSubscriptionAccess(tenantId: string): Promise<SubscriptionAccess> {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      plan: true,
      subscriptionStatus: true,
      maxPatients: true,
      maxAppointmentsPerMonth: true,
      trialEndsAt: true,
      updatedAt: true,
    },
  });

  if (!tenant) return { level: 'blocked', plan: 'free', message: 'Tenant não encontrado', limits: { maxPatients: null, maxAppointmentsPerMonth: null } };

  const status = tenant.subscriptionStatus;
  const limits = {
    maxPatients: tenant.maxPatients,
    maxAppointmentsPerMonth: tenant.maxAppointmentsPerMonth,
  };

  // Active states
  if (status === 'active' || status === 'trialing') {
    // Check if trial has expired
    if (status === 'trialing' && tenant.trialEndsAt && new Date(tenant.trialEndsAt) < new Date()) {
      return { level: 'blocked', plan: tenant.plan, message: 'Período de teste expirado. Assine um plano para continuar.', limits };
    }
    return { level: 'full', plan: tenant.plan, limits };
  }

  // Grace period
  if (status === 'past_due') {
    const daysSince = Math.floor((Date.now() - new Date(tenant.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= GRACE_PERIOD_DAYS) {
      return { level: 'read-only', plan: tenant.plan, message: `Pagamento pendente. Acesso somente leitura por mais ${GRACE_PERIOD_DAYS - daysSince} dia(s).`, limits };
    }
    return { level: 'blocked', plan: tenant.plan, message: 'Pagamento pendente há mais de 7 dias. Atualize sua assinatura.', limits };
  }

  // Blocked states
  return { level: 'blocked', plan: tenant.plan, message: 'Assinatura inativa. Renove para continuar usando a plataforma.', limits };
}
```

### 2. Integrar no `api-auth.ts`

Modificar `requireAdmin()` e `requireAuth()` para incluir subscription check:

```typescript
// Após obter tenantId (já existente):

import { checkSubscriptionAccess } from './subscription-access';

// Dentro de requireAdmin():
const access = await checkSubscriptionAccess(tenantId);

if (access.level === 'blocked') {
  return {
    error: true,
    response: NextResponse.json(
      { error: 'Assinatura inativa', message: access.message, code: 'SUBSCRIPTION_BLOCKED' },
      { status: 403 }
    ),
  };
}

// Para requests de escrita em grace period:
if (access.level === 'read-only') {
  const method = /* get from request */;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return {
      error: true,
      response: NextResponse.json(
        { error: 'Acesso somente leitura', message: access.message, code: 'SUBSCRIPTION_READ_ONLY' },
        { status: 403 }
      ),
    };
  }
}

// Adicionar access ao retorno para uso na route:
return { error: false, session, tenantId, role, subscriptionAccess: access };
```

### 3. Plan limits enforcement

```typescript
// src/lib/plan-limits.ts

export async function checkPatientLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  const access = await checkSubscriptionAccess(tenantId);
  if (!access.limits.maxPatients) return { allowed: true }; // null = unlimited

  const count = await db.select({ count: sql`count(*)` })
    .from(patients)
    .where(eq(patients.tenantId, tenantId));

  const currentCount = Number(count[0].count);
  if (currentCount >= access.limits.maxPatients) {
    return { 
      allowed: false, 
      message: `Limite de ${access.limits.maxPatients} pacientes atingido. Faça upgrade do plano.` 
    };
  }
  return { allowed: true };
}

export async function checkAppointmentLimit(tenantId: string): Promise<{ allowed: boolean; message?: string }> {
  const access = await checkSubscriptionAccess(tenantId);
  if (!access.limits.maxAppointmentsPerMonth) return { allowed: true };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await db.select({ count: sql`count(*)` })
    .from(appointments)
    .where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.date, startOfMonth.toISOString())
    ));

  const currentCount = Number(count[0].count);
  if (currentCount >= access.limits.maxAppointmentsPerMonth) {
    return {
      allowed: false,
      message: `Limite de ${access.limits.maxAppointmentsPerMonth} agendamentos/mês atingido. Faça upgrade do plano.`
    };
  }
  return { allowed: true };
}
```

### 4. Integrar plan limits nas rotas de criação

| Rota | Check |
|------|-------|
| `POST /api/patients` | `checkPatientLimit(tenantId)` |
| `POST /api/appointments` | `checkAppointmentLimit(tenantId)` |
| `POST /api/blog` | Verificar se plano permite blog (`plan !== 'free'`) |
| `POST /api/groups` | Verificar se plano permite grupos (`plan === 'professional' \|\| plan === 'enterprise'`) |

### 5. Feature gates no schema (referência)

Criar mapa de features por plano:

```typescript
// src/lib/plan-features.ts
export const PLAN_FEATURES = {
  free:         { blog: false, groups: false, stripePayments: false, multiProfessional: false, branding: false },
  starter:      { blog: true,  groups: false, stripePayments: true,  multiProfessional: false, branding: false },
  professional: { blog: true,  groups: true,  stripePayments: true,  multiProfessional: false, branding: false },
  enterprise:   { blog: true,  groups: true,  stripePayments: true,  multiProfessional: true,  branding: true  },
} as const;

export function hasFeature(plan: string, feature: keyof typeof PLAN_FEATURES['free']): boolean {
  return PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]?.[feature] ?? false;
}
```

### 6. UI — Banner de alerta no admin layout

Modificar `src/app/admin/layout.tsx` para mostrar banner quando subscription tem problema:

```tsx
// Banner condicional no topo do admin panel
{subscriptionStatus === 'past_due' && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <p className="text-yellow-700">
      ⚠️ Pagamento pendente. Atualize sua assinatura para manter acesso completo.
      <Link href="/admin/assinatura" className="underline ml-2">Ver planos</Link>
    </p>
  </div>
)}
{subscriptionStatus === 'canceled' && (
  <div className="bg-red-50 border-l-4 border-red-400 p-4">
    <p className="text-red-700">
      🚫 Sua assinatura está inativa. Renove para continuar usando a plataforma.
      <Link href="/admin/assinatura" className="underline ml-2">Renovar agora</Link>
    </p>
  </div>
)}
```

### 7. Exceções — rotas que NÃO devem ter paywall

| Rota | Motivo |
|------|--------|
| `/admin/assinatura` (page + API) | Precisa acessar para RENOVAR |
| `/api/admin/subscription/*` | Endpoints de checkout/portal |
| `/api/stripe/webhook` | Deve processar eventos sempre |
| `/api/auth/*` | Login/logout não depende de assinatura |
| `/select-tenant` | Troca de tenant |
| `/portal/*` | Paciente não é cobrado — acesso do paciente não depende da subscription do tenant |

⚠️ **Portal do paciente**: O paciente NÃO é bloqueado pela subscription do tenant. O paywall afeta apenas o painel ADMIN. Se o tenant está bloqueado, pacientes ainda podem ver histórico (read-only).

---

## Verificações no Schema

Confirmar que existem estes campos na tabela `tenants`:
- [x] `plan` (tenantPlanEnum)
- [x] `subscriptionStatus` (subscriptionStatusEnum)
- [x] `maxPatients` (integer, nullable)
- [x] `maxAppointmentsPerMonth` (integer, nullable)
- [ ] `trialEndsAt` (timestamp) — **verificar se existe, se não, adicionar**
- [x] `updatedAt` (timestamp)

---

## Smoke Tests

1. Tenant com status `active` → acesso normal a tudo
2. Tenant com status `trialing` (dentro do prazo) → acesso normal
3. Tenant com status `trialing` (trial expirado) → bloqueado, redirect para /admin/assinatura
4. Tenant com status `past_due` (< 7 dias) → GET funciona, POST retorna 403 + mensagem
5. Tenant com status `past_due` (> 7 dias) → bloqueado completamente
6. Tenant com status `canceled` → bloqueado, banner vermelho
7. Criar paciente além do limite `maxPatients` → 403 com mensagem de limite
8. Criar agendamento além do `maxAppointmentsPerMonth` → 403 com mensagem
9. POST /api/blog com plano `free` → 403 "Feature não disponível no plano Free"
10. `/admin/assinatura` → acessível MESMO com tenant bloqueado
11. Portal do paciente → funciona mesmo com tenant `canceled`
