import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// Public endpoint — patient-facing pages can read pricing/areas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    // Only allow public keys
    const publicKeys = ["pricing", "areas"] as const;

    if (key) {
      if (!(publicKeys as readonly string[]).includes(key)) {
        return NextResponse.json({ error: "Chave não permitida." }, { status: 403 });
      }
      const [row] = await db.select().from(settings).where(eq(settings.key, key));
      if (!row) return NextResponse.json({ key, value: null });
      try {
        return NextResponse.json({ key: row.key, value: JSON.parse(row.value) });
      } catch {
        return NextResponse.json({ key: row.key, value: row.value });
      }
    }

    // Return all public settings in a single query (avoids N+1)
    const rows = await db.select().from(settings).where(
      inArray(settings.key, [...publicKeys])
    );
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/settings error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações." }, { status: 500 });
  }
}
