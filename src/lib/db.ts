import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your .env.local file."
    );
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
