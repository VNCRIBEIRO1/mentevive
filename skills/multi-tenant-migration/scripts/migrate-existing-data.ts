/**
 * Data Migration Script — Strategy C + Option B
 *
 * This script:
 * 1. Creates the first tenant (Bia's practice)
 * 2. Creates tenant_memberships for existing users (from their roles)
 * 3. Backfills tenantId on all DATA tables (NOT users — users is global)
 * 4. Migrates users.role to platform-level values (superadmin | user)
 * 5. Verifies data integrity after migration
 *
 * SAFETY: This script is idempotent — running it twice is safe.
 *
 * Usage: npx tsx skills/multi-tenant-migration/scripts/migrate-existing-data.ts
 *
 * Prerequisites:
 * - The `tenants` table must already exist (via Drizzle migration)
 * - The `tenant_memberships` table must already exist
 * - All data tables must have `tenant_id` column (nullable at this point)
 * - DATABASE_URL must be set
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

const TENANT_SLUG = process.env.TENANT_SLUG || "psicolobia";
const TENANT_NAME = process.env.TENANT_NAME || "Psicolobia - Psicóloga Bia";
const TENANT_EMAIL = process.env.TENANT_EMAIL || process.env.ADMIN_EMAIL || "";
const LANDING_DOMAIN = process.env.LANDING_DOMAIN || "psicolobia.com.br";

// Fixed UUID for first tenant — consistent across environments
const TENANT_ID = "00000000-0000-4000-a000-000000000001";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is required");
    process.exit(1);
  }

  if (!TENANT_EMAIL) {
    console.error("❌ TENANT_EMAIL or ADMIN_EMAIL is required");
    process.exit(1);
  }

  const sqlClient = neon(connectionString);
  const db = drizzle(sqlClient);

  console.log("🚀 Starting Strategy C + Option B migration...\n");

  // ============================================================
  // Step 1: Create first tenant (if not exists)
  // ============================================================
  console.log("📦 Step 1: Creating tenant...");
  const existingTenant = await db.execute(
    sql`SELECT id FROM tenants WHERE slug = ${TENANT_SLUG} LIMIT 1`
  );

  let ownerUserId: string | null = null;

  // Find the admin user (owner of this practice)
  const adminUser = await db.execute(
    sql`SELECT id FROM users WHERE email = ${TENANT_EMAIL} LIMIT 1`
  );
  if (adminUser.rows.length > 0) {
    ownerUserId = (adminUser.rows[0] as any).id;
  }

  if (existingTenant.rows.length === 0) {
    await db.execute(sql`
      INSERT INTO tenants (id, slug, name, owner_user_id, landing_domain, active, created_at, updated_at)
      VALUES (
        ${TENANT_ID},
        ${TENANT_SLUG},
        ${TENANT_NAME},
        ${ownerUserId},
        ${LANDING_DOMAIN},
        true,
        NOW(),
        NOW()
      )
    `);
    console.log(`  ✅ Tenant created: ${TENANT_SLUG} (${TENANT_ID})`);
  } else {
    console.log(`  ⏭️  Tenant already exists: ${TENANT_SLUG}`);
  }

  // ============================================================
  // Step 2: Create tenant_memberships from existing user roles
  // ============================================================
  console.log("\n👥 Step 2: Creating tenant_memberships...");

  // Admin users → membership with role 'admin'
  const admins = await db.execute(
    sql`SELECT id, email FROM users WHERE role = 'admin'`
  );
  for (const admin of admins.rows as any[]) {
    const exists = await db.execute(
      sql`SELECT id FROM tenant_memberships WHERE user_id = ${admin.id} AND tenant_id = ${TENANT_ID} LIMIT 1`
    );
    if (exists.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO tenant_memberships (user_id, tenant_id, role, active, created_at)
        VALUES (${admin.id}, ${TENANT_ID}, 'admin', true, NOW())
      `);
      console.log(`  ✅ Admin membership: ${admin.email}`);
    } else {
      console.log(`  ⏭️  Already exists: ${admin.email}`);
    }
  }

  // Patient users → membership with role 'patient'
  const patients = await db.execute(
    sql`SELECT id, email FROM users WHERE role = 'patient'`
  );
  for (const patient of patients.rows as any[]) {
    const exists = await db.execute(
      sql`SELECT id FROM tenant_memberships WHERE user_id = ${patient.id} AND tenant_id = ${TENANT_ID} LIMIT 1`
    );
    if (exists.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO tenant_memberships (user_id, tenant_id, role, active, created_at)
        VALUES (${patient.id}, ${TENANT_ID}, 'patient', true, NOW())
      `);
      console.log(`  ✅ Patient membership: ${patient.email}`);
    } else {
      console.log(`  ⏭️  Already exists: ${patient.email}`);
    }
  }

  const totalMemberships = await db.execute(
    sql`SELECT COUNT(*) as count FROM tenant_memberships WHERE tenant_id = ${TENANT_ID}`
  );
  console.log(`  📊 Total memberships: ${(totalMemberships.rows[0] as any)?.count}`);

  // ============================================================
  // Step 3: Backfill tenantId on DATA tables (NOT users)
  // ============================================================
  const dataTables = [
    // NOTE: users is NOT in this list — it stays global (Option B)
    "patients",
    "appointments",
    "availability",
    "clinical_records",
    "payments",
    "documents",
    "blog_posts",
    "groups",
    "group_members",
    "triages",
    "blocked_dates",
    "settings",
    "notifications",
  ];

  console.log("\n📝 Step 3: Backfilling tenant_id on data tables...");
  console.log("  ⚠️  Note: users table is GLOBAL (no tenant_id) — Option B");
  for (const table of dataTables) {
    try {
      const result = await db.execute(
        sql.raw(`UPDATE ${table} SET tenant_id = '${TENANT_ID}' WHERE tenant_id IS NULL`)
      );
      const count = (result as any).rowCount ?? "?";
      console.log(`  ✅ ${table}: ${count} rows updated`);
    } catch (err: any) {
      if (err.message?.includes("column \"tenant_id\"") && err.message?.includes("does not exist")) {
        console.log(`  ⚠️  ${table}: tenant_id column not found (migration pending)`);
      } else {
        console.error(`  ❌ ${table}: ${err.message}`);
      }
    }
  }

  // ============================================================
  // Step 4: Migrate users.role to platform-level values
  // ============================================================
  console.log("\n🔄 Step 4: Migrating users.role to platform-level...");
  
  // Set platform owner as superadmin
  if (ownerUserId) {
    await db.execute(
      sql`UPDATE users SET role = 'superadmin', is_super_admin = true WHERE id = ${ownerUserId}`
    );
    console.log(`  ✅ Platform owner set to superadmin: ${TENANT_EMAIL}`);
  }

  // All other users → role = 'user' (their per-tenant role is in tenant_memberships)
  await db.execute(
    sql`UPDATE users SET role = 'user' WHERE role IN ('admin', 'patient') AND id != ${ownerUserId || ''}`
  );
  console.log("  ✅ All other users set to role='user'");

  // ============================================================
  // Step 5: Verify data integrity
  // ============================================================
  console.log("\n🔍 Step 5: Verifying data integrity...");
  let allClean = true;
  for (const table of dataTables) {
    try {
      const result = await db.execute(
        sql.raw(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id IS NULL`)
      );
      const nullCount = Number((result.rows[0] as any)?.count ?? 0);
      if (nullCount > 0) {
        console.log(`  ❌ ${table}: ${nullCount} rows still have NULL tenant_id`);
        allClean = false;
      } else {
        console.log(`  ✅ ${table}: all rows have tenant_id`);
      }
    } catch {
      // Column doesn't exist yet
    }
  }

  // Verify all users have memberships
  const orphanUsers = await db.execute(sql`
    SELECT u.id, u.email FROM users u
    LEFT JOIN tenant_memberships tm ON tm.user_id = u.id
    WHERE tm.id IS NULL AND u.is_super_admin IS NOT TRUE
  `);
  if ((orphanUsers.rows as any[]).length > 0) {
    console.log(`  ⚠️  ${orphanUsers.rows.length} users without any membership:`);
    for (const u of orphanUsers.rows as any[]) {
      console.log(`    - ${u.email}`);
    }
  } else {
    console.log("  ✅ All non-superadmin users have at least one membership");
  }

  // ============================================================
  // Step 6: Data summary
  // ============================================================
  console.log("\n📊 Step 6: Data summary...");
  for (const table of dataTables) {
    try {
      const result = await db.execute(
        sql.raw(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = '${TENANT_ID}'`)
      );
      const count = Number((result.rows[0] as any)?.count ?? 0);
      if (count > 0) {
        console.log(`  ${table}: ${count} rows`);
      }
    } catch {
      // Column doesn't exist yet
    }
  }

  if (allClean) {
    console.log("\n✅ Migration complete! Strategy C + Option B applied.");
    console.log(`  Tenant: ${TENANT_SLUG} (${TENANT_ID})`);
    console.log(`  Landing domain: ${LANDING_DOMAIN}`);
    console.log("\n⚠️  Next steps:");
    console.log("  1. Add NOT NULL constraint: ALTER TABLE <table> ALTER COLUMN tenant_id SET NOT NULL");
    console.log("  2. Replace global unique indexes with composite (see schema-changes.md)");
    console.log("  3. Add performance indexes on tenant_id columns");
    console.log("  4. Verify tenant_memberships have correct roles");
    console.log("  5. Deploy central platform to app.MenteVive.com.br");
    console.log("  6. Scaffold + deploy Bia's landing site separately");
  } else {
    console.log("\n⚠️  Some tables still have NULL tenant_id. Re-run after fixing.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
