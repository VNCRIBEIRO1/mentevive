import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }
    return NextResponse.json(patient);
  } catch (error) {
    console.error("GET /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Erro ao buscar paciente." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, cpf, birthDate, gender, address, emergencyContact, emergencyPhone, notes, active } = body;

    const [updated] = await db.update(patients).set({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(cpf !== undefined && { cpf }),
      ...(birthDate !== undefined && { birthDate }),
      ...(gender !== undefined && { gender }),
      ...(address !== undefined && { address }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(emergencyPhone !== undefined && { emergencyPhone }),
      ...(notes !== undefined && { notes }),
      ...(active !== undefined && { active }),
      updatedAt: new Date(),
    }).where(eq(patients.id, id)).returning();

    if (!updated) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Sync linked user record if exists
    if (updated.userId) {
      const userUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (name !== undefined) userUpdates.name = name;
      if (email !== undefined) userUpdates.email = email;
      if (phone !== undefined) userUpdates.phone = phone;
      if (active !== undefined) userUpdates.active = active;
      await db.update(users).set(userUpdates).where(eq(users.id, updated.userId));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar paciente." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;

    // Get patient to check for linked user
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Delete patient (cascade handles related records)
    await db.delete(patients).where(eq(patients.id, id));

    // Deactivate linked user account (preserve audit trail)
    if (patient.userId) {
      await db.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, patient.userId));
    }

    return NextResponse.json({ message: "Paciente removido." });
  } catch (error) {
    console.error("DELETE /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Erro ao remover paciente." }, { status: 500 });
  }
}
