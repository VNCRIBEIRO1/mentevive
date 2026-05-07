import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getTenantBranding } from "@/lib/branding";

/**
 * GET /api/tenant/branding
 * Returns the resolved branding for the active tenant of the current session.
 * Used by client components (Sidebar, headers) to render tenant logo / colors.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.response;

  const branding = await getTenantBranding(auth.tenantId!);

  return NextResponse.json({ branding });
}
