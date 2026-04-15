import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateWebhookSignature, mapStripeStatus } from "@/lib/stripe";
import { createNotification } from "@/lib/notifications";
import { buildMeetingUrl } from "@/lib/jitsi";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events.
 * This endpoint is PUBLIC — no auth guard.
 * Validates signature via Stripe SDK.
 *
 * Handles: checkout.session.completed, checkout.session.expired,
 *          payment_intent.succeeded, charge.refunded
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // Validate webhook signature — fail closed in production
    let event = validateWebhookSignature(body, signature);

    if (!event) {
      if (process.env.NODE_ENV === "development" && !process.env.STRIPE_WEBHOOK_SECRET) {
        // Dev-only: parse raw body for local testing without Stripe CLI
        try {
          event = JSON.parse(body);
          console.warn("⚠️ Stripe webhook: signature skipped (dev mode only)");
        } catch {
          return NextResponse.json({ error: "Invalid event body" }, { status: 400 });
        }
      } else {
        // Production: reject unverified webhooks
        console.error("Stripe webhook signature verification failed");
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 401 });
      }
    }

    // Parse event type
    const eventType = event?.type || "";
    const eventObj = event as unknown as Record<string, unknown>;
    const eventData = (eventObj?.data as Record<string, unknown>)?.object as Record<string, unknown> | undefined;

    if (!eventData) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle checkout.session.completed
    if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
      const paymentId = (eventData.client_reference_id as string) || "";
      const paymentStatus = (eventData.payment_status as string) || "unpaid";
      const paymentIntentId = typeof eventData.payment_intent === "string"
        ? eventData.payment_intent
        : (eventData.payment_intent as Record<string, unknown>)?.id as string || "";

      if (!paymentId) {
        console.error("Stripe webhook: no client_reference_id found");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const [existingPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!existingPayment) {
        console.error("Payment not found for client_reference_id:", paymentId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const newStatus = mapStripeStatus(paymentStatus);

      // Idempotency: skip if already up-to-date
      if (
        existingPayment.stripePaymentIntentId === paymentIntentId &&
        existingPayment.status === newStatus &&
        existingPayment.stripeStatus === paymentStatus
      ) {
        return NextResponse.json({ received: true, updated: false }, { status: 200 });
      }

      const updateData: Record<string, unknown> = {
        stripePaymentIntentId: paymentIntentId,
        stripeStatus: paymentStatus,
        status: newStatus,
      };

      if (newStatus === "paid" && !existingPayment.paidAt) {
        updateData.paidAt = new Date();
      }

      await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, existingPayment.id));

      // Auto-confirm appointment when payment is successful
      if (newStatus === "paid" && existingPayment.appointmentId) {
        try {
          const [apt] = await db
            .select({ id: appointments.id, status: appointments.status, modality: appointments.modality, meetingUrl: appointments.meetingUrl })
            .from(appointments)
            .where(eq(appointments.id, existingPayment.appointmentId))
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
          console.error("Webhook auto-confirm appointment error:", confirmErr);
        }
      }

      // Notification
      const statusLabels: Record<string, string> = {
        paid: "✅ Pagamento aprovado",
        pending: "⏳ Pagamento pendente",
        cancelled: "❌ Pagamento cancelado",
        refunded: "🔄 Pagamento reembolsado",
      };

      await createNotification({
        type: "payment",
        title: statusLabels[newStatus] || "Atualização de pagamento",
        message: `Pagamento de R$ ${existingPayment.amount} atualizado via Stripe (${paymentStatus}).`,
        icon: newStatus === "paid" ? "💰" : newStatus === "cancelled" ? "❌" : "🔄",
        linkUrl: "/admin/financeiro",
        patientId: existingPayment.patientId,
        paymentId: existingPayment.id,
      });
    }

    // Handle checkout.session.expired
    if (eventType === "checkout.session.expired") {
      const paymentId = (eventData.client_reference_id as string) || "";
      if (paymentId) {
        // Clear expired checkout URL so a new one can be generated
        await db
          .update(payments)
          .set({
            checkoutUrl: null,
            stripeSessionId: null,
            stripeStatus: "expired",
          })
          .where(eq(payments.id, paymentId));
      }
    }

    // Handle charge.refunded
    if (eventType === "charge.refunded") {
      const paymentIntentId = (eventData.payment_intent as string) || "";
      if (paymentIntentId) {
        await db
          .update(payments)
          .set({
            status: "refunded",
            stripeStatus: "refunded",
          })
          .where(eq(payments.stripePaymentIntentId, paymentIntentId));
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    // Always return 200 to prevent Stripe retry floods
    console.error("POST /api/stripe/webhook error:", error);
    return NextResponse.json({ received: true, error: "internal" }, { status: 200 });
  }
}
