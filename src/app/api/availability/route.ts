import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availability } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;
    const result = await db.select().from(availability).where(eq(availability.tenantId, tenantId)).orderBy(desc(availability.dayOfWeek));
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/availability error:", error);
    return NextResponse.json({ error: "Erro ao buscar disponibilidade." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;
    const body = await req.json();

    // Support batch format: { slots: [...] }
    if (body.slots && Array.isArray(body.slots)) {
      const activeSlots = body.slots.filter(
        (s: { active?: boolean; startTime?: string; endTime?: string }) =>
          s.active !== false && s.startTime && s.endTime && s.startTime < s.endTime
      );

      // Use transaction to ensure delete + insert are atomic
      const result = await db.transaction(async (tx) => {
        await tx.delete(availability).where(eq(availability.tenantId, tenantId));

        if (activeSlots.length === 0) return [];

        return tx
          .insert(availability)
          .values(
            activeSlots.map((s: { dayOfWeek: number; startTime: string; endTime: string; active?: boolean }) => ({
              dayOfWeek: Math.min(Math.max(s.dayOfWeek, 0), 6),
              startTime: s.startTime,
              endTime: s.endTime,
              active: s.active ?? true,
              tenantId,
            }))
          )
          .returning();
      });

      return NextResponse.json(result, { status: 201 });
    }

    // Support single slot format: { dayOfWeek, startTime, endTime }
    const { dayOfWeek, startTime, endTime, active } = body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "Dia, hora início e hora fim são obrigatórios." }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "Hora início deve ser anterior à hora fim." }, { status: 400 });
    }

    const [newSlot] = await db.insert(availability).values({
      dayOfWeek,
      startTime,
      endTime,
      active: active ?? true,
      tenantId,
    }).returning();

    return NextResponse.json(newSlot, { status: 201 });
  } catch (error) {
    console.error("POST /api/availability error:", error);
    return NextResponse.json({ error: "Erro ao criar disponibilidade." }, { status: 500 });
  }
}
