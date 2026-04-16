import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, patients, payments } from "@/db/schema";
import { eq, ne, and, lt, gt } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";
import { requireAdmin, requireAuth } from "@/lib/api-auth";
import { buildMeetingUrl } from "@/lib/jitsi";
import { updateAppointmentSchema, formatZodError } from "@/lib/validations";
import { getSessionPrice } from "@/lib/session-pricing";
import { isStripeConfigured } from "@/lib/stripe";
import { getTenantPatientForUser } from "@/lib/tenant-guards";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const { id } = await params;
    const tenantId = auth.tenantId!;
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id)));

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const role = auth.role || auth.session!.user.membershipRole || auth.session!.user.role;
    if (role === "admin" || role === "therapist") {
      return NextResponse.json(appointment);
    }

    const patient = await getTenantPatientForUser(tenantId, auth.session!.user.id);
    if (!patient || appointment.patientId !== patient.id) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("GET /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamento." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { date, startTime, endTime, modality, status, notes, meetingUrl, therapistFeedback } = parsed.data;
    const tenantId = auth.tenantId!;

    const [current] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id)));
    if (!current) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const effectiveDate = date || current.date;
    const effectiveStart = startTime || current.startTime;
    const effectiveEnd = endTime || current.endTime;
    const effectiveModality = modality || current.modality || "online";

    if (startTime !== undefined || endTime !== undefined) {
      if (effectiveStart >= effectiveEnd) {
        return NextResponse.json({ error: "O horário final deve ser maior que o inicial." }, { status: 400 });
      }
    }

    if (date !== undefined || startTime !== undefined || endTime !== undefined) {
      const overlapping = await db
        .select({ id: appointments.id, startTime: appointments.startTime, endTime: appointments.endTime })
        .from(appointments)
        .where(
          and(
            eq(appointments.tenantId, tenantId),
            eq(appointments.date, effectiveDate),
            ne(appointments.status, "cancelled"),
            ne(appointments.id, id),
            lt(appointments.startTime, effectiveEnd),
            gt(appointments.endTime, effectiveStart)
          )
        )
        .limit(1);

      if (overlapping.length > 0) {
        const conflict = overlapping[0];
        return NextResponse.json({
          error: `Conflito de horário: já existe um agendamento das ${conflict.startTime} às ${conflict.endTime} nessa data.`,
        }, { status: 409 });
      }
    }

    let finalMeetingUrl = meetingUrl;
    if (
      status === "confirmed" &&
      current.status !== "confirmed" &&
      !current.meetingUrl &&
      effectiveModality === "online"
    ) {
      finalMeetingUrl = buildMeetingUrl(id);
    }

    if (effectiveModality === "presencial") {
      finalMeetingUrl = null;
    }

    const [updated] = await db.update(appointments).set({
      ...(date !== undefined && { date }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(modality !== undefined && { modality }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(finalMeetingUrl !== undefined && { meetingUrl: finalMeetingUrl }),
      ...(therapistFeedback !== undefined && { therapistFeedback }),
      updatedAt: new Date(),
    }).where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id))).returning();

    if (!updated) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    if (status !== undefined && current.status !== status) {
      const statusLabels: Record<string, string> = {
        pending: "Pendente",
        confirmed: "Confirmada",
        cancelled: "Cancelada",
        completed: "Realizada",
        no_show: "Não compareceu",
      };
      const [pat] = await db
        .select({ name: patients.name })
        .from(patients)
        .where(and(eq(patients.tenantId, tenantId), eq(patients.id, updated.patientId)));

      await createNotification({
        type: "status_change",
        title: `Sessão ${statusLabels[status] || status}`,
        message: `Sessão de ${pat?.name || "paciente"} em ${updated.date} atualizada: ${statusLabels[current.status] || current.status} → ${statusLabels[status] || status}.`,
        patientId: updated.patientId,
        appointmentId: updated.id,
        linkUrl: `/admin/agenda`,
        tenantId,
      });

      if (status === "cancelled" && current.status !== "cancelled") {
        try {
          const linkedPayments = await db
            .select({ id: payments.id, status: payments.status })
            .from(payments)
            .where(and(eq(payments.tenantId, tenantId), eq(payments.appointmentId, updated.id)));

          for (const lp of linkedPayments) {
            if (lp.status === "pending" || lp.status === "overdue") {
              await db
                .update(payments)
                .set({ status: "cancelled" })
                .where(and(eq(payments.tenantId, tenantId), eq(payments.id, lp.id)));
            }
          }
        } catch (cancelErr) {
          console.error("Cancel linked payments error:", cancelErr);
        }
      }

      if (status === "confirmed" && current.status !== "confirmed") {
        try {
          const [existingLinkedPayment] = await db
            .select({ id: payments.id })
            .from(payments)
            .where(and(eq(payments.tenantId, tenantId), eq(payments.appointmentId, updated.id)))
            .limit(1);

          if (!existingLinkedPayment) {
            const amount = await getSessionPrice(tenantId, effectiveModality as "online" | "presencial");
            const modalityLabel = effectiveModality === "presencial" ? "presencial" : "online";

            if (amount > 0) {
              const [newPayment] = await db.insert(payments).values({
                patientId: updated.patientId,
                appointmentId: updated.id,
                amount: amount.toFixed(2),
                method: isStripeConfigured() ? "stripe" : "pix",
                status: "pending",
                dueDate: updated.date,
                description: `Sessão ${modalityLabel} - ${updated.date}`,
                tenantId,
              }).returning();

              if (newPayment) {
                await createNotification({
                  type: "payment",
                  title: "Cobrança criada automaticamente",
                  message: `Cobrança de R$ ${amount.toFixed(2)} criada para ${pat?.name || "paciente"} (sessão confirmada em ${updated.date}).`,
                  patientId: updated.patientId,
                  paymentId: newPayment.id,
                  linkUrl: `/admin/financeiro`,
                  tenantId,
                });
              }
            }
          }
        } catch (payErr) {
          console.error("Auto-create payment error:", payErr);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar agendamento." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const tenantId = auth.tenantId!;

    try {
      const linkedPayments = await db
        .select({ id: payments.id, status: payments.status })
        .from(payments)
        .where(and(eq(payments.tenantId, tenantId), eq(payments.appointmentId, id)));

      for (const lp of linkedPayments) {
        if (lp.status === "pending" || lp.status === "overdue") {
          await db.update(payments)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(and(eq(payments.tenantId, tenantId), eq(payments.id, lp.id)));
        }
      }

      await db
        .update(payments)
        .set({ appointmentId: null, updatedAt: new Date() })
        .where(and(eq(payments.tenantId, tenantId), eq(payments.appointmentId, id)));
    } catch (payErr) {
      console.error("Cancel linked payments on delete error:", payErr);
    }

    const [deleted] = await db
      .delete(appointments)
      .where(and(eq(appointments.tenantId, tenantId), eq(appointments.id, id)))
      .returning();
    if (!deleted) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Agendamento removido." });
  } catch (error) {
    console.error("DELETE /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Erro ao remover agendamento." }, { status: 500 });
  }
}
