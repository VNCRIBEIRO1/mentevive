import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(path: string) {
  if (!fs.existsSync(path)) return;
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nao configurado.");
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql.query("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'stripe'");
  await sql.query(
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id varchar(255)"
  );
  await sql.query(
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id varchar(255)"
  );
  await sql.query(
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_status varchar(50)"
  );

  const columns = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'payments'
      and column_name in ('stripe_payment_intent_id', 'stripe_session_id', 'stripe_status')
    order by column_name
  `;

  const enumValues = await sql.query(
    "select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'payment_method' order by enumsortorder"
  );

  console.log(
    JSON.stringify({
      ok: true,
      columns: columns.map((row) => row.column_name),
      paymentMethodValues: enumValues.map((row) => row.enumlabel),
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    })
  );
  process.exit(1);
});
