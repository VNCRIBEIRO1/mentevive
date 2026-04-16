import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.response;

  const tenantId = auth.tenantId!;

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.userId, auth.session!.user.id), eq(patients.tenantId, tenantId)),
    columns: { consentAcceptedAt: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ consentAcceptedAt: patient.consentAcceptedAt });
}

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.response;

  const tenantId = auth.tenantId!;

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.userId, auth.session!.user.id), eq(patients.tenantId, tenantId)),
    columns: { id: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  await db
    .update(patients)
    .set({ consentAcceptedAt: new Date() })
    .where(and(eq(patients.tenantId, tenantId), eq(patients.id, patient.id)));

  return NextResponse.json({ ok: true });
}
