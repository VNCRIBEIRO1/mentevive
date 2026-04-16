# Stripe Connect — Onboarding do Terapeuta

## Estado Atual
**Backend 70% pronto**, frontend 0%.

### Já implementado (`src/lib/stripe.ts`):
- `createConnectAccount(tenantSlug, tenantId, returnUrl, refreshUrl)` → cria Standard account
- `refreshConnectOnboardingLink(accountId, returnUrl, refreshUrl)` → gera novo link de onboarding
- `checkConnectAccountReady(accountId)` → checa `details_submitted`, `charges_enabled`, `payouts_enabled`
- `createConnectedCheckoutSession()` → cria checkout com `transfer_data.destination` + `application_fee_amount`

### Já no schema (`tenants`):
- `stripeAccountId` (text, nullable)
- `stripeOnboardingComplete` (boolean, default false)

### Já visível no super admin:
- `src/app/super/tenants/[id]/page.tsx` mostra status da conta Connect

### O que FALTA:
1. **Página de onboarding no admin** — terapeuta não tem como iniciar vinculação
2. **API route para iniciar Connect** — criar/redirecionar
3. **Callback page** — processar retorno do Stripe onboarding
4. **Checkout integration** — rota de checkout do paciente usar a connected account do tenant
5. **UI de status** na página de assinatura/configurações

---

## Fluxo Completo (User Journey)

```
Terapeuta registra → Cria tenant (stripeAccountId = null)
                   ↓
Admin panel → /admin/configuracoes ou /admin/assinatura
           → Banner: "Configure recebimentos para aceitar pagamentos de pacientes"
           → Click "Configurar recebimento"
                   ↓
API POST /api/admin/connect/onboard
           → Cria Standard Connected Account no Stripe
           → Salva stripeAccountId no tenant
           → Retorna onboarding URL
                   ↓
Redirect → Stripe Connect Onboarding (external)
           → Terapeuta preenche dados bancários, documentos, etc.
           → Stripe redireciona para returnUrl
                   ↓
Callback → /admin/configuracoes?connect=success
           → API GET /api/admin/connect/status
           → Se charges_enabled → marca stripeOnboardingComplete = true
           → Mostra: "Recebimentos configurados ✅"
                   ↓
Paciente agenda → POST /api/stripe/create-checkout
               → Se tenant tem connected account:
                    → Checkout com transfer_data + application_fee
               → Se NÃO tem:
                    → Checkout normal (plataforma recebe tudo)
```

---

## Implementação Step-by-Step

### 1. API Routes

#### POST `/api/admin/connect/onboard` (CRIAR)
```typescript
// Cria ou reconecta Standard account
export async function POST(request: Request) {
  const { error, response, session, tenantId } = await requireAdmin();
  if (error) return response;

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const returnUrl = `${baseUrl}/admin/configuracoes?connect=success`;
  const refreshUrl = `${baseUrl}/admin/configuracoes?connect=refresh`;

  let accountId = tenant.stripeAccountId;
  let onboardingUrl: string;

  if (!accountId) {
    // Criar nova conta
    const result = await createConnectAccount(
      tenant.slug, tenantId, returnUrl, refreshUrl
    );
    accountId = result.accountId;
    onboardingUrl = result.onboardingUrl;
    
    // Salvar accountId no tenant
    await db.update(tenants)
      .set({ stripeAccountId: accountId })
      .where(eq(tenants.id, tenantId));
  } else {
    // Recriar link de onboarding
    onboardingUrl = await refreshConnectOnboardingLink(
      accountId, returnUrl, refreshUrl
    );
  }

  return NextResponse.json({ onboardingUrl });
}
```

#### GET `/api/admin/connect/status` (CRIAR)
```typescript
export async function GET(request: Request) {
  const { error, response, session, tenantId } = await requireAdmin();
  if (error) return response;

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { stripeAccountId: true, stripeOnboardingComplete: true },
  });

  if (!tenant?.stripeAccountId) {
    return NextResponse.json({ connected: false, status: 'not-started' });
  }

  const ready = await checkConnectAccountReady(tenant.stripeAccountId);
  
  // Atualizar flag se mudou
  if (ready.chargesEnabled && !tenant.stripeOnboardingComplete) {
    await db.update(tenants)
      .set({ stripeOnboardingComplete: true })
      .where(eq(tenants.id, tenantId));
  }

  return NextResponse.json({
    connected: true,
    status: ready.chargesEnabled ? 'active' : 'pending',
    details: {
      detailsSubmitted: ready.detailsSubmitted,
      chargesEnabled: ready.chargesEnabled,
      payoutsEnabled: ready.payoutsEnabled,
    },
  });
}
```

### 2. UI — Card de recebimentos

Adicionar card na página de configurações (`src/app/admin/configuracoes/page.tsx`):

```
┌──────────────────────────────────────────────────┐
│  💳 Recebimento de Pagamentos                     │
│                                                    │
│  [Se não conectado:]                              │
│  Configure sua conta para receber pagamentos       │
│  diretamente dos pacientes via Stripe.             │
│  [ Configurar recebimento → ]                     │
│                                                    │
│  [Se onboarding pendente:]                        │
│  Conta criada, mas o cadastro está incompleto.     │
│  [ Continuar cadastro → ]                         │
│                                                    │
│  [Se conectado:]                                  │
│  ✅ Recebimentos ativos                            │
│  Pagamentos de pacientes vão direto para sua conta │
│  Taxa da plataforma: 5%                           │
│  [ Abrir Dashboard Stripe → ]                     │
└──────────────────────────────────────────────────┘
```

### 3. Modificar checkout do paciente

Atualizar `src/app/api/stripe/create-checkout/route.ts` para usar connected account:

```typescript
// Buscar tenant
const tenant = await db.query.tenants.findFirst({
  where: eq(tenants.id, tenantId),
  columns: { stripeAccountId: true, stripeOnboardingComplete: true },
});

// Se tenant tem Connect configurado → checkout conectado
if (tenant?.stripeAccountId && tenant.stripeOnboardingComplete) {
  const session = await createConnectedCheckoutSession({
    connectedAccountId: tenant.stripeAccountId,
    applicationFeeAmount: Math.round(amount * 0.05), // 5% plataforma
    // ... rest of checkout params
  });
} else {
  // Checkout normal (plataforma recebe tudo — fallback)
  const session = await stripe.checkout.sessions.create({
    // ... current behavior
  });
}
```

### 4. Application Fee (Taxa da Plataforma)

| Plano | Taxa |
|-------|------|
| free | N/A (sem Stripe Connect) |
| starter | 10% |
| professional | 5% |
| enterprise | 3% |

Configurar em `src/lib/plan-features.ts`:
```typescript
export const PLATFORM_FEE_PERCENT = {
  free: 0,
  starter: 10,
  professional: 5,
  enterprise: 3,
} as const;
```

### 5. Webhook — processar eventos da Connected Account

O webhook do Stripe já existe. Adicionar handling para eventos de Connected Accounts:
- `account.updated` → checar se `charges_enabled` mudou → atualizar `stripeOnboardingComplete`
- Usar `stripe.webhooks.constructEvent()` com o header correto para connected accounts

### 6. Dashboard link para terapeuta

O Stripe permite gerar login links para que o terapeuta veja seu dashboard:
```typescript
const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
// → Redirecionar terapeuta para loginLink.url
```

Adicionar botão "Abrir Dashboard Stripe" na página de configurações.

---

## Proxy/Public Paths

Adicionar novas rotas à lista de paths que requerem auth (já coberto por `requireAdmin()`):
- `/api/admin/connect/onboard` — POST (admin only)
- `/api/admin/connect/status` — GET (admin only)

---

## Considerações de Segurança

1. **Nunca expor `stripeAccountId`** para o paciente — apenas admin/therapist vê
2. **Webhook validation**: Stripe Connect webhooks podem ter signing secret diferente
3. **Verificar `charges_enabled`** antes de criar checkout conectado — se false, usar checkout normal
4. **Application fee**: calcular no server-side, nunca aceitar do client

---

## Smoke Tests

1. Admin sem Connect → vê card "Configurar recebimento"
2. Click "Configurar recebimento" → redirect para Stripe onboarding
3. Após onboarding → voltar para configurações com ?connect=success → status "Ativo"
4. Paciente cria checkout → payment vai para connected account (com fee)
5. Paciente cria checkout (tenant SEM Connect) → payment vai para plataforma
6. Super admin vê status do Connect em `/super/tenants/[id]`
7. `stripe trigger account.updated` → stripeOnboardingComplete atualizado
