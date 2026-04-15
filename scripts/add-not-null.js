// scripts/add-not-null.js — Step 3: Add NOT NULL constraints to tenant_id on all data tables
const { neon } = require("@neondatabase/serverless");

const tables = [
  "patients", "appointments", "availability", "clinical_records",
  "payments", "documents", "blog_posts", "groups", "group_members",
  "triages", "blocked_dates", "settings", "notifications"
];

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  // Verify no NULLs remain before adding constraints
  for (const table of tables) {
    const result = await sql.query(`SELECT count(*) as cnt FROM ${table} WHERE tenant_id IS NULL`);
    if (parseInt(result[0].cnt) > 0) {
      throw new Error(`Cannot add NOT NULL: ${table} has ${result[0].cnt} rows with NULL tenant_id`);
    }
  }
  console.log("Pre-check passed: no NULL tenant_id in any table");

  // Add NOT NULL constraints
  for (const table of tables) {
    try {
      await sql.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET NOT NULL`);
      console.log(`[OK] ${table} — tenant_id SET NOT NULL`);
    } catch (e) {
      if (e.message.includes("already")) {
        console.log(`[SKIP] ${table} — already NOT NULL`);
      } else {
        throw e;
      }
    }
  }

  console.log("All NOT NULL constraints added!");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
