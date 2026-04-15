// scripts/verify-migration.js
const { neon } = require("@neondatabase/serverless");

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  // List tables
  const tables = await sql.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log("Tables:", tables.map(t => t.table_name).join(", "));

  // Check tenant_id exists on patients
  const cols = await sql.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='patients' AND column_name='tenant_id'"
  );
  console.log("patients.tenant_id:", cols.length > 0 ? "EXISTS" : "MISSING");

  // Check new enums
  const enums = await sql.query(
    "SELECT typname FROM pg_type WHERE typname IN ('platform_role','membership_role','tenant_plan') ORDER BY typname"
  );
  console.log("New enums:", enums.map(e => e.typname).join(", "));

  // Check users new columns
  const userCols = await sql.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('platform_role','is_super_admin') ORDER BY column_name"
  );
  console.log("users new cols:", userCols.map(c => c.column_name).join(", "));

  // Count existing data
  const rowCounts = await sql.query(
    "SELECT (SELECT count(*) FROM users) as users, (SELECT count(*) FROM patients) as patients, (SELECT count(*) FROM appointments) as appointments"
  );
  console.log("Data counts:", JSON.stringify(rowCounts[0]));
}

main().catch(e => { console.error(e.message); process.exit(1); });
