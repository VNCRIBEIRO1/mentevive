import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/portal/consent-template
 * Returns the data the patient consent page needs to render its template:
 * tenant display name, professional name, CRP and (optionally) a custom markdown
 * override stored in tenants.branding.consentMarkdown.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.response;

  const [tenant] = await db
    .select({
      name: tenants.name,
      branding: tenants.branding,
      ownerUserId: tenants.ownerUserId,
    })
    .from(tenants)
    .where(eq(tenants.id, auth.tenantId!))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Consultório não encontrado." }, { status: 404 });
  }

  let professionalName: string | null = null;
  let crp: string | null = null;

  if (tenant.ownerUserId) {
    const [owner] = await db
      .select({ name: users.name, crp: users.crp })
      .from(users)
      .where(eq(users.id, tenant.ownerUserId))
      .limit(1);
    professionalName = owner?.name ?? null;
    crp = owner?.crp ?? null;
  }

  const branding = (tenant.branding ?? {}) as { consentMarkdown?: string; displayName?: string };

  return NextResponse.json({
    tenantName: branding.displayName?.trim() || tenant.name,
    professionalName,
    crp,
    customMarkdown: branding.consentMarkdown?.trim() || null,
  });
}
