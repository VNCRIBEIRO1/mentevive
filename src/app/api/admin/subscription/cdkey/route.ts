import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, cdkeys } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

/** POST — Redeem a CDKey to activate trial */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;
    const tenantId = auth.tenantId!;

    const body = await req.json();
    const code = (body.code || "").trim().toUpperCase();

    if (!code || code.length < 8) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }

    // Check current tenant plan
    const [tenant] = await db
      .select({ plan: tenants.plan, trialEndsAt: tenants.trialEndsAt })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
    }

    if (tenant.plan !== "free") {
      return NextResponse.json(
        { error: "Seu plano atual não permite ativar uma CDKey. Já possui assinatura ativa." },
        { status: 409 }
      );
    }

    // Find unused CDKey
    const [cdkey] = await db
      .select()
      .from(cdkeys)
      .where(and(eq(cdkeys.code, code), isNull(cdkeys.redeemedAt)))
      .limit(1);

    if (!cdkey) {
      return NextResponse.json({ error: "Código inválido ou já utilizado." }, { status: 404 });
    }

    // Activate trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + cdkey.durationDays * 24 * 60 * 60 * 1000);

    await db.update(cdkeys).set({
      tenantId,
      redeemedAt: now,
    }).where(eq(cdkeys.id, cdkey.id));

    await db.update(tenants).set({
      plan: cdkey.plan,
      subscriptionStatus: "trialing",
      trialEndsAt: trialEnd,
      updatedAt: now,
    }).where(eq(tenants.id, tenantId));

    return NextResponse.json({
      success: true,
      plan: cdkey.plan,
      trialEndsAt: trialEnd.toISOString(),
      durationDays: cdkey.durationDays,
    });
  } catch (error) {
    console.error("Erro ao resgatar CDKey:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
