import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { tenants, tenantMemberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.response;

  const { id } = await params;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Consultório não encontrado." }, { status: 404 });
  }

  // Also return members count
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: tenantMemberships.role,
      active: tenantMemberships.active,
    })
    .from(tenantMemberships)
    .innerJoin(users, eq(tenantMemberships.userId, users.id))
    .where(eq(tenantMemberships.tenantId, id));

  return NextResponse.json({ tenant, members });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.response;

  const { id } = await params;

  const [existing] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Consultório não encontrado." }, { status: 404 });
  }

  const body = await req.json();
  const { name, plan, active, maxPatients, maxAppointmentsPerMonth, landingDomain, stripeOnboardingComplete } = body;

  const updates: Partial<typeof tenants.$inferInsert> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (plan !== undefined) updates.plan = plan;
  if (active !== undefined) updates.active = active;
  if (maxPatients !== undefined) updates.maxPatients = maxPatients;
  if (maxAppointmentsPerMonth !== undefined) updates.maxAppointmentsPerMonth = maxAppointmentsPerMonth;
  if (landingDomain !== undefined) updates.landingDomain = landingDomain;
  if (stripeOnboardingComplete !== undefined) updates.stripeOnboardingComplete = stripeOnboardingComplete;

  const [updated] = await db.update(tenants).set(updates).where(eq(tenants.id, id)).returning();

  return NextResponse.json({ tenant: updated });
}
