import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinicalRecords, patients } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { createClinicalRecordSchema, formatZodError } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const tenantId = auth.tenantId!;

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    const conditions = [];
    conditions.push(eq(clinicalRecords.tenantId, tenantId));
    if (patientId) conditions.push(eq(clinicalRecords.patientId, patientId));

    const result = await db
      .select({
        record: clinicalRecords,
        patientName: patients.name,
      })
      .from(clinicalRecords)
      .leftJoin(patients, eq(clinicalRecords.patientId, patients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(clinicalRecords.sessionDate));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/clinical-records error:", error);
    return NextResponse.json({ error: "Erro ao buscar prontuários." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const parsed = createClinicalRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { patientId, sessionDate, sessionNumber, chiefComplaint, clinicalNotes, interventions, homework, mood, riskAssessment, nextSessionPlan } = parsed.data;

    const [newRecord] = await db.insert(clinicalRecords).values({
      patientId,
      therapistId: auth.session!.user.id,
      sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
      sessionNumber: sessionNumber || null,
      chiefComplaint: chiefComplaint || null,
      clinicalNotes: clinicalNotes || null,
      interventions: interventions || null,
      homework: homework || null,
      mood: mood || null,
      riskAssessment: riskAssessment || null,
      nextSessionPlan: nextSessionPlan || null,
      private: true,
      tenantId: auth.tenantId!,
    }).returning();

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("POST /api/clinical-records error:", error);
    return NextResponse.json({ error: "Erro ao criar prontuário." }, { status: 500 });
  }
}
