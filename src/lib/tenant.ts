import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { tenantScope } from "@/lib/tenant-db";

async function resolveTenantIdFromSlug(slug: string) {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  return tenant?.id ?? null;
}

/**
 * Resolve tenant from a request's `?tenant=SLUG` query parameter.
 * Used by public-facing routes (availability, booked-slots, settings, etc.)
 * that don't require authentication but need tenant scoping.
 */
export async function getPublicTenantScope(req: Request) {
  const url = new URL(req.url);
  const slug = req.headers.get("x-tenant-slug") || url.searchParams.get("tenant");

  if (!slug) {
    return { error: "Missing ?tenant= parameter", tdb: null };
  }
  const tenantId = await resolveTenantIdFromSlug(slug);

  if (!tenantId) {
    return { error: `Tenant not found: ${slug}`, tdb: null };
  }

  return { error: null, tdb: tenantScope(tenantId) };
}

/**
 * Resolve tenantId from request headers (set by middleware) or ?tenant=SLUG param.
 * For public routes that need tenant context but don't require auth.
 */
export async function getPublicTenantId(req: Request): Promise<{ error: string | null; tenantId: string | null }> {
  // Public routes trust only tenant slug resolved server-side.
  const url = new URL(req.url);
  const slug = req.headers.get("x-tenant-slug") || url.searchParams.get("tenant");
  if (!slug) {
    return { error: "Missing tenant context", tenantId: null };
  }
  const tenantId = await resolveTenantIdFromSlug(slug);

  if (!tenantId) {
    return { error: `Tenant not found: ${slug}`, tenantId: null };
  }

  return { error: null, tenantId };
}
