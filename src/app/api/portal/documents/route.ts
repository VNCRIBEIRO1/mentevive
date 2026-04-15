import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { documents, patients } from "@/db/schema";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.response;

    const userId = auth.session!.user.id;

    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, userId))
      .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: "Registro de paciente não encontrado." },
        { status: 404 }
      );
    }

    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.patientId, patient.id))
      .orderBy(desc(documents.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/portal/documents error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar documentos e notas." },
      { status: 500 }
    );
  }
}
