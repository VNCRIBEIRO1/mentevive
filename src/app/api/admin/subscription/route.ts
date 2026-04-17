import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import {
  getOrCreatePlatformCustomer,
  createSubscriptionCheckout,
} from "@/lib/stripe";

const PLAN_CONFIG = {
  professional: {
    priceEnv: "STRIPE_PRICE_MONTHLY",
    label: "Mensal",
    amount: "R$ 59,90",
  },
  enterprise: {
    priceEnv: "STRIPE_PRICE_ANNUAL",
    label: "Anual",
    amount: "R$ 499,00",
  },
} as const;

/** Plans that grant trial access */
const TRIAL_PLANS = ["basico", "pro", "starter"];

/** GET — Current subscription status for the tenant */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;
    const tenantId = auth.tenantId!;

    const [tenant] = await db
      .select({
        plan: tenants.plan,
        subscriptionStatus: tenants.subscriptionStatus,
        currentPeriodEnd: tenants.currentPeriodEnd,
        trialEndsAt: tenants.trialEndsAt,
        stripeCustomerId: tenants.stripeCustomerId,
        stripeSubscriptionId: tenants.stripeSubscriptionId,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
    }

    const now = new Date();
    const isTrialPlan = TRIAL_PLANS.includes(tenant.plan);
    const isTrialActive = isTrialPlan && !!tenant.trialEndsAt && tenant.trialEndsAt > now;
    const isTrialExpired = isTrialPlan && !!tenant.trialEndsAt && tenant.trialEndsAt <= now;
    const trialDaysRemaining = isTrialActive
      ? Math.ceil((tenant.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      plan: tenant.plan,
      subscriptionStatus: tenant.subscriptionStatus,
      currentPeriodEnd: tenant.currentPeriodEnd,
      trialEndsAt: tenant.trialEndsAt,
      isTrialActive,
      isTrialExpired,
      trialDaysRemaining,
      hasStripeCustomer: !!tenant.stripeCustomerId,
      hasSubscription: !!tenant.stripeSubscriptionId,
    });
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

/** POST — Create Stripe Checkout Session for subscription */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;
    const tenantId = auth.tenantId!;

    const body = await req.json();
    const planKey = body.plan as "professional" | "enterprise";

    if (!planKey || !PLAN_CONFIG[planKey]) {
      return NextResponse.json({ error: "Plano inválido. Use 'professional' ou 'enterprise'." }, { status: 400 });
    }

    const config = PLAN_CONFIG[planKey];
    const priceId = process.env[config.priceEnv];
    if (!priceId) {
      return NextResponse.json({ error: "Plano não configurado no Stripe." }, { status: 500 });
    }

    // Get tenant
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        stripeCustomerId: tenants.stripeCustomerId,
        stripeSubscriptionId: tenants.stripeSubscriptionId,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
    }

    if (tenant.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Já possui uma assinatura ativa. Use o portal para gerenciar." },
        { status: 409 }
      );
    }

    // Get/create Stripe Customer
    const email = auth.session!.user?.email || "";
    const customerId = await getOrCreatePlatformCustomer(
      tenantId,
      email,
      tenant.name,
      tenant.stripeCustomerId
    );

    if (!customerId) {
      return NextResponse.json({ error: "Stripe não configurado." }, { status: 500 });
    }

    // Save customer ID if new
    if (customerId !== tenant.stripeCustomerId) {
      await db.update(tenants).set({ stripeCustomerId: customerId }).where(eq(tenants.id, tenantId));
    }

    const baseUrl = process.env.NEXTAUTH_URL || "";
    const result = await createSubscriptionCheckout({
      customerId,
      priceId,
      tenantId,
      successUrl: `${baseUrl}/admin/assinatura?status=success`,
      cancelUrl: `${baseUrl}/admin/assinatura?status=cancelled`,
    });

    if (!result) {
      return NextResponse.json({ error: "Erro ao criar sessão de checkout." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  } catch (error) {
    console.error("Erro ao criar checkout de assinatura:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
