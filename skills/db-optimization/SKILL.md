# DB Optimization Skill — MenteVive Multi-Tenant SaaS

## Scope
Optimizations for PostgreSQL (Neon) + Drizzle ORM layer in a multi-tenant Next.js SaaS.

---

## 1. Connection Management

### Current State
- Uses `@neondatabase/serverless` HTTP driver (`neon()`) → stateless, one HTTP request per query
- Lazy singleton via JS `Proxy` — avoids build-time connection but re-creates per cold start
- **No `-pooler` suffix detected** in DATABASE_URL → possibly hitting direct connection limits

### Recommended Actions

#### 1.1 Enable Neon Connection Pooling
Use the `-pooler` suffix in `DATABASE_URL` for all serverless/API routes:

```
# Direct (for migrations only)
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db

# Pooled (for application — add -pooler to endpoint ID)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/db
```

**Why**: Neon's PgBouncer allows up to 10,000 client connections with transaction-mode pooling.
On Vercel serverless, each function invocation may create a new connection — without pooling, you'll eventually hit `max_connections` (104 on 0.25 CU).

#### 1.2 Use Direct Connection for Migrations
In `drizzle.config.ts`, always use the direct (non-pooler) connection string:
```ts
export default {
  // ...
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL,
  },
};
```

**Why**: PgBouncer transaction mode doesn't support `SET` statements used during migrations.

---

## 2. Missing Indexes

### Current Indexes (Audit)
Every tenant-scoped table has `idx_{table}_tenant` on `tenantId` — good for basic filtering.
Unique composite indexes exist on natural keys.

### Missing Indexes to Add

#### 2.1 Appointments — Date Range Queries
Most appointment queries filter by `date` + `tenantId` (agenda view, dashboard stats).

```sql
-- High impact: agenda page, dashboard, availability
CREATE INDEX idx_appointments_tenant_date ON appointments (tenant_id, date);

-- Patient appointment history
CREATE INDEX idx_appointments_tenant_patient ON appointments (tenant_id, patient_id);

-- Status filtering (e.g., "pending" appointments count)
CREATE INDEX idx_appointments_tenant_status ON appointments (tenant_id, status);
```

**Drizzle schema change:**
```ts
export const appointments = pgTable("appointments", {
  // ... columns
}, (table) => [
  index("idx_appointments_tenant").on(table.tenantId),
  index("idx_appointments_tenant_date").on(table.tenantId, table.date),
  index("idx_appointments_tenant_patient").on(table.tenantId, table.patientId),
  index("idx_appointments_tenant_status").on(table.tenantId, table.status),
]);
```

#### 2.2 Notifications — Read/Unread Queries
Notification bell queries: "unread notifications for user X in tenant Y".

```sql
CREATE INDEX idx_notifications_tenant_user_read ON notifications (tenant_id, user_id, read);
```

#### 2.3 Payments — Status + Date Range
Financial reports filter by status and date range.

```sql
CREATE INDEX idx_payments_tenant_status ON payments (tenant_id, status);
CREATE INDEX idx_payments_tenant_date ON payments (tenant_id, date);
```

#### 2.4 Blog Posts — Status Filtering
Public blog listing filters by published status.

```sql
CREATE INDEX idx_blog_posts_tenant_status ON blog_posts (tenant_id, status);
```

#### 2.5 Clinical Records — Patient Lookup
Therapists frequently view all records for a specific patient.

```sql
CREATE INDEX idx_clinical_records_tenant_patient ON clinical_records (tenant_id, patient_id);
```

#### 2.6 Triages — Status + Date
Triage queue filtering.

```sql
CREATE INDEX idx_triages_tenant_status ON triages (tenant_id, status);
```

### Migration Template
```ts
// drizzle/XXXX_add_performance_indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_date 
  ON appointments (tenant_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_patient 
  ON appointments (tenant_id, patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_tenant_status 
  ON appointments (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_tenant_user_read 
  ON notifications (tenant_id, user_id, read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_status 
  ON payments (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_date 
  ON payments (tenant_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_tenant_status 
  ON blog_posts (tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinical_records_tenant_patient 
  ON clinical_records (tenant_id, patient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_triages_tenant_status 
  ON triages (tenant_id, status);
```

**Important**: Use `CONCURRENTLY` to avoid table locks in production.

---

## 3. Query Optimization Patterns

### 3.1 Avoid N+1 Queries
**Anti-pattern** (loading patients then their appointments separately):
```ts
const patients = await tdb.select(patients).all();
for (const p of patients) {
  const appts = await db.select().from(appointments)
    .where(and(eq(appointments.tenantId, tenantId), eq(appointments.patientId, p.id)));
}
```

**Correct pattern** — use JOINs or Drizzle relational queries:
```ts
const result = await db.query.patients.findMany({
  where: eq(patients.tenantId, tenantId),
  with: {
    appointments: {
      where: eq(appointments.status, "pending"),
      orderBy: [desc(appointments.date)],
      limit: 5,
    },
  },
});
```

### 3.2 Paginate All List Queries
Always use `.limit()` + `.offset()` for list endpoints:
```ts
const PAGE_SIZE = 20;
const rows = await db.select()
  .from(patients)
  .where(eq(patients.tenantId, tenantId))
  .orderBy(asc(patients.name))
  .limit(PAGE_SIZE)
  .offset(page * PAGE_SIZE);
```

### 3.3 Select Only Needed Columns
Instead of `select()` (all columns), specify what you need:
```ts
// ❌ Fetches password hash, avatar blob, etc.
const [user] = await db.select().from(users).where(eq(users.email, email));

// ✅ Only needed fields
const [user] = await db.select({
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
}).from(users).where(eq(users.email, email));
```

---

## 4. Tenant Isolation Safety

### 4.1 Current Strengths ✅
- Composite foreign keys `(tenantId, id)` prevent cross-tenant references at DB level
- `tenantScope()` helper auto-injects `tenantId` for basic CRUD
- Every table with tenant data has `tenantId` column

### 4.2 Risks to Monitor ⚠️

#### `.raw` Accessor
`tenantScope().raw` gives full `db` access without tenant filtering.
**Rule**: Any use of `.raw` MUST include manual `where(eq(table.tenantId, tenantId))`.

#### Complex Queries Bypassing tenantScope
Queries using `db.query` relational API or `db.select().from()...innerJoin()` bypass `tenantScope`.
**Rule**: audit all `db.` direct usages in API routes for tenant filtering.

#### Row-Level Security (Advanced)
For maximum isolation, consider Postgres RLS:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON patients
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```
**Trade-off**: Requires setting session variable per request, incompatible with PgBouncer transaction mode unless using `SET LOCAL`.

---

## 5. Monitoring & Diagnostics

### 5.1 Slow Query Detection
On Neon dashboard → Monitoring → enable slow query logging:
```sql
ALTER DATABASE neondb SET log_min_duration_statement = '200'; -- log queries > 200ms
```

### 5.2 Connection Usage
```sql
SELECT usename, count(*) FROM pg_stat_activity WHERE datname = 'neondb' GROUP BY usename;
```

### 5.3 Index Usage Stats
```sql
SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC; -- Low scan = potentially unused index
```

---

## 6. Checklist

- [ ] Switch DATABASE_URL to `-pooler` endpoint for application
- [ ] Add DATABASE_URL_DIRECT for migrations
- [ ] Add composite indexes (appointments date, patient, status)
- [ ] Add notification read/unread index
- [ ] Add payment status/date indexes
- [ ] Add blog post status index
- [ ] Add clinical records patient index
- [ ] Audit all `db.` usages for tenant filter
- [ ] Add pagination to all list endpoints
- [ ] Use column selection instead of `select()` for sensitive tables
- [ ] Set up slow query logging on Neon
