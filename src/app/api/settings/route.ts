import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { updateSettingSchema, formatZodError } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    const tenantId = auth.tenantId!;

    if (key) {
      const [row] = await db.select().from(settings).where(and(eq(settings.tenantId, tenantId), eq(settings.key, key)));
      if (!row) return NextResponse.json({ key, value: null });
      try {
        return NextResponse.json({ key: row.key, value: JSON.parse(row.value) });
      } catch {
        return NextResponse.json({ key: row.key, value: row.value });
      }
    }

    // Return all settings
    const rows = await db.select().from(settings).where(eq(settings.tenantId, tenantId));
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
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const parsed = updateSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const tenantId = auth.tenantId!;
    const { key, value } = parsed.data;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    // Atomic upsert: INSERT ... ON CONFLICT DO UPDATE
    const [row] = await db
      .insert(settings)
      .values({ key, value: serialized, tenantId })
      .onConflictDoUpdate({
        target: [settings.tenantId, settings.key],
        set: { value: serialized, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração." }, { status: 500 });
  }
}
