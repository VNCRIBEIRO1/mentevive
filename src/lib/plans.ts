import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

/* ================================================================
 * Plan & Feature Gating — Source of Truth
 *
 * Plano Básico: R$ 399 (setup único) + 30 dias trial
 * Plano Pro:    R$ 499 (setup único) + 90 dias trial
 * Pós-trial:    R$ 59,90/mês (professional) ou R$ 499/ano (enterprise)
 * ================================================================ */

export type PlanId = "free" | "basico" | "pro" | "starter" | "professional" | "enterprise";

/** Plans that grant trial access */
const TRIAL_PLANS: PlanId[] = ["basico", "pro", "starter"];

/** Plans that grant full paid access */
const PAID_PLANS: PlanId[] = ["professional", "enterprise"];

/** All plans that have any active access (trial or paid) */
const ACTIVE_PLANS: PlanId[] = [...TRIAL_PLANS, ...PAID_PLANS];

/** Feature definitions per plan tier */
const PLAN_FEATURES: Record<string, PlanId[]> = {
  // Basic features — available to all active plans (basico, pro, professional, enterprise)
  dashboard:       ACTIVE_PLANS,
  pacientes:       ACTIVE_PLANS,
  agenda:          ACTIVE_PLANS,
  financeiro:      ACTIVE_PLANS,
  prontuarios:     ACTIVE_PLANS,
  horarios:        ACTIVE_PLANS,
  sala_espera:     ACTIVE_PLANS,
  portal:          ACTIVE_PLANS,

  // Pro features — pro trial + all paid plans
  blog:            ["pro", "professional", "enterprise"],
  grupos:          ["pro", "professional", "enterprise"],
  stripe_connect:  ["pro", "professional", "enterprise"],

  // Landing page is ALWAYS available (vitalícia)
  landing:         ["free", ...ACTIVE_PLANS],
};

export type FeatureKey = keyof typeof PLAN_FEATURES;

export interface TenantSubscriptionState {
  plan: PlanId;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isPaid: boolean;
  isAccessActive: boolean;
  trialDaysRemaining: number;
}

/** Get complete subscription state for a tenant */
export async function getTenantSubscriptionState(tenantId: string): Promise<TenantSubscriptionState | null> {
  const [tenant] = await db
    .select({
      plan: tenants.plan,
      subscriptionStatus: tenants.subscriptionStatus,
      trialEndsAt: tenants.trialEndsAt,
      currentPeriodEnd: tenants.currentPeriodEnd,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return null;

  const now = new Date();
  const plan = tenant.plan as PlanId;
  const isTrialPlan = TRIAL_PLANS.includes(plan);
  const isPaidPlan = PAID_PLANS.includes(plan);

  const isTrialActive = isTrialPlan && !!tenant.trialEndsAt && tenant.trialEndsAt > now;
  const isTrialExpired = isTrialPlan && !!tenant.trialEndsAt && tenant.trialEndsAt <= now;
  const isPaid = isPaidPlan && (tenant.subscriptionStatus === "active" || tenant.subscriptionStatus === "trialing");

  const isAccessActive = isTrialActive || isPaid;

  const trialDaysRemaining = isTrialActive && tenant.trialEndsAt
    ? Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    plan,
    subscriptionStatus: tenant.subscriptionStatus,
    trialEndsAt: tenant.trialEndsAt,
    currentPeriodEnd: tenant.currentPeriodEnd,
    isTrialActive,
    isTrialExpired,
    isPaid,
    isAccessActive,
    trialDaysRemaining,
  };
}

/** Check if a specific feature is allowed for the current plan */
export function isFeatureAllowed(plan: PlanId, feature: string): boolean {
  const allowedPlans = PLAN_FEATURES[feature];
  if (!allowedPlans) return false;
  return allowedPlans.includes(plan);
}

/** Check if a tenant has access (not expired, not free without trial) */
export function hasActiveAccess(state: TenantSubscriptionState): boolean {
  return state.isAccessActive;
}

/** Get list of blocked features for a plan */
export function getBlockedFeatures(plan: PlanId): string[] {
  return Object.entries(PLAN_FEATURES)
    .filter(([, plans]) => !plans.includes(plan))
    .map(([feature]) => feature);
}

/** Label mapping for plan display */
export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Gratuito",
  basico: "Básico",
  pro: "Pro",
  starter: "Trial", // legacy
  professional: "Mensal",
  enterprise: "Anual",
};
