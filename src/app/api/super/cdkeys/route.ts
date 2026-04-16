import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cdkeys, tenants, users } from "@/db/schema";
import { eq, desc, isNull, isNotNull } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/api-auth";
import { randomBytes } from "crypto";

function generateCDKey(): string {
  return randomBytes(8).toString("hex").toUpperCase(); // 16 chars
}

/** GET — List all CDKeys */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.response;

    const allKeys = await db
      .select({
        id: cdkeys.id,
        code: cdkeys.code,
        plan: cdkeys.plan,
        durationDays: cdkeys.durationDays,
        tenantId: cdkeys.tenantId,
        redeemedAt: cdkeys.redeemedAt,
        createdAt: cdkeys.createdAt,
      })
      .from(cdkeys)
      .orderBy(desc(cdkeys.createdAt))
      .limit(100);

    // Enrich with tenant name for redeemed keys
    const enriched = await Promise.all(
      allKeys.map(async (k) => {
        let tenantName: string | null = null;
        if (k.tenantId) {
          const [t] = await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, k.tenantId)).limit(1);
          tenantName = t?.name || null;
        }
        return { ...k, tenantName };
      })
    );

    const available = enriched.filter((k) => !k.redeemedAt).length;
    const used = enriched.filter((k) => k.redeemedAt).length;

    return NextResponse.json({ keys: enriched, stats: { total: enriched.length, available, used } });
  } catch (error) {
    console.error("Erro ao listar CDKeys:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

/** POST — Generate new CDKeys */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const quantity = Math.min(Math.max(body.quantity || 1, 1), 50); // 1-50
    const plan = body.plan || "starter";
    const durationDays = body.durationDays || 30;

    if (!["free", "starter", "professional", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const createdBy = auth.session!.user?.id || null;
    const generated: string[] = [];

    for (let i = 0; i < quantity; i++) {
      const code = generateCDKey();
      await db.insert(cdkeys).values({
        code,
        plan,
        durationDays,
        createdBy,
      });
      generated.push(code);
    }

    return NextResponse.json({ success: true, keys: generated, count: generated.length });
  } catch (error) {
    console.error("Erro ao gerar CDKeys:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
