import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

function normalizeDatabaseUrl(raw: string | undefined): string {
  if (!raw) return "";
  // Handle common env formatting issues (quoted strings or escaped newlines from env pull/copy).
  const cleaned = raw
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .replace(/\\r\\n/g, "")
    .replace(/\\n/g, "")
    .replace(/\\r/g, "")
    .trim();

  try {
    const u = new URL(cleaned);
    // `channel_binding` appears in some libpq strings and can break neon() URL parsing in some runtimes.
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return cleaned;
  }
}

function createDb() {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your .env.local file."
    );
  }
  try {
    // Validate URL early so runtime failures become actionable.
    new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL. Check quoting/escaping in environment variables.");
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

type DbInstance = ReturnType<typeof createDb>;

// Lazy singleton — only connects when first accessed at runtime, not at build time
let _db: DbInstance | null = null;

function getDb(): DbInstance {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
