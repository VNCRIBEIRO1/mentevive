import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, appointments, payments } from "@/db/schema";
import { eq, ne, count, sum, and, gte, lte, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

function todaySP(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;
    const tenantId = auth.tenantId!;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Active patients count
    const [patientsCount] = await db.select({ count: count() }).from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.active, true)));

    // Month sessions count
    const startStr = startOfMonth.toISOString().split("T")[0];
    const endStr = endOfMonth.toISOString().split("T")[0];
    const [sessionsCount] = await db.select({ count: count() }).from(appointments)
      .where(and(
        eq(appointments.tenantId, tenantId),
        gte(appointments.date, startStr),
        lte(appointments.date, endStr)
      ));

    // Month revenue
    const [revenue] = await db.select({ total: sum(payments.amount) }).from(payments)
      .where(and(
        eq(payments.tenantId, tenantId),
        eq(payments.status, "paid"),
        gte(payments.paidAt, startOfMonth),
        lte(payments.paidAt, endOfMonth)
      ));

    // Upcoming appointments (exclude finished and unavailable statuses)
    const todayStr = todaySP();
    const upcoming = await db
      .select({ appointment: appointments, patientName: patients.name })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.date, todayStr),
          ne(appointments.status, "cancelled"),
          ne(appointments.status, "no_show"),
          ne(appointments.status, "completed")
        )
      )
      .orderBy(appointments.date, appointments.startTime)
      .limit(5);

    // Pending payments
    const pendingPayments = await db
      .select({ payment: payments, patientName: patients.name })
      .from(payments)
      .leftJoin(patients, eq(payments.patientId, patients.id))
      .where(and(eq(payments.tenantId, tenantId), eq(payments.status, "pending")))
      .orderBy(desc(payments.createdAt))
      .limit(5);

    // --- Advanced Stats ---

    // No-show rate (all time)
    const [totalCompleted] = await db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), eq(appointments.status, "completed")));
    const [totalNoShow] = await db.select({ count: count() }).from(appointments).where(and(eq(appointments.tenantId, tenantId), eq(appointments.status, "no_show")));
    const totalFinished = (totalCompleted.count || 0) + (totalNoShow.count || 0);
    const noShowRate = totalFinished > 0 ? Math.round(((totalNoShow.count || 0) / totalFinished) * 100) : 0;

    // Sessions per month (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsStr = sixMonthsAgo.toISOString().split("T")[0];
    const sessionsPerMonth = await db
      .select({
        month: sql<string>`to_char(${appointments.date}::date, 'YYYY-MM')`,
        total: count(),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.date, sixMonthsStr),
          ne(appointments.status, "cancelled")
        )
      )
      .groupBy(sql`to_char(${appointments.date}::date, 'YYYY-MM')`)
      .orderBy(sql`to_char(${appointments.date}::date, 'YYYY-MM')`);

    // Revenue per month (last 6 months)
    const revenuePerMonth = await db
      .select({
        month: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`,
        total: sum(payments.amount),
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.status, "paid"),
          gte(payments.paidAt, sixMonthsAgo)
        )
      )
      .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`);

    // Cancelled this month
    const [cancelledCount] = await db.select({ count: count() }).from(appointments)
      .where(and(
        eq(appointments.tenantId, tenantId),
        gte(appointments.date, startStr),
        lte(appointments.date, endStr),
        eq(appointments.status, "cancelled")
      ));

    return NextResponse.json({
      stats: {
        activePatients: patientsCount.count,
        monthSessions: sessionsCount.count,
        monthRevenue: revenue.total || "0",
        noShowRate,
        cancelledThisMonth: cancelledCount.count || 0,
      },
      upcoming,
      pendingPayments,
      charts: {
        sessionsPerMonth,
        revenuePerMonth,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
