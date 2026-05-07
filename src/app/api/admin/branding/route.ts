import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { getTenantBranding, type TenantBranding } from "@/lib/branding";

const colorRegex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const brandingSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  logoUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  primaryColor: z.string().trim().regex(colorRegex, "Cor inválida (ex: #D4A574)").optional().or(z.literal("")),
  accentColor: z.string().trim().regex(colorRegex, "Cor inválida (ex: #E8A0BF)").optional().or(z.literal("")),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
});

/** GET — return resolved branding for the current admin's tenant. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.response;

  const branding = await getTenantBranding(auth.tenantId!);
  return NextResponse.json({ branding });
}

/** PUT — update branding fields. Empty strings clear the override (fall back to defaults). */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = brandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  // Read existing branding so we can merge (clear vs preserve)
  const [row] = await db
    .select({ branding: tenants.branding })
    .from(tenants)
    .where(eq(tenants.id, auth.tenantId!))
    .limit(1);

  const current = (row?.branding ?? {}) as TenantBranding;
  const updates = parsed.data;
  const next: TenantBranding = { ...current };

  // Apply each field: undefined = preserve, "" = clear, value = set
  for (const key of ["displayName", "logoUrl", "primaryColor", "accentColor", "tagline"] as const) {
    const v = updates[key];
    if (v === undefined) continue;
    if (v === "") delete next[key];
    else next[key] = v;
  }

  await db
    .update(tenants)
    .set({ branding: next, updatedAt: new Date() })
    .where(eq(tenants.id, auth.tenantId!));

  const resolved = await getTenantBranding(auth.tenantId!);
  return NextResponse.json({ branding: resolved });
}
