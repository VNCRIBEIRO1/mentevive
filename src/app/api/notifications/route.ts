import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, patients } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

/* GET /api/notifications?limit=20&unreadOnly=true */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30") || 30, 100);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const conditions = [];
    if (unreadOnly) conditions.push(eq(notifications.read, false));

    const result = await db
      .select({
        notification: notifications,
        patientName: patients.name,
      })
      .from(notifications)
      .leftJoin(patients, eq(notifications.patientId, patients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Also get unread count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.read, false));

    return NextResponse.json({ notifications: result, unreadCount: count });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Erro ao buscar notificações." }, { status: 500 });
  }
}

/* PUT /api/notifications — mark as read */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
      return NextResponse.json({ message: "Todas notificações marcadas como lidas." });
    }

    if (!id) {
      return NextResponse.json({ error: "ID da notificação é obrigatório." }, { status: 400 });
    }

    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Notificação não encontrada." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/notifications error:", error);
    return NextResponse.json({ error: "Erro ao atualizar notificação." }, { status: 500 });
  }
}

/* DELETE /api/notifications?id=xxx — delete a notification */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
    }

    await db.delete(notifications).where(eq(notifications.id, id));
    return NextResponse.json({ message: "Notificação removida." });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json({ error: "Erro ao remover notificação." }, { status: 500 });
  }
}
