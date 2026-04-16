# Escalabilidade — Rate Limit, Cache, Pooling

## Estado Atual
**Parcialmente funcional, mas frágil.**

### Já implementado:
- `src/lib/rate-limit.ts` — Rate limiter com sliding window usando `Map<string, number[]>` em memória
  - Login: 5 req / 15 min
  - Register: 3 req / hora
  - API geral: 30 req / min
- API routes usam `checkRateLimit()` para proteção
- Neon Postgres com pool nativo no adapter

### Problemas:
1. **Rate limiter in-memory** — resets a cada cold start do Vercel (cada instance tem Map próprio)
2. **Sem cache de queries** — cada request faz query direta ao Neon
3. **Sem paginação** — listagens retornam todas as rows (ex: lista de pacientes, agendamentos)
4. **Sem connection pooling explícito** — usando pool padrão do Neon adapter

---

## Implementação Step-by-Step

### 1. Rate Limiter com Upstash Redis

**Por quê:** Upstash Redis tem tier free (10K commands/dia), SDK nativo para Vercel Edge, persistência entre cold starts.

#### 1a. Instalar
```bash
npm install @upstash/redis @upstash/ratelimit
```

#### 1b. Configurar env vars
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx
```

#### 1c. Substituir `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters por tipo
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:login',
});

export const registerLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:register',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:api',
});

// Helper compatível com interface existente
export async function checkRateLimit(
  identifier: string,
  type: 'login' | 'register' | 'api' = 'api'
) {
  const limiter = type === 'login' ? loginLimiter
    : type === 'register' ? registerLimiter
    : apiLimiter;

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(reset),
    },
  };
}
```

#### 1d. Manter fallback
Se `UPSTASH_REDIS_REST_URL` não definida → log warning e usar in-memory current (dev/local).

```typescript
const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export async function checkRateLimit(identifier: string, type = 'api') {
  if (useRedis) {
    return checkRateLimitRedis(identifier, type);
  }
  return checkRateLimitInMemory(identifier, type); // current implementation
}
```

---

### 2. Cache de Queries Frequentes

Usar Upstash Redis como cache layer para queries que raramente mudam:

#### Queries candidatas a cache:
| Query | TTL | Invalidação |
|-------|-----|-------------|
| Tenant config (slug → id, branding) | 5 min | Ao editar configurações |
| Lista de planos/preços | 15 min | Ao mudar no Stripe |
| Slots de disponibilidade | 2 min | Ao agendar/cancelar |
| Contagem de pacientes (para limites) | 1 min | Ao criar/remover paciente |

#### Helper:
```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) return fetcher();

  const hit = await redis.get<T>(key);
  if (hit !== null) return hit;

  const data = await fetcher();
  await redis.set(key, data, { ex: ttlSeconds });
  return data;
}

export async function invalidateCache(pattern: string) {
  if (!redis) return;
  // Upstash suporta SCAN + DEL
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}
```

#### Uso:
```typescript
const tenant = await cached(
  `tenant:${slug}`,
  300, // 5 min
  () => db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })
);
```

---

### 3. Paginação de API

Implementar cursor-based pagination para listagens grandes:

#### Helper:
```typescript
// src/lib/pagination.ts
export function parsePagination(searchParams: URLSearchParams) {
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
  const cursor = searchParams.get('cursor') || undefined;
  return { limit, cursor };
}

export function paginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number
) {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

  return {
    data,
    pagination: {
      hasMore,
      nextCursor,
    },
  };
}
```

#### Rotas a paginar:
- `GET /api/admin/patients` → lista de pacientes
- `GET /api/admin/appointments` → lista de agendamentos
- `GET /api/admin/sessions` → histórico de sessões
- `GET /api/portal/appointments` → agendamentos do paciente

#### Pattern nas queries:
```typescript
const { limit, cursor } = parsePagination(searchParams);

const items = await db.query.patients.findMany({
  where: and(
    eq(patients.tenantId, tenantId),
    cursor ? gt(patients.id, cursor) : undefined,
  ),
  limit: limit + 1, // +1 para detectar hasMore
  orderBy: asc(patients.id),
});

return NextResponse.json(paginatedResponse(items, limit));
```

---

### 4. Connection Pooling (Neon)

O Neon já fornece pooling via PgBouncer. Verificar:

```env
# Usar a connection string com pooling (porta 5432 → 6543)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech:6543/mentevive?sslmode=require
```

Se `DATABASE_URL` já usa porta 6543 → pooling ativo. Se usa 5432 → trocar.

Adicionar em `src/lib/db.ts` (se não existir):
```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

---

### 5. Edge Caching Headers

Para pages/routes que podem ser cached:

```typescript
// Rotas estáticas (landing, blog)
export const revalidate = 3600; // ISR 1 hora

// API: adicionar Cache-Control para GETs públicos
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  },
});
```

---

## Prioridade de Implementação

1. **Redis rate limiter** (P0 — segurança, fácil)
2. **Paginação** (P1 — performance, previne N+1 em listas crescentes)
3. **Cache de tenant config** (P1 — reduz queries repetitivas)
4. **Connection pooling verification** (P2 — possivelmente já ativo)
5. **Edge caching** (P3 — otimização fina)

---

## Smoke Tests

1. Rate limit login → 6ª tentativa retorna 429 (persiste após cold start)
2. `X-RateLimit-Remaining` header decrementa corretamente
3. Sem `UPSTASH_REDIS_REST_URL` → fallback in-memory sem crash
4. Cache hit → tenant query não vai ao DB (verificar via log/timing)
5. Cache invalidation → após editar configurações, próxima query retorna dados novos
6. Paginação → `?limit=5` retorna 5 items + `nextCursor`
7. `?cursor=xxx&limit=5` retorna próximos 5 items
8. Limite máximo → `?limit=999` retorna no máximo 100
