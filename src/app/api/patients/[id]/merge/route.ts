import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  patients,
  appointments,
  clinicalRecords,
  payments,
  documents,
  groupMembers,
  triages,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/patients/[id]/merge
 * Merge sourcePatientId INTO this patient (target).
 * - Transfers all appointments, clinical records, payments, documents, group memberships
 * - Fills empty fields from source into target
 * - Deletes source patient record
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;

    const { id: targetId } = await params;
    const { sourcePatientId } = await req.json();

    if (!sourcePatientId) {
      return NextResponse.json({ error: "sourcePatientId é obrigatório." }, { status: 400 });
    }

    if (targetId === sourcePatientId) {
      return NextResponse.json({ error: "Não é possível mesclar um paciente consigo mesmo." }, { status: 400 });
    }

    // Get both patient records
    const [target] = await db.select().from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.id, targetId)));
    const [source] = await db.select().from(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.id, sourcePatientId)));

    if (!target) return NextResponse.json({ error: "Paciente destino não encontrado." }, { status: 404 });
    if (!source) return NextResponse.json({ error: "Paciente origem não encontrado." }, { status: 404 });

    // --- Transfer related records ---
    const transferResults = {
      appointments: 0,
      clinicalRecords: 0,
      payments: 0,
      documents: 0,
      groupMembers: 0,
    };

    // Transfer appointments
    const apptResult = await db
      .update(appointments)
      .set({ patientId: targetId, updatedAt: new Date() })
      .where(eq(appointments.patientId, sourcePatientId))
      .returning({ id: appointments.id });
    transferResults.appointments = apptResult.length;

    // Transfer clinical records
    const recResult = await db
      .update(clinicalRecords)
      .set({ patientId: targetId, updatedAt: new Date() })
      .where(eq(clinicalRecords.patientId, sourcePatientId))
      .returning({ id: clinicalRecords.id });
    transferResults.clinicalRecords = recResult.length;

    // Transfer payments
    const payResult = await db
      .update(payments)
      .set({ patientId: targetId })
      .where(eq(payments.patientId, sourcePatientId))
      .returning({ id: payments.id });
    transferResults.payments = payResult.length;

    // Transfer documents
    const docResult = await db
      .update(documents)
      .set({ patientId: targetId })
      .where(eq(documents.patientId, sourcePatientId))
      .returning({ id: documents.id });
    transferResults.documents = docResult.length;

    // Transfer group memberships (avoid duplicates — delete source's if target already in group)
    const sourceGroups = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.patientId, sourcePatientId));
    const targetGroups = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.patientId, targetId));
    const targetGroupIds = new Set(targetGroups.map((g) => g.groupId));

    for (const sg of sourceGroups) {
      if (targetGroupIds.has(sg.groupId)) {
        // Target already in group — remove duplicate
        await db.delete(groupMembers).where(eq(groupMembers.id, sg.id));
      } else {
        // Move membership
        await db.update(groupMembers).set({ patientId: targetId }).where(eq(groupMembers.id, sg.id));
        transferResults.groupMembers++;
      }
    }

    // --- Fill empty fields from source into target ---
    const fieldsToMerge: (keyof typeof target)[] = [
      "email", "cpf", "birthDate", "gender", "address",
      "emergencyContact", "emergencyPhone", "notes",
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of fieldsToMerge) {
      if (!target[field] && source[field]) {
        updateData[field] = source[field];
      }
    }

    // If source has userId but target doesn't, inherit it
    if (!target.userId && source.userId) {
      updateData.userId = source.userId;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await db.update(patients).set(updateData).where(eq(patients.id, targetId));
    }

    // --- Deactivate source patient's user account if not inherited ---
    if (source.userId && updateData.userId !== source.userId) {
      // Source user account was NOT inherited by target — deactivate it
      const { users } = await import("@/db/schema");
      await db.update(users).set({ active: false }).where(eq(users.id, source.userId));
    }

    // --- Delete source patient ---
    await db.delete(patients).where(and(eq(patients.tenantId, tenantId), eq(patients.id, sourcePatientId)));

    // Get updated target
    const [updated] = await db.select().from(patients).where(eq(patients.id, targetId));

    return NextResponse.json({
      message: `Paciente "${source.name}" mesclado em "${target.name}" com sucesso.`,
      patient: updated,
      transferred: transferResults,
    });
  } catch (error) {
    console.error("POST /api/patients/[id]/merge error:", error);
    return NextResponse.json({ error: "Erro ao mesclar pacientes." }, { status: 500 });
  }
}
