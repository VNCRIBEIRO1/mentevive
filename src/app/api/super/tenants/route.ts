import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.response;

  const rows = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      plan: tenants.plan,
      active: tenants.active,
      stripeAccountId: tenants.stripeAccountId,
      stripeOnboardingComplete: tenants.stripeOnboardingComplete,
      maxPatients: tenants.maxPatients,
      maxAppointmentsPerMonth: tenants.maxAppointmentsPerMonth,
      landingDomain: tenants.landingDomain,
      createdAt: tenants.createdAt,
      ownerUserId: tenants.ownerUserId,
    })
    .from(tenants)
    .orderBy(tenants.createdAt);

  return NextResponse.json({ tenants: rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.response;

  const body = await req.json();
  const { slug, name, ownerEmail, plan, maxPatients, maxAppointmentsPerMonth, landingDomain } = body;

  if (!slug || !name) {
    return NextResponse.json({ error: "slug e name são obrigatórios." }, { status: 400 });
  }

  // Validate slug format
  if (!/^[a-z0-9-]{2,63}$/.test(slug)) {
    return NextResponse.json({ error: "Slug inválido. Use apenas letras minúsculas, números e hífens." }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Slug já está em uso." }, { status: 409 });
  }

  // Resolve ownerUserId if email provided
  let ownerUserId: string | null = null;
  if (ownerEmail) {
    const owner = await db.select({ id: users.id }).from(users).where(eq(users.email, ownerEmail)).limit(1);
    if (owner.length === 0) {
      return NextResponse.json({ error: `Usuário com email ${ownerEmail} não encontrado.` }, { status: 404 });
    }
    ownerUserId = owner[0].id;
  }

  const [created] = await db
    .insert(tenants)
    .values({
      slug,
      name,
      ownerUserId: ownerUserId ?? undefined,
      plan: plan ?? "free",
      maxPatients: maxPatients ?? 50,
      maxAppointmentsPerMonth: maxAppointmentsPerMonth ?? 200,
      landingDomain: landingDomain ?? null,
    })
    .returning();

  return NextResponse.json({ tenant: created }, { status: 201 });
}
