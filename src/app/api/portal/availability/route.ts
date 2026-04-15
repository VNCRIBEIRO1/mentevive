import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availability } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { listUpcomingCustomAvailability } from "@/lib/custom-availability";
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
    const tenantId = tenant.tenantId;

    const [weeklyAvailability, customAvailability] = await Promise.all([
      db
        .select()
        .from(availability)
        .where(and(eq(availability.tenantId, tenantId), eq(availability.active, true)))
        .orderBy(asc(availability.dayOfWeek)),
      listUpcomingCustomAvailability(tenantId, todaySP()),
    ]);

    return NextResponse.json([...weeklyAvailability, ...customAvailability]);
  } catch (error) {
    console.error("GET /api/portal/availability error:", error);
    return NextResponse.json({ error: "Erro ao buscar disponibilidade." }, { status: 500 });
  }
}
