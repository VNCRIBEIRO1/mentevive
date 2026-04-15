import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { refreshConnectOnboardingLink } from "@/lib/stripe";

/**
 * GET /api/admin/stripe/connect/refresh
 * Stripe redirects here when an onboarding link expires.
 * Re-generates a fresh onboarding link and redirects the user.
 */
export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      const base = process.env.NEXTAUTH_URL || "https://mentevive.vercel.app";
      return NextResponse.redirect(`${base}/login`);
    }

    const tenantId = auth.tenantId!;
    const base = process.env.NEXTAUTH_URL || "https://mentevive.vercel.app";

    const [tenant] = await db
      .select({ stripeAccountId: tenants.stripeAccountId })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant?.stripeAccountId) {
      return NextResponse.redirect(`${base}/admin/configuracoes?stripe=error`);
    }

    const returnUrl = `${base}/admin/configuracoes?stripe=success`;
    const refreshUrl = `${base}/api/admin/stripe/connect/refresh`;

    const url = await refreshConnectOnboardingLink(
      tenant.stripeAccountId,
      returnUrl,
      refreshUrl
    );

    if (!url) {
      return NextResponse.redirect(`${base}/admin/configuracoes?stripe=error`);
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("GET /api/admin/stripe/connect/refresh error:", error);
    const base = process.env.NEXTAUTH_URL || "https://mentevive.vercel.app";
    return NextResponse.redirect(`${base}/admin/configuracoes?stripe=error`);
  }
}
