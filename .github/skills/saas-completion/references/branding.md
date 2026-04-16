# Branding — UI de Personalização por Tenant

## Estado Atual
**Schema pronto, UI 0%.**

### Já implementado:
- Coluna `tenants.branding` (JSONB, nullable) — schema: `{ logo?: string, primaryColor?: string, accentColor?: string }`
- Proxy (`src/proxy.ts`) resolve tenant por subdomain/slug
- CSS variables já usadas no layout para cores padrão da plataforma

### O que FALTA:
1. **Admin UI** para upload de logo + color picker
2. **API route** para salvar branding
3. **Aplicação dinâmica** — CSS custom properties por tenant
4. **Logo upload** — storage (Vercel Blob ou S3)
5. **Validação** — cores válidas, tamanho de logo

---

## Schema do Branding (JSONB)

```typescript
interface TenantBranding {
  logo?: string;          // URL do logo (Vercel Blob)
  primaryColor?: string;  // hex: #D4A574
  accentColor?: string;   // hex: #E8A0BF
  favicon?: string;       // URL do favicon (optional)
}
```

---

## Implementação Step-by-Step

### 1. API Routes

#### GET `/api/admin/branding` (CRIAR)
```typescript
export async function GET(request: Request) {
  const { error, response, tenantId } = await requireAdmin();
  if (error) return response;

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { branding: true, name: true },
  });

  return NextResponse.json({ branding: tenant?.branding || {} });
}
```

#### PUT `/api/admin/branding` (CRIAR)
```typescript
import { z } from 'zod';

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PUT(request: Request) {
  const { error, response, tenantId } = await requireAdmin();
  if (error) return response;

  const body = await request.json();
  const parsed = brandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  // Merge com branding existente (para não apagar logo)
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { branding: true },
  });

  const merged = { ...(tenant?.branding || {}), ...parsed.data };

  await db.update(tenants)
    .set({ branding: merged })
    .where(eq(tenants.id, tenantId));

  return NextResponse.json({ branding: merged });
}
```

#### POST `/api/admin/branding/logo` (CRIAR — upload)
```typescript
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const { error, response, tenantId } = await requireAdmin();
  if (error) return response;

  const form = await request.formData();
  const file = form.get('logo') as File;

  if (!file || !['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande (max 2MB)' }, { status: 400 });
  }

  const blob = await put(`branding/${tenantId}/logo`, file, {
    access: 'public',
    contentType: file.type,
  });

  // Salvar URL no branding
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { branding: true },
  });

  const merged = { ...(tenant?.branding || {}), logo: blob.url };
  await db.update(tenants)
    .set({ branding: merged })
    .where(eq(tenants.id, tenantId));

  return NextResponse.json({ logoUrl: blob.url });
}
```

### 2. UI — Seção de Branding

Localização: `src/app/admin/configuracoes/page.tsx` — nova seção ou tab.

#### Layout:
```
┌──────────────────────────────────────────────────┐
│  🎨 Identidade Visual                            │
│                                                    │
│  Logo                                              │
│  ┌──────────┐                                     │
│  │  [logo]  │  [ Upload novo logo ]               │
│  └──────────┘  PNG, JPG, SVG ou WebP (max 2MB)   │
│                                                    │
│  Cor Principal                                     │
│  [ ████ #D4A574 ]  ← input type="color" + hex    │
│                                                    │
│  Cor de Destaque                                   │
│  [ ████ #E8A0BF ]  ← input type="color" + hex    │
│                                                    │
│  Preview                                           │
│  ┌──────────────────────────────────────┐         │
│  │  Navbar mockup com cores aplicadas   │         │
│  │  Botão CTA com cor de destaque       │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  [ Restaurar padrão ]  [ Salvar alterações ]      │
└──────────────────────────────────────────────────┘
```

#### Componentes:
- `BrandingForm.tsx` — client component com color pickers + upload
- `BrandingPreview.tsx` — client component que renderiza preview live
- Upload via `<input type="file" accept="image/*">` + fetch POST
- Color picker: `<input type="color">` + input hex text sincronizado

### 3. Aplicação Dinâmica (CSS Custom Properties)

#### No layout root (`src/app/layout.tsx` ou `src/app/admin/layout.tsx`):
```tsx
// Buscar branding do tenant no server component
const tenant = await getCurrentTenant();
const branding = tenant?.branding;

const cssVars = {
  '--brand-primary': branding?.primaryColor || '#D4A574',
  '--brand-accent': branding?.accentColor || '#E8A0BF',
} as React.CSSProperties;

return (
  <html style={cssVars}>
    <body>{children}</body>
  </html>
);
```

#### No CSS (`globals.css`):
```css
:root {
  --brand-primary: #D4A574;
  --brand-accent: #E8A0BF;
}
```

#### Nos componentes — usar as variáveis:
```tsx
<button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)]">
  Agendar
</button>
```

### 4. Logo no Portal do Paciente

O portal do paciente (`/portal`) deve exibir o logo do terapeuta:

```tsx
// src/app/portal/layout.tsx
const tenant = await getCurrentTenant();
const logo = tenant?.branding?.logo;

return (
  <nav>
    {logo ? (
      <Image src={logo} alt={tenant.name} width={120} height={40} />
    ) : (
      <span className="font-fraunces text-xl">{tenant.name}</span>
    )}
  </nav>
);
```

### 5. Cache Invalidation

Ao salvar branding, invalidar cache do tenant (se usando Upstash):
```typescript
await invalidateCache(`tenant:${tenantSlug}`);
```

---

## Storage

**Recomendação: Vercel Blob** (tier free inclui 250MB, sem config extra).

```bash
npm install @vercel/blob
```

Env vars (Vercel configura automaticamente):
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

---

## Validações

| Campo | Validação |
|-------|-----------|
| primaryColor | Regex `^#[0-9a-fA-F]{6}$` |
| accentColor | Regex `^#[0-9a-fA-F]{6}$` |
| logo file type | `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp` |
| logo file size | Max 2MB |
| Contraste | Warning (não bloqueante) se contraste < 4.5:1 com background |

---

## Smoke Tests

1. Admin sem branding → cores padrão da plataforma aplicadas
2. Admin altera cores → preview atualiza em tempo real
3. Salvar cores → recarregar página → cores persistem
4. Upload logo PNG → aparece no preview e no portal
5. Upload arquivo > 2MB → erro 400
6. Upload .exe → erro 400 (tipo inválido)
7. Portal do paciente → exibe logo do terapeuta (se existir)
8. "Restaurar padrão" → volta para cores da plataforma
9. Cores inválidas (ex: "red") → validação rejeita
