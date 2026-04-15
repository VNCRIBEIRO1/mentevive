# Schema Changes — Strategy C (Option B: Global Users)

## Key Principle: Users are Global

In Strategy C / Option B, the `users` table has **NO** `tenantId`. Users are global identities (one account per email). The `tenant_memberships` table links users to tenants with a role.

## New Table: `tenants`

```typescript
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 63 }).unique().notNull(),    // "psicolobia"
  name: varchar("name", { length: 255 }).notNull(),            // "Consultório Psicolobia"
  ownerUserId: uuid("owner_user_id").references(() => users.id), // platform user who owns this tenant

  // Branding (for admin/portal header, not landing — landing is separate site)
  logo: text("logo"),                    // URL to logo image
  primaryColor: varchar("primary_color", { length: 7 }).default("#6B21A8"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#A855F7"),
  displayName: text("display_name"),     // "Psicóloga Bia" — shown in portal
  whatsappLink: text("whatsapp_link"),

  // Landing site info (for reference — the landing is a separate Vercel project)
  landingDomain: varchar("landing_domain", { length: 255 }),   // "psicolobia.com.br"
  landingRepoUrl: text("landing_repo_url"),                     // GitHub repo of landing

  // Stripe Connect
  stripeAccountId: varchar("stripe_account_id", { length: 255 }), // acct_xxx
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),

  // Plan & limits
  plan: varchar("plan", { length: 50 }).default("starter").notNull(),
  maxPatients: integer("max_patients").default(50),
  maxTherapists: integer("max_therapists").default(1),

  // Status
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## New Table: `tenant_memberships`

Links global users to tenants with a role. A user can have memberships in multiple tenants.

```typescript
export const tenantMemberships = pgTable("tenant_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 50 }).notNull(),  // "admin" | "therapist" | "patient"
  active: boolean("active").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMembership: uniqueIndex("tenant_membership_unique")
    .on(table.userId, table.tenantId),
}));
```

**Examples:**
| userId | tenantId | role |
|--------|----------|------|
| user-bia | tenant-psicolobia | admin |
| user-joao | tenant-psicolobia | patient |
| user-joao | tenant-drana | patient |
| user-ana | tenant-drana | admin |

## Changes to `users` Table

**NO `tenantId` added.** The `users` table stays global.

Changes needed:
- Remove the existing `role` column (role is now per-membership, not per-user)
  - OR keep `role` as a "platform-level" role (only `superadmin` vs `user`)
- `email` stays **globally unique** (one account per email)
- Add `isSuperAdmin: boolean("is_super_admin").default(false)` — platform-level flag

```typescript
// Updated users table (minimal changes)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),  // STAYS globally unique
  name: varchar("name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).default("user").notNull(), // "superadmin" | "user"
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

> **Migration note:** Existing `role` values (`admin`, `therapist`, `patient`) will be migrated to `tenant_memberships.role`. The `users.role` field becomes either `superadmin` or `user`.

## Add `tenantId` to Data Tables (13 tables)

Pattern for each table — add this column:

```typescript
tenantId: uuid("tenant_id")
  .references(() => tenants.id, { onDelete: "cascade" })
  .notNull(),
```

**Tables getting `tenantId`:** patients, appointments, availability, clinicalRecords, payments, documents, blogPosts, groups, groupMembers, triages, blockedDates, settings, notifications.

**Tables WITHOUT `tenantId`:** users, passwordResetTokens, tenant_memberships (has its own tenantId FK already).

### Unique Constraint Changes

| Table | Current Unique | New Composite Unique |
|-------|----------------|---------------------|
| `users.email` | globally unique | **STAYS globally unique** (Option B: global users) |
| `blogPosts.slug` | globally unique | `(tenantId, slug)` unique |
| `blockedDates.date` | globally unique | `(tenantId, date)` unique |
| `settings.key` | globally unique | `(tenantId, key)` unique |
| `patients.userId` | globally unique | `(tenantId, userId)` unique — same user can be patient in multiple tenants |

### Implementation with Drizzle Composite Unique

```typescript
import { uniqueIndex } from "drizzle-orm/pg-core";

// patients: same user can be patient in multiple tenants
export const patientsUniqueTenantUser = uniqueIndex("patients_tenant_user_unique")
  .on(patients.tenantId, patients.userId);

export const blogPostsUniqueSlug = uniqueIndex("blog_posts_tenant_slug_unique")
  .on(blogPosts.tenantId, blogPosts.slug);

export const blockedDatesUniqueDate = uniqueIndex("blocked_dates_tenant_date_unique")
  .on(blockedDates.tenantId, blockedDates.date);

export const settingsUniqueKey = uniqueIndex("settings_tenant_key_unique")
  .on(settings.tenantId, settings.key);
```

## New Relations

```typescript
export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  owner: one(users, { fields: [tenants.ownerUserId], references: [users.id] }),
  memberships: many(tenantMemberships),
  patients: many(patients),
  appointments: many(appointments),
  availability: many(availability),
  payments: many(payments),
  blogPosts: many(blogPosts),
  settings: many(settings),
  notifications: many(notifications),
}));

export const tenantMembershipsRelations = relations(tenantMemberships, ({ one }) => ({
  user: one(users, { fields: [tenantMemberships.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [tenantMemberships.tenantId], references: [tenants.id] }),
}));

// Add to existing usersRelations:
// memberships: many(tenantMemberships),

// Add to every data table that has tenantId:
// tenant: one(tenants, { fields: [tableName.tenantId], references: [tenants.id] }),
```

## Migration Strategy (Zero Downtime)

### Step 1: Create new tables + add nullable `tenantId`
```sql
-- New tables
CREATE TABLE tenants (...);
CREATE TABLE tenant_memberships (...);

-- Add nullable tenantId to data tables
ALTER TABLE patients ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE availability ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE clinical_records ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE blog_posts ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE groups ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE group_members ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE triages ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE blocked_dates ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add isSuperAdmin to users
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
```

### Step 2: Backfill existing data (run migrate-existing-data.ts)
```sql
-- Create tenant #1 for Bia
INSERT INTO tenants (id, slug, name, owner_user_id, landing_domain, active)
VALUES ('FIXED-UUID', 'psicolobia', 'Consultório Psicolobia', 'BIA-USER-ID', 'psicolobia.com.br', true);

-- Create membership for Bia (admin)
INSERT INTO tenant_memberships (user_id, tenant_id, role)
VALUES ('BIA-USER-ID', 'FIXED-UUID', 'admin');

-- Create memberships for all existing patients
INSERT INTO tenant_memberships (user_id, tenant_id, role)
SELECT u.id, 'FIXED-UUID', 'patient'
FROM users u WHERE u.role = 'patient';

-- Backfill tenantId on all data tables
UPDATE patients SET tenant_id = 'FIXED-UUID' WHERE tenant_id IS NULL;
UPDATE appointments SET tenant_id = 'FIXED-UUID' WHERE tenant_id IS NULL;
-- ... repeat for all 13 tables

-- Migrate users.role to memberships (admin/therapist → already created above for Bia)
-- Set all users.role to 'user' (platform-level)
UPDATE users SET role = 'user';
-- Set platform owner as superadmin
UPDATE users SET role = 'superadmin', is_super_admin = true WHERE id = 'YOUR-USER-ID';
```

### Step 3: Add NOT NULL + composite uniques
```sql
ALTER TABLE patients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN tenant_id SET NOT NULL;
-- ... repeat for all 13 tables

-- Replace global uniques with composite
DROP INDEX IF EXISTS blog_posts_slug_unique;
CREATE UNIQUE INDEX blog_posts_tenant_slug_unique ON blog_posts(tenant_id, slug);

DROP INDEX IF EXISTS blocked_dates_date_unique;
CREATE UNIQUE INDEX blocked_dates_tenant_date_unique ON blocked_dates(tenant_id, date);

DROP INDEX IF EXISTS settings_key_unique;
CREATE UNIQUE INDEX settings_tenant_key_unique ON settings(tenant_id, key);

-- patients: allow same user in multiple tenants
DROP INDEX IF EXISTS patients_user_id_unique;
CREATE UNIQUE INDEX patients_tenant_user_unique ON patients(tenant_id, user_id);
```

### Step 4: Add performance indexes
```sql
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_availability_tenant ON availability(tenant_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_clinical_records_tenant ON clinical_records(tenant_id);
CREATE INDEX idx_blog_posts_tenant ON blog_posts(tenant_id);
CREATE INDEX idx_settings_tenant ON settings(tenant_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_tenant_memberships_user ON tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant ON tenant_memberships(tenant_id);
```
```sql
-- Create tenant for current therapist
INSERT INTO tenants (id, slug, name, owner_email) 
VALUES ('fixed-uuid', 'bia', 'Consultório Bia', 'bia@email.com');

-- Backfill all tables
UPDATE users SET tenant_id = 'fixed-uuid' WHERE tenant_id IS NULL;
UPDATE patients SET tenant_id = 'fixed-uuid' WHERE tenant_id IS NULL;
-- ... repeat for all tables
```

### Step 3: Add NOT NULL constraint
```sql
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE patients ALTER COLUMN tenant_id SET NOT NULL;
-- ... repeat for all tables
```

### Step 4: Replace global unique indexes with composite
```sql
ALTER TABLE users DROP CONSTRAINT users_email_unique;
CREATE UNIQUE INDEX users_tenant_email_unique ON users(tenant_id, email);

ALTER TABLE blog_posts DROP CONSTRAINT blog_posts_slug_unique;
CREATE UNIQUE INDEX blog_posts_tenant_slug_unique ON blog_posts(tenant_id, slug);

ALTER TABLE blocked_dates DROP CONSTRAINT blocked_dates_date_unique;
CREATE UNIQUE INDEX blocked_dates_tenant_date_unique ON blocked_dates(tenant_id, date);

ALTER TABLE settings DROP CONSTRAINT settings_key_unique;
CREATE UNIQUE INDEX settings_tenant_key_unique ON settings(tenant_id, key);
```

### Step 5: Add performance indexes
```sql
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_availability_tenant ON availability(tenant_id);
CREATE INDEX idx_clinical_records_tenant ON clinical_records(tenant_id);
CREATE INDEX idx_blog_posts_tenant ON blog_posts(tenant_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_settings_tenant ON settings(tenant_id);
```

## Decision: Patient Identity Across Tenants

**Option A: Patient is tenant-scoped** (recommended for MVP)
- Same person seeing two therapists = two separate patient records
- Simpler, no cross-tenant queries
- `patients.userId` unique per tenant, not globally

**Option B: Shared patient identity**
- Separate `accounts` table linking users to tenants
- Patient has one global profile but per-tenant clinical data
- More complex, better for clinic networks

**Recommendation:** Option A for MVP. Option B as future upgrade.
