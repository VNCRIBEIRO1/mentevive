-- ============================================================
-- MenteVive Multi-Tenant Migration — Step 1: Schema Changes
-- Zero-downtime: all new columns are NULLABLE initially.
-- Step 2 (backfill) will populate them, then Step 3 adds NOT NULL.
-- ============================================================

-- 1. New ENUM types
DO $$ BEGIN
  CREATE TYPE "public"."platform_role" AS ENUM('superadmin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."membership_role" AS ENUM('admin', 'therapist', 'patient');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(63) NOT NULL,
  "name" varchar(255) NOT NULL,
  "owner_user_id" uuid REFERENCES "users"("id"),
  "landing_domain" varchar(255),
  "branding" jsonb,
  "stripe_account_id" varchar(255),
  "stripe_onboarding_complete" boolean DEFAULT false NOT NULL,
  "plan" "tenant_plan" DEFAULT 'free' NOT NULL,
  "max_patients" integer DEFAULT 50,
  "max_appointments_per_month" integer DEFAULT 200,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);

-- 3. Create tenant_memberships table
CREATE TABLE IF NOT EXISTS "tenant_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "role" "membership_role" DEFAULT 'patient' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_memberships_user_tenant_unique" ON "tenant_memberships" ("user_id", "tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenant_memberships_user" ON "tenant_memberships" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_tenant_memberships_tenant" ON "tenant_memberships" ("tenant_id");

-- 4. Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "platform_role" "platform_role" DEFAULT 'user' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false NOT NULL;

-- 5. Add tenant_id to all 13 data tables (NULLABLE for now)
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "availability" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "triages" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "blocked_dates" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE;

-- 6. Drop old global unique constraints that become composite
-- patients: userId was UNIQUE, now (tenant_id, user_id) composite
ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_user_id_unique";
DROP INDEX IF EXISTS "patients_user_id_unique";

-- blog_posts: slug was UNIQUE, now (tenant_id, slug) composite
ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_slug_unique";
DROP INDEX IF EXISTS "blog_posts_slug_unique";

-- blocked_dates: date was UNIQUE, now (tenant_id, date) composite
ALTER TABLE "blocked_dates" DROP CONSTRAINT IF EXISTS "blocked_dates_date_unique";
DROP INDEX IF EXISTS "blocked_dates_date_unique";

-- settings: key was UNIQUE, now (tenant_id, key) composite
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_key_unique";
DROP INDEX IF EXISTS "settings_key_unique";

-- 7. Performance indexes on tenant_id
CREATE INDEX IF NOT EXISTS "idx_patients_tenant" ON "patients" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_appointments_tenant" ON "appointments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_availability_tenant" ON "availability" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_clinical_records_tenant" ON "clinical_records" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_payments_tenant" ON "payments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_documents_tenant" ON "documents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_tenant" ON "blog_posts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_groups_tenant" ON "groups" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_group_members_tenant" ON "group_members" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_triages_tenant" ON "triages" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_blocked_dates_tenant" ON "blocked_dates" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_settings_tenant" ON "settings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_tenant" ON "notifications" ("tenant_id");
