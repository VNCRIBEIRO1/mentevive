// scripts/backfill-tenant.js — Create tenant #1 (psicolobia), memberships, and backfill tenantId
const { neon } = require("@neondatabase/serverless");

const TENANT_SLUG = "psicolobia";
const TENANT_NAME = "Consultório Psicolobia";
const ADMIN_EMAIL = "admin@psicolobia.com.br";
const LANDING_DOMAIN = "mentevive-psicolobia.vercel.app";

async function run(sql, label, query, params) {
  try {
    const result = await sql.query(query, params);
    console.log(`[OK] ${label}`, result.length > 0 ? JSON.stringify(result[0]) : "(no rows)");
    return result;
  } catch (e) {
    console.error(`[FAIL] ${label}:`, e.message);
    throw e;
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  // 1. Get admin user
  const admins = await run(sql, "Get admin", "SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
  if (!admins[0]) throw new Error("Admin not found");
  const adminId = admins[0].id;

  // 2. Create tenant
  const tenants = await run(sql, "Create tenant",
    `INSERT INTO tenants (slug, name, owner_user_id, landing_domain, active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [TENANT_SLUG, TENANT_NAME, adminId, LANDING_DOMAIN]
  );
  const tenantId = tenants[0].id;

  // 3. Create admin membership
  await run(sql, "Admin membership",
    `INSERT INTO tenant_memberships (user_id, tenant_id, role, active)
     VALUES ($1, $2, 'admin', true)
     ON CONFLICT (user_id, tenant_id) DO NOTHING`,
    [adminId, tenantId]
  );

  // 4. Create patient memberships
  const patients = await run(sql, "Get patients", "SELECT id FROM users WHERE role = 'patient'");
  for (const p of patients) {
    await run(sql, `Membership ${p.id.slice(0,8)}`,
      `INSERT INTO tenant_memberships (user_id, tenant_id, role, active)
       VALUES ($1, $2, 'patient', true)
       ON CONFLICT (user_id, tenant_id) DO NOTHING`,
      [p.id, tenantId]
    );
  }

  // 5. Backfill tenantId on all data tables
  const tables = [
    "patients", "appointments", "availability", "clinical_records",
    "payments", "documents", "blog_posts", "groups", "group_members",
    "triages", "blocked_dates", "settings", "notifications"
  ];
  for (const table of tables) {
    await run(sql, `Backfill ${table}`, `UPDATE ${table} SET tenant_id = $1 WHERE tenant_id IS NULL`, [tenantId]);
  }

  // 6. Set Bia as superadmin
  await run(sql, "Set superadmin",
    "UPDATE users SET platform_role = 'superadmin', is_super_admin = true WHERE email = $1",
    [ADMIN_EMAIL]
  );

  // 7. Set others as 'user'
  await run(sql, "Set user roles",
    "UPDATE users SET platform_role = 'user' WHERE email != $1 AND (platform_role IS NULL OR platform_role != 'user')",
    [ADMIN_EMAIL]
  );

  // 8. Verify
  const v = await run(sql, "Verify counts",
    "SELECT (SELECT count(*) FROM tenants) as tenants, (SELECT count(*) FROM tenant_memberships) as memberships"
  );
  for (const table of tables) {
    const n = await run(sql, `Null check ${table}`, `SELECT count(*) as cnt FROM ${table} WHERE tenant_id IS NULL`);
    if (parseInt(n[0].cnt) > 0) console.warn(`WARNING: ${table} still has ${n[0].cnt} NULL tenant_id rows`);
  }

  console.log("Backfill complete!");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
