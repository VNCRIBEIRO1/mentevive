import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { payments, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCheckoutSession, mapStripeStatus, isStripeConfigured } from "@/lib/stripe";
import { getAuthorizedPayment } from "@/lib/payment-access";
import { buildMeetingUrl } from "@/lib/jitsi";

/**
 * GET /api/stripe/status?paymentId=<uuid>
 *
 * On-demand payment status check from the Stripe API.
 * Useful when a patient returns from checkout and wants to verify.
 * Also updates the local payment record if the status has changed.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe não está configurado." },
        { status: 503 }
      );
    }

    const paymentId = req.nextUrl.searchParams.get("paymentId");
    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId é obrigatório." },
        { status: 400 }
      );
    }

    const access = await getAuthorizedPayment(paymentId, auth.session!.user, auth.tenantId!);
    if (access.reason === "not_found") {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }
    if (access.reason === "forbidden") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const payment = access.payment!;

    // If no Stripe session ID, we can't check Stripe status
    if (!payment.stripeSessionId) {
      return NextResponse.json({
        status: payment.status,
        stripeStatus: null,
        paymentMethod: payment.method,
        amount: Number(payment.amount),
        message: "Pagamento sem sessão do Stripe.",
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
        checkoutUrl: payment.checkoutUrl,
        description: payment.description,
      });
    }

    // Fetch from Stripe API
    const stripeSession = await getCheckoutSession(payment.stripeSessionId);
    if (!stripeSession) {
      return NextResponse.json({
        status: payment.status,
        stripeStatus: payment.stripeStatus,
        paymentMethod: payment.method,
        amount: Number(payment.amount),
        message: "Não foi possível consultar o Stripe.",
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
        checkoutUrl: payment.checkoutUrl,
        description: payment.description,
      });
    }

    // Update local record if status changed
    const newStatus = mapStripeStatus(stripeSession.status);
    if (payment.status !== newStatus || payment.stripeStatus !== stripeSession.status) {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        stripeStatus: stripeSession.status,
        stripePaymentIntentId: stripeSession.paymentIntentId || payment.stripePaymentIntentId,
      };

      if (newStatus === "paid" && !payment.paidAt) {
        updateData.paidAt = new Date();
      }

      await db.update(payments).set(updateData).where(eq(payments.id, paymentId));

      // Auto-confirm appointment when payment becomes paid
      if (newStatus === "paid" && payment.appointmentId) {
        try {
          const [apt] = await db
            .select({ id: appointments.id, status: appointments.status, modality: appointments.modality, meetingUrl: appointments.meetingUrl })
            .from(appointments)
            .where(eq(appointments.id, payment.appointmentId))
            .limit(1);

          if (apt && apt.status === "pending") {
            const confirmData: Record<string, unknown> = {
              status: "confirmed",
              updatedAt: new Date(),
            };
            if (apt.modality === "online" && !apt.meetingUrl) {
              confirmData.meetingUrl = buildMeetingUrl(apt.id);
            }
            await db.update(appointments).set(confirmData).where(eq(appointments.id, apt.id));
          }
        } catch (confirmErr) {
          console.error("Status check auto-confirm appointment error:", confirmErr);
        }
      }
    }

    return NextResponse.json({
      status: newStatus,
      stripeStatus: stripeSession.status,
      paymentMethod: stripeSession.paymentMethod,
      amount: stripeSession.amount,
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
      checkoutUrl: payment.checkoutUrl,
      description: payment.description,
    });
  } catch (error) {
    console.error("GET /api/stripe/status error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status do pagamento." },
      { status: 500 }
    );
  }
}
