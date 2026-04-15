// scripts/run-migration.mjs — Execute SQL migration file against Neon DB
import { readFileSync } from "fs";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL not set");
  process.exit(1);
}

const sqlFile = process.argv[2] || "scripts/migrate-multi-tenant.sql";
const sql = readFileSync(sqlFile, "utf-8");

const client = new pg.Client(dbUrl);

try {
  await client.connect();
  console.log("Connected to database");
  await client.query(sql);
  console.log(`Migration OK — ${sqlFile}`);
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
