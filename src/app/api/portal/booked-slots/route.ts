import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments } from "@/db/schema";
import { ne, gte, and, eq } from "drizzle-orm";
import { getPublicTenantId } from "@/lib/tenant";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/**
 * Public endpoint that returns booked slots (date + startTime)
 * for non-cancelled appointments from today onward.
 * Does NOT expose patient info — only date/time.
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await getPublicTenantId(req);
    if (tenant.error || !tenant.tenantId) {
      return NextResponse.json({ error: tenant.error || "Missing tenant" }, { status: 400 });
    }
    const tenantId = tenant.tenantId;

    const today = todaySP();
    const result = await db
      .select({
        date: appointments.date,
        startTime: appointments.startTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          ne(appointments.status, "cancelled"),
          gte(appointments.date, today)
        )
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/booked-slots error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
