import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import {
  createConnectAccount,
  refreshConnectOnboardingLink,
  checkConnectAccountReady,
  isStripeConfigured,
} from "@/lib/stripe";

const getBaseUrl = () =>
  process.env.NEXTAUTH_URL || "https://mentevive.vercel.app";

/**
 * GET /api/admin/stripe/connect
 * Returns the current Stripe Connect status for the tenant.
 */
export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;

    if (!isStripeConfigured()) {
      return NextResponse.json({ configured: false, message: "Stripe não configurado." });
    }

    const [tenant] = await db
      .select({
        stripeAccountId: tenants.stripeAccountId,
        stripeOnboardingComplete: tenants.stripeOnboardingComplete,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      return NextResponse.json({ error: "Consultório não encontrado." }, { status: 404 });
    }

    if (!tenant.stripeAccountId) {
      return NextResponse.json({
        status: "not_connected",
        stripeAccountId: null,
        onboardingComplete: false,
      });
    }

    // Re-check with Stripe if onboarding is complete
    const ready = tenant.stripeOnboardingComplete
      ? true
      : await checkConnectAccountReady(tenant.stripeAccountId);

    if (ready && !tenant.stripeOnboardingComplete) {
      await db
        .update(tenants)
        .set({ stripeOnboardingComplete: true })
        .where(eq(tenants.id, tenantId));
    }

    return NextResponse.json({
      status: ready ? "active" : "pending_onboarding",
      stripeAccountId: tenant.stripeAccountId,
      onboardingComplete: ready,
    });
  } catch (error) {
    console.error("GET /api/admin/stripe/connect error:", error);
    return NextResponse.json({ error: "Erro ao verificar status do Stripe." }, { status: 500 });
  }
}

/**
 * POST /api/admin/stripe/connect
 * Creates a Stripe Connect Express account for the tenant and returns the onboarding URL.
 * If account already exists, returns a fresh onboarding link.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe não configurado no servidor." }, { status: 503 });
    }

    const [tenant] = await db
      .select({
        id: tenants.id,
        slug: tenants.slug,
        stripeAccountId: tenants.stripeAccountId,
        stripeOnboardingComplete: tenants.stripeOnboardingComplete,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      return NextResponse.json({ error: "Consultório não encontrado." }, { status: 404 });
    }

    const base = getBaseUrl();
    const returnUrl = `${base}/admin/configuracoes?stripe=success`;
    const refreshUrl = `${base}/api/admin/stripe/connect/refresh`;

    // Account already exists — return refresh link
    if (tenant.stripeAccountId) {
      const url = await refreshConnectOnboardingLink(
        tenant.stripeAccountId,
        returnUrl,
        refreshUrl
      );
      if (!url) {
        return NextResponse.json({ error: "Não foi possível gerar link de onboarding." }, { status: 500 });
      }
      return NextResponse.json({ onboardingUrl: url, accountId: tenant.stripeAccountId });
    }

    // Create new account
    const result = await createConnectAccount(
      tenant.slug,
      tenant.id,
      returnUrl,
      refreshUrl
    );

    if (!result) {
      return NextResponse.json({ error: "Não foi possível criar conta Stripe." }, { status: 500 });
    }

    // Persist the account ID
    await db
      .update(tenants)
      .set({ stripeAccountId: result.accountId, stripeOnboardingComplete: false })
      .where(eq(tenants.id, tenantId));

    return NextResponse.json({
      onboardingUrl: result.onboardingUrl,
      accountId: result.accountId,
    });
  } catch (error) {
    console.error("POST /api/admin/stripe/connect error:", error);
    return NextResponse.json({ error: "Erro ao configurar Stripe Connect." }, { status: 500 });
  }
}
