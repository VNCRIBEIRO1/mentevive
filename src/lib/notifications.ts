import { db } from "@/lib/db";
import { notifications } from "@/db/schema";

type CreateNotification = {
  type: "triage" | "appointment" | "payment" | "registration" | "status_change";
  title: string;
  message: string;
  icon?: string;
  linkUrl?: string;
  patientId?: string;
  appointmentId?: string;
  paymentId?: string;
};

/**
 * Helper to create a notification for the admin/therapist.
 * Call from any API route after a relevant action.
 */
export async function createNotification(data: CreateNotification) {
  try {
    await db.insert(notifications).values({
      type: data.type,
      title: data.title,
      message: data.message,
      icon: data.icon || getDefaultIcon(data.type),
      linkUrl: data.linkUrl || null,
      patientId: data.patientId || null,
      appointmentId: data.appointmentId || null,
      paymentId: data.paymentId || null,
    });
  } catch (error) {
    // Never let a notification failure break the main flow
    console.error("Failed to create notification:", error);
  }
}

function getDefaultIcon(type: string): string {
  switch (type) {
    case "triage": return "📋";
    case "appointment": return "📅";
    case "payment": return "💰";
    case "registration": return "👤";
    case "status_change": return "🔄";
    default: return "🔔";
  }
}
