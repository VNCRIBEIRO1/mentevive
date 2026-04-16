import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blockedDates } from "@/db/schema";
import { gte, and, eq } from "drizzle-orm";
import { getPublicTenantId } from "@/lib/tenant";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export async function GET(req: NextRequest) {
  try {
    const tenant = await getPublicTenantId(req);
    if (tenant.error || !tenant.tenantId) {
      return NextResponse.json({ error: tenant.error || "Missing tenant" }, { status: 400 });
    }

    const today = todaySP();
    const result = await db
      .select({ date: blockedDates.date, reason: blockedDates.reason })
      .from(blockedDates)
      .where(and(eq(blockedDates.tenantId, tenant.tenantId), gte(blockedDates.date, today)));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/blocked-dates error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
