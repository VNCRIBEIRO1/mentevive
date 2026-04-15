import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blockedDates } from "@/db/schema";
import { eq, gte, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const result = await db
      .select()
      .from(blockedDates)
      .orderBy(asc(blockedDates.date));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/blocked-dates error:", error);
    return NextResponse.json({ error: "Erro ao buscar datas bloqueadas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();

    // Support batch: { dates: [{ date, reason }] }
    if (body.dates && Array.isArray(body.dates)) {
      const toInsert = body.dates.filter((d: { date: string }) => d.date);
      if (toInsert.length === 0) return NextResponse.json([], { status: 201 });

      const inserted = await db
        .insert(blockedDates)
        .values(
          toInsert.map((d: { date: string; reason?: string }) => ({
            date: d.date,
            reason: d.reason || null,
          }))
        )
        .onConflictDoNothing({ target: blockedDates.date })
        .returning();

      return NextResponse.json(inserted, { status: 201 });
    }

    // Single: { date, reason }
    const { date, reason } = body;
    if (!date) {
      return NextResponse.json({ error: "Data é obrigatória." }, { status: 400 });
    }

    const [newBlocked] = await db
      .insert(blockedDates)
      .values({ date, reason: reason || null })
      .onConflictDoNothing({ target: blockedDates.date })
      .returning();

    if (!newBlocked) {
      return NextResponse.json({ error: "Data já está bloqueada." }, { status: 409 });
    }

    return NextResponse.json(newBlocked, { status: 201 });
  } catch (error) {
    console.error("POST /api/blocked-dates error:", error);
    return NextResponse.json({ error: "Erro ao bloquear data." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const date = searchParams.get("date");

    if (id) {
      const deleted = await db.delete(blockedDates).where(eq(blockedDates.id, id)).returning();
      if (deleted.length === 0) {
        return NextResponse.json({ error: "Data bloqueada não encontrada." }, { status: 404 });
      }
    } else if (date) {
      const deleted = await db.delete(blockedDates).where(eq(blockedDates.date, date)).returning();
      if (deleted.length === 0) {
        return NextResponse.json({ error: "Data bloqueada não encontrada." }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "ID ou data são necessários." }, { status: 400 });
    }

    return NextResponse.json({ message: "Data desbloqueada." });
  } catch (error) {
    console.error("DELETE /api/blocked-dates error:", error);
    return NextResponse.json({ error: "Erro ao desbloquear data." }, { status: 500 });
  }
}
