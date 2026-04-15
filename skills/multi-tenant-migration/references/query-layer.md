# Query Layer — Tenant-Scoped Drizzle Helpers

## Problem

47 API routes × multiple queries each = 100+ places where `tenantId` must be enforced.
Forgetting ONE filter = cross-tenant data leak.

## Solution: Tenant-Scoped Helper Functions

Create `src/lib/tenant-db.ts` with wrapper functions that always inject `tenantId`.

## Implementation

```typescript
// src/lib/tenant-db.ts
import { db } from "@/lib/db";
import { eq, and, SQL } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

/**
 * Create tenant-scoped query helpers.
 * Usage in API routes:
 *   const auth = await requireAdmin();
 *   const tdb = tenantScope(auth.tenantId);
 *   const rows = await tdb.select(patients).where(eq(patients.active, true));
 */
export function tenantScope(tenantId: string) {
  if (!tenantId) throw new Error("tenantId is required for scoped queries");

  return {
    /** SELECT with automatic tenantId filter */
    select<T extends PgTable & { tenantId: any }>(table: T) {
      return {
        where(condition?: SQL) {
          const tenantFilter = eq(table.tenantId, tenantId);
          const finalWhere = condition ? and(tenantFilter, condition) : tenantFilter;
          return db.select().from(table).where(finalWhere);
        },
        all() {
          return db.select().from(table).where(eq(table.tenantId, tenantId));
        },
      };
    },

    /** INSERT with automatic tenantId injection */
    async insert<T extends PgTable & { tenantId: any }>(
      table: T,
      values: Omit<typeof table.$inferInsert, "tenantId">
    ) {
      return db.insert(table).values({ ...values, tenantId } as any).returning();
    },

    /** UPDATE with automatic tenantId filter */
    update<T extends PgTable & { tenantId: any }>(table: T) {
      return {
        set(values: Partial<typeof table.$inferInsert>) {
          return {
            where(condition: SQL) {
              return db
                .update(table)
                .set(values as any)
                .where(and(eq(table.tenantId, tenantId), condition));
            },
          };
        },
      };
    },

    /** DELETE with automatic tenantId filter */
    delete<T extends PgTable & { tenantId: any }>(table: T) {
      return {
        where(condition: SQL) {
          return db
            .delete(table)
            .where(and(eq(table.tenantId, tenantId), condition));
        },
      };
    },

    /** Raw DB access for complex queries (JOIN, aggregates) — MUST add tenantId manually */
    get raw() {
      return db;
    },

    /** The tenant ID for this scope */
    get id() {
      return tenantId;
    },
  };
}
```

## Usage Pattern in API Routes

### Before (single-tenant)

```typescript
// GET /api/patients
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.response;

  const allPatients = await db
    .select()
    .from(patients)
    .where(eq(patients.active, true))
    .orderBy(patients.name);

  return NextResponse.json(allPatients);
}
```

### After (multi-tenant)

```typescript
// GET /api/patients
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.response;

  const tdb = tenantScope(auth.tenantId);

  const allPatients = await tdb
    .select(patients)
    .where(eq(patients.active, true));
  // tenantId filter is auto-applied!

  return NextResponse.json(allPatients);
}
```

### INSERT Example

```typescript
// Before
await db.insert(patients).values({ name, email, phone });

// After
await tdb.insert(patients, { name, email, phone });
// tenantId is auto-injected!
```

### Complex Query (JOIN)

```typescript
// For JOINs, use raw DB but add tenantId explicitly
const results = await tdb.raw
  .select({
    payment: payments,
    patient: patients,
  })
  .from(payments)
  .leftJoin(patients, eq(payments.patientId, patients.id))
  .where(
    and(
      eq(payments.tenantId, tdb.id),  // MUST include manually for raw queries
      eq(payments.status, "pending")
    )
  );
```

## Public Routes (No Auth — Strategy C)

For public routes (availability, settings, blog), get tenantId from `?tenant=SLUG` query parameter (since there's no subdomain in Strategy C):

```typescript
// src/lib/tenant.ts
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { tenantScope } from "@/lib/tenant-db";

/** Resolve tenant from ?tenant=SLUG for public API routes */
export async function getPublicTenantScope(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("tenant");
  if (!slug) throw new Error("?tenant= parameter is required");

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, slug), eq(tenants.active, true)))
    .limit(1);

  if (!tenant) throw new Error("Consultório não encontrado");
  return tenantScope(tenant.id);
}
```

```typescript
// GET /api/portal/availability?tenant=psicolobia (public)
export async function GET(req: Request) {
  const tdb = await getPublicTenantScope(req);
  const slots = await tdb.select(availability).where(eq(availability.active, true));
  return NextResponse.json(slots);
}
```

## Webhook & Cron Routes

### Stripe Webhook (no session, no subdomain)

```typescript
// Resolve tenant from the payment record
const [payment] = await db
  .select({ tenantId: payments.tenantId })
  .from(payments)
  .where(eq(payments.stripeSessionId, sessionId))
  .limit(1);

const tdb = tenantScope(payment.tenantId);
// Now use tdb for all subsequent updates
```

### Cron Job (all tenants)

```typescript
// GET /api/cron/overdue-payments
const allTenants = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.active, true));

for (const tenant of allTenants) {
  const tdb = tenantScope(tenant.id);
  // Process overdue payments for this tenant
  await tdb.update(payments).set({ status: "overdue" }).where(
    and(eq(payments.status, "pending"), lt(payments.dueDate, today))
  );
}
```

## Notifications

```typescript
// Before
await createNotification({ type: "appointment", title: "...", message: "..." });

// After — add tenantId parameter
await createNotification({ type: "appointment", title: "...", message: "...", tenantId });
```

## Migration Checklist for Each API Route

For every route file, follow this pattern:

1. Replace `requireAdmin()` → extract `tenantId`
2. Create `const tdb = tenantScope(tenantId)`
3. Replace `db.select().from(X)` → `tdb.select(X).all()` or `tdb.select(X).where(...)`
4. Replace `db.insert(X).values(...)` → `tdb.insert(X, ...)`
5. Replace `db.update(X)...where(...)` → `tdb.update(X).set(...).where(...)`
6. Replace `db.delete(X).where(...)` → `tdb.delete(X).where(...)`
7. For JOINs: use `tdb.raw` but add `eq(X.tenantId, tdb.id)` to WHERE
8. Test: verify no queries access DB without tenant filter
