import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, appointments } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export const revalidate = 300;

export async function GET() {
  try {
    const [tenantCount] = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.active, true));

    const [appointmentCount] = await db
      .select({ count: count() })
      .from(appointments)
      .where(eq(appointments.status, "completed"));

    return NextResponse.json(
      {
        professionals: tenantCount?.count || 0,
        sessions: appointmentCount?.count || 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/public/stats error:", error);
    return NextResponse.json({ professionals: 0, sessions: 0 }, { status: 200 });
  }
}
