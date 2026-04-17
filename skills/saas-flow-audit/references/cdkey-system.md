# CDKey System Reference

## Database Schema

```sql
-- cdkeys table
CREATE TABLE cdkeys (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,     -- 16-char hex
  plan VARCHAR(20) NOT NULL,             -- free | starter | professional | enterprise
  duration_days INTEGER NOT NULL DEFAULT 30,
  tenant_id INTEGER REFERENCES tenants(id),
  redeemed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- tenants table (subscription fields)
-- plan: free | starter | professional | enterprise
-- subscription_status: trialing | active | past_due | canceled | expired
-- trial_ends_at: TIMESTAMP (null = no trial / never expires)
```

## CDKey Code Format

- 16 characters, uppercase hexadecimal
- Generated with `crypto.randomBytes(8).toString('hex').toUpperCase()`
- Example: `A1B2C3D4E5F6G7H8`
- Must be unique across all CDKeys

## Generation Rules

- Only super admin can generate
- Batch size: 1 to 50 per request
- Each key tied to a specific plan
- Default duration: 30 days (configurable: 30, 60, 90, 180, 365)
- Keys are single-use (once redeemed, cannot be reused)

## Redemption Flow

```
1. Tenant admin enters CDKey in /admin/assinatura
2. POST /api/admin/subscription/cdkey { code: "..." }
3. Server validates:
   a. Code exists in DB
   b. Code not yet redeemed (redeemedAt IS NULL)
   c. Code plan is valid
4. Server updates:
   a. CDKey: set redeemedAt = now(), tenantId = current tenant
   b. Tenant: plan = cdkey.plan, subscriptionStatus = 'trialing', 
      trialEndsAt = now() + cdkey.durationDays
5. Return success with new plan details
```

## Trial Expiration

```
Check: tenant.trialEndsAt < Date.now()

If expired AND no active Stripe subscription:
  → subscriptionStatus = 'expired'
  → Restrict premium features
  → Show upgrade/renew prompt

If expired AND has Stripe subscription:
  → Keep active (Stripe manages)
```

## Planos e Preços (Fonte de Verdade)

### Plano Básico — R$ 399,00 (pagamento único)
- Landing page vitalícia (deploy próprio no Vercel)
- 30 dias de teste do portal (pacientes ilimitados)
- CDKey duration: 30 days
- CDKey plan: `basico`

### Plano Pro — R$ 499,00 (pagamento único)
- Landing page vitalícia
- 90 dias de teste do SaaS completo
- CDKey duration: 90 days
- CDKey plan: `pro`

### Após o Trial (ambos os planos)
- **Mensal:** R$ 59,90/mês
- **Anual:** R$ 499,00/ano (~R$ 41,58/mês — economia de 30%)
- Cobrança via Stripe (cartão ou PIX)
- Se não pagar: `subscriptionStatus = 'expired'` → features bloqueadas

### Plan Hierarchy

```
basico < pro

CDKey can upgrade: basico → pro
CDKey can extend: same plan → reset trialEndsAt
CDKey CANNOT downgrade: pro → basico (reject)
```
