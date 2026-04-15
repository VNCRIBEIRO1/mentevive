import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availability } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { listUpcomingCustomAvailability } from "@/lib/custom-availability";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export async function GET() {
  try {
    const [weeklyAvailability, customAvailability] = await Promise.all([
      db
        .select()
        .from(availability)
        .where(eq(availability.active, true))
        .orderBy(asc(availability.dayOfWeek)),
      listUpcomingCustomAvailability(todaySP()),
    ]);

    return NextResponse.json([...weeklyAvailability, ...customAvailability]);
  } catch (error) {
    console.error("GET /api/portal/availability error:", error);
    return NextResponse.json({ error: "Erro ao buscar disponibilidade." }, { status: 500 });
  }
}
