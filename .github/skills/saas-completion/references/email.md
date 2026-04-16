# Email Transacional — MenteVive

## Estado Atual
- `src/app/api/auth/forgot-password/route.ts` gera token mas faz `console.log` do link — **não envia email**
- `src/lib/notifications.ts` cria notificações **in-app** (DB only) — nenhum canal externo
- Nenhum provider configurado (sem Resend, SendGrid, Nodemailer)
- `console.warn("no transactional email provider is configured")` no forgot-password

## Objetivo
Integrar provedor de email + criar 6 templates transacionais essenciais para o SaaS funcionar.

---

## Provider Recomendado: Resend

| Critério | Resend | SendGrid | AWS SES |
|----------|--------|----------|---------|
| Free tier | 3.000/mês | 100/dia | 62.000/mês (só EC2) |
| Setup | 1 npm install | 1 npm install | SDK + IAM config |
| Vercel compat | ✅ Nativo | ✅ OK | ⚠️ Cold start |
| React Email | ✅ Templates JSX | ❌ Handlebars | ❌ Raw HTML |
| Preço (paid) | $20/50k | $20/50k | $0.10/1k |

**Escolha: Resend** — menor setup, React Email nativo, free tier suficiente para início.

---

## Arquitetura

```
src/lib/
  ├── email.ts              — Resend client + sendEmail() wrapper
  └── email-templates/
      ├── welcome.tsx        — Boas-vindas (therapist + patient)
      ├── password-reset.tsx — Link de redefinição de senha
      ├── appointment-reminder.tsx  — Lembrete de sessão (24h antes)
      ├── payment-receipt.tsx       — Recibo de pagamento
      ├── subscription-alert.tsx    — Trial expirando / pagamento falhou
      └── layout.tsx         — Layout base compartilhado (header, footer, brand)
```

---

## Templates Detalhados

### Template 1: Welcome (Boas-vindas)

**Trigger**: Após registro bem-sucedido (therapist ou patient)
**Onde dispara**: `src/app/api/auth/register/route.ts` — após insert no DB

| Campo | Therapist | Patient |
|-------|-----------|---------|
| Subject | "Bem-vindo ao MenteVive, {name}!" | "Bem-vindo ao consultório {tenantName}!" |
| Body | Seu consultório foi criado. Próximos passos: configurar horários, preços, e compartilhar link de agendamento. | Você foi cadastrado no consultório de {therapistName}. Acesse o portal para ver sessões e documentos. |
| CTA | "Configurar meu consultório" → /admin/configuracoes | "Acessar portal" → /portal |

**Layout**:
```
┌──────────────────────────────┐
│  [Logo MenteVive]            │
├──────────────────────────────┤
│  Olá, {name}! 👋             │
│                              │
│  {body text}                 │
│                              │
│  [ CTA Button ]              │
│                              │
│  Se precisar de ajuda:       │
│  suporte@mentevive.com.br    │
├──────────────────────────────┤
│  © 2026 MenteVive            │
│  Você recebeu este email     │
│  porque se cadastrou em      │
│  mentevive.vercel.app        │
└──────────────────────────────┘
```

### Template 2: Password Reset

**Trigger**: POST `/api/auth/forgot-password`
**Onde dispara**: `src/app/api/auth/forgot-password/route.ts` — substituir console.log por sendEmail()

| Campo | Valor |
|-------|-------|
| Subject | "Redefinir sua senha — MenteVive" |
| Body | Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo (válido por 1 hora). Se não foi você, ignore este email. |
| CTA | "Redefinir minha senha" → /redefinir-senha?token={token} |
| Warning | "Este link expira em 1 hora." |

### Template 3: Appointment Reminder (24h antes)

**Trigger**: Cron job ou scheduled function (nova rota necessária)
**Onde dispara**: `src/app/api/cron/appointment-reminders/route.ts` (CRIAR)

| Campo | Valor |
|-------|-------|
| Subject | "Lembrete: sessão amanhã às {time}" |
| Body | Sua sessão com {therapistName} está agendada para {date} às {time}. |
| CTA (online) | "Acessar sala de espera" → /portal/sala-espera/{appointmentId} |
| CTA (presencial) | "Ver detalhes" → /portal/sessoes |
| Info extra | Tipo: {modality} | Duração: {duration} min |

### Template 4: Payment Receipt

**Trigger**: Webhook `checkout.session.completed`
**Onde dispara**: `src/app/api/stripe/webhook/route.ts` — após atualizar status do pagamento

| Campo | Valor |
|-------|-------|
| Subject | "Recibo de pagamento — R$ {amount}" |
| Body | Pagamento confirmado para sessão de {date}. |
| Detalhes | Valor: R$ {amount} | Método: {method} | Data: {paidAt} |
| CTA | "Ver meus pagamentos" → /portal/pagamentos |

### Template 5: Subscription Alert

**Trigger**: Webhook `invoice.payment_failed` ou cron para trial ending
**Dispara em 2 cenários**:

**5a — Trial Expirando (3 dias antes)**
| Campo | Valor |
|-------|-------|
| Subject | "Seu período de teste termina em 3 dias" |
| Body | Seu trial do MenteVive expira em {date}. Para continuar usando, assine um plano. |
| CTA | "Ver planos" → /admin/assinatura |

**5b — Pagamento Falhou**
| Campo | Valor |
|-------|-------|
| Subject | "Problema com seu pagamento — MenteVive" |
| Body | Não conseguimos processar seu pagamento. Atualize sua forma de pagamento para manter o acesso. |
| CTA | "Atualizar pagamento" → Stripe Customer Portal |

### Template 6: Layout Base (compartilhado)

```tsx
// src/lib/email-templates/layout.tsx
export function EmailLayout({ children, previewText }) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#FFF5EE', fontFamily: 'Inter, sans-serif' }}>
        <Container style={{ maxWidth: 580, margin: '0 auto', padding: '20px' }}>
          {/* Header */}
          <Section style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text style={{ fontSize: 24, fontWeight: 600, color: '#D4A574' }}>
              MenteVive
            </Text>
          </Section>
          
          {/* Content */}
          <Section style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 12, 
            padding: '32px',
            border: '1px solid #e6f0eb' 
          }}>
            {children}
          </Section>
          
          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>
            <Text>© 2026 MenteVive. Todos os direitos reservados.</Text>
            <Text>Você recebeu este email por ter conta em mentevive.vercel.app</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Implementação Step-by-Step

### 1. Instalar dependências
```bash
npm install resend @react-email/components
```

### 2. Configurar env vars
```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="MenteVive <noreply@mentevive.com.br>"
```
> Nota: Para domínio custom precisa configurar DNS (SPF/DKIM) no Resend. Para início, usar domínio gratuito `onboarding@resend.dev`.

### 3. Criar email service (`src/lib/email.ts`)
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail({ 
  to, subject, react 
}: { 
  to: string; subject: string; react: React.ReactElement 
}) {
  if (!isEmailConfigured()) {
    console.warn('[email] RESEND_API_KEY not configured — email not sent');
    return { success: false, error: 'not-configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'MenteVive <onboarding@resend.dev>',
      to,
      subject,
      react,
    });
    
    if (error) {
      console.error('[email] Send failed:', error);
      return { success: false, error };
    }
    
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[email] Exception:', err);
    return { success: false, error: err };
  }
}
```

### 4. Criar templates (React Email JSX)
Criar cada um dos 6 templates em `src/lib/email-templates/` seguindo os specs acima.

### 5. Integrar nos pontos de disparo

| Template | Arquivo a modificar | O que mudar |
|----------|---------------------|-------------|
| Welcome | `src/app/api/auth/register/route.ts` | Após criar user + membership, chamar `sendEmail()` com welcome template |
| Password Reset | `src/app/api/auth/forgot-password/route.ts` | Substituir `console.log(resetUrl)` por `sendEmail()` com password-reset template |
| Appointment Reminder | CRIAR: `src/app/api/cron/appointment-reminders/route.ts` | Query appointments de amanhã, enviar email para cada paciente |
| Payment Receipt | `src/app/api/stripe/webhook/route.ts` | No handler de `checkout.session.completed`, após atualizar DB, enviar receipt |
| Subscription Alert | CRIAR: `src/app/api/cron/subscription-alerts/route.ts` | Query trials que expiram em 3 dias, enviar alerta |
| Subscription Alert (fail) | `src/app/api/stripe/webhook/route.ts` | No handler de `invoice.payment_failed`, enviar alerta ao tenant owner |

### 6. Cron jobs (Vercel Cron)
Adicionar em `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/subscription-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 7. Adicionar path público no proxy
Em `src/proxy.ts`, adicionar `/api/cron/*` à lista de public paths (já está — verificar).

### 8. Vercel env vars
```bash
echo "re_xxxxxxxxxxxx" | npx vercel env add RESEND_API_KEY production --force
echo "MenteVive <noreply@mentevive.com.br>" | npx vercel env add EMAIL_FROM production --force
```

---

## Degradação Graciosa

O `isEmailConfigured()` garante que:
- Sem `RESEND_API_KEY` → email não enviado, app não quebra
- Forgot password sem email → retorna 200 (segurança — não revelar se email existe) + console.warn
- Lembretes sem email → cron executa sem erro, log de warning

---

## Smoke Tests

1. Forgot password flow: POST `/api/auth/forgot-password` com email válido → checar inbox Resend (ou log em dev)
2. Registro therapist → email de boas-vindas recebido
3. Registro paciente → email de boas-vindas (com nome do consultório)
4. Completar pagamento Stripe → email de recibo recebido
5. `stripe trigger invoice.payment_failed` → email de alerta ao dono do tenant
6. Sem `RESEND_API_KEY` → app funciona normal, console.warn no log
