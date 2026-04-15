// scripts/run-migration.js — Execute SQL migration file against Neon DB
const { readFileSync } = require("fs");
const { neon } = require("@neondatabase/serverless");

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not set");
    process.exit(1);
  }

  const sqlFile = process.argv[2] || "scripts/migrate-multi-tenant.sql";
  const rawSql = readFileSync(sqlFile, "utf-8");

  const sql = neon(dbUrl);

  // Split on semicolons but keep DO $$ blocks intact
  const statements = [];
  let current = "";
  let inBlock = false;

  for (const line of rawSql.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") || trimmed === "") {
      continue;
    }
    current += line + "\n";
    if (trimmed.startsWith("DO $$") || trimmed === "DO $$ BEGIN") {
      inBlock = true;
    }
    if (inBlock && trimmed.endsWith("$$;")) {
      inBlock = false;
      statements.push(current.trim());
      current = "";
    } else if (!inBlock && trimmed.endsWith(";")) {
      statements.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());

  console.log(`Executing ${statements.length} statements from ${sqlFile}...`);

  let success = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt === ";") continue;
    try {
      await sql.query(stmt);
      success++;
    } catch (e) {
      console.error(`Statement ${i + 1} failed:`, e.message);
      console.error(`SQL: ${stmt.substring(0, 120)}...`);
      process.exit(1);
    }
  }

  console.log(`Migration OK — ${success}/${statements.length} statements executed`);
}

main();
