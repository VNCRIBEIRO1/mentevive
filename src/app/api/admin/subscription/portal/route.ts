import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { createCustomerPortalSession } from "@/lib/stripe";

/** POST — Create a Stripe Customer Portal session for self-service subscription management */
export async function POST() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;
    const tenantId = auth.tenantId!;

    const [tenant] = await db
      .select({ stripeCustomerId: tenants.stripeCustomerId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura encontrada para gerenciar." },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "";
    const portalUrl = await createCustomerPortalSession(
      tenant.stripeCustomerId,
      `${baseUrl}/admin/assinatura`
    );

    if (!portalUrl) {
      return NextResponse.json({ error: "Stripe não configurado." }, { status: 500 });
    }

    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error("Erro ao criar sessão do portal:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
