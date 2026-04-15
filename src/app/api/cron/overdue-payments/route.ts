import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/db/schema";
import { eq, lt, and, sql } from "drizzle-orm";

/**
 * GET /api/cron/overdue-payments
 *
 * Vercel Cron Job — marks pending payments as overdue when dueDate has passed.
 * Runs daily at 06:00 São Paulo time (configured in vercel.json).
 *
 * Authentication: Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 * In development, the route can be called without the secret.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date in São Paulo timezone
    const todaySP = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    }); // YYYY-MM-DD

    // Bulk update: single query marks all pending payments with past dueDate as overdue
    const result = await db
      .update(payments)
      .set({ status: "overdue" })
      .where(
        and(
          eq(payments.status, "pending"),
          lt(payments.dueDate, todaySP)
        )
      )
      .returning({ id: payments.id });

    const updatedCount = result.length;

    if (updatedCount === 0) {
      return NextResponse.json({
        message: "Nenhum pagamento atrasado encontrado.",
        updated: 0,
      });
    }

    console.log(`Cron: ${updatedCount} pagamento(s) marcado(s) como atrasado(s).`);

    return NextResponse.json({
      message: `${updatedCount} pagamento(s) marcado(s) como atrasado(s).`,
      updated: updatedCount,
    });
  } catch (error) {
    console.error("GET /api/cron/overdue-payments error:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamentos atrasados." },
      { status: 500 }
    );
  }
}
