import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getTenantSubscriptionState, isFeatureAllowed, type FeatureKey } from "@/lib/plans";

/**
 * Wraps an API handler with feature gating.
 * Returns 403 if the tenant's plan doesn't include the feature.
 */
export function requireFeature(
  feature: FeatureKey,
  handler: (req: Request, context: unknown) => Promise<Response>
) {
  return async (req: Request, context: unknown) => {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.activeTenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getTenantSubscriptionState(tenantId);
    if (!state || !isFeatureAllowed(state.plan, feature as string)) {
      return NextResponse.json(
        { error: "Recurso não disponível no seu plano atual", feature },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}
