// @ts-nocheck
/**
 * Cria/atualiza credencial admin do tenant `psicolobia` com plano enterprise sem expiracao.
 * Uso: npx tsx scripts/create-psicolobia-admin.ts
 *
 * Idempotente: pode rodar varias vezes — faz upsert no user, tenant e membership.
 */
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { tenants, tenantMemberships, users } from "../src/db/schema";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnvFile(".env.local");

const ADMIN_EMAIL = "admin@psicolobia.com.br";
const ADMIN_PASSWORD = "Psicolobia@Adm-2026!K9vQ";
const ADMIN_NAME = "Administrador Psicolobia";
const TENANT_SLUG = "psicolobia";
const TENANT_NAME = "Psicolobia";
const NEVER_EXPIRES = new Date("2099-12-31T23:59:59Z");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nao configurado em .env.local");

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 1) Upsert user
  const [existingUser] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  let userId: string;
  if (existingUser) {
    await db
      .update(users)
      .set({
        password: passwordHash,
        name: ADMIN_NAME,
        role: "admin",
        active: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingUser.id));
    userId = existingUser.id;
    console.log(`[user] atualizado: ${ADMIN_EMAIL} (${userId})`);
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email: ADMIN_EMAIL,
        password: passwordHash,
        name: ADMIN_NAME,
        role: "admin",
        platformRole: "user",
        active: true,
      })
      .returning({ id: users.id });
    userId = created.id;
    console.log(`[user] criado: ${ADMIN_EMAIL} (${userId})`);
  }

  // 2) Upsert tenant psicolobia com plano enterprise vitalicio
  const [existingTenant] = await db.select().from(tenants).where(eq(tenants.slug, TENANT_SLUG)).limit(1);
  let tenantId: string;
  const tenantUpdate = {
    name: TENANT_NAME,
    ownerUserId: userId,
    plan: "enterprise" as const,
    subscriptionStatus: "active" as const,
    trialEndsAt: null,
    currentPeriodEnd: NEVER_EXPIRES,
    active: true,
    updatedAt: new Date(),
  };
  if (existingTenant) {
    await db.update(tenants).set(tenantUpdate).where(eq(tenants.id, existingTenant.id));
    tenantId = existingTenant.id;
    console.log(`[tenant] atualizado: ${TENANT_SLUG} (${tenantId})`);
  } else {
    const [created] = await db
      .insert(tenants)
      .values({ slug: TENANT_SLUG, ...tenantUpdate })
      .returning({ id: tenants.id });
    tenantId = created.id;
    console.log(`[tenant] criado: ${TENANT_SLUG} (${tenantId})`);
  }

  // 3) Upsert membership admin
  const [existingMembership] = await db
    .select()
    .from(tenantMemberships)
    .where(eq(tenantMemberships.userId, userId))
    .limit(1);
  if (existingMembership && existingMembership.tenantId === tenantId) {
    await db
      .update(tenantMemberships)
      .set({ role: "admin", active: true })
      .where(eq(tenantMemberships.id, existingMembership.id));
    console.log(`[membership] atualizado para admin`);
  } else {
    await db.insert(tenantMemberships).values({
      userId,
      tenantId,
      role: "admin",
      active: true,
    });
    console.log(`[membership] criado: ${userId} -> ${tenantId} (admin)`);
  }

  console.log("\n✅ Credencial pronta:");
  console.log(`   email:    ${ADMIN_EMAIL}`);
  console.log(`   password: ${ADMIN_PASSWORD}`);
  console.log(`   tenant:   ${TENANT_SLUG} (plan=enterprise, sem expiracao)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
