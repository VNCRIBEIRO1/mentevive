import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { id } = await params;
    const { email, password, linkExisting } = await req.json();

    // Get the patient record
    const [patient] = await db.select().from(patients).where(and(eq(patients.tenantId, auth.tenantId!), eq(patients.id, id)));
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    if (patient.userId) {
      return NextResponse.json({ error: "Este paciente já possui acesso ao portal." }, { status: 409 });
    }

    const accountEmail = email || patient.email;
    if (!accountEmail) {
      return NextResponse.json({ error: "E-mail é obrigatório para criar acesso." }, { status: 400 });
    }

    // Check if user with this email already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, accountEmail)).limit(1);

    if (existingUser) {
      // --- MODE: Link existing account ---
      if (linkExisting) {
        if (existingUser.role !== "patient") {
          return NextResponse.json({ error: "Esta conta não é de paciente e não pode ser vinculada." }, { status: 400 });
        }
        // Check if another patient is already linked to this user
        const [otherPatient] = await db
          .select({ id: patients.id, name: patients.name })
          .from(patients)
          .where(and(eq(patients.userId, existingUser.id)))
          .limit(1);

        if (otherPatient) {
          return NextResponse.json({
            error: "existing_linked",
            message: `Esta conta já está vinculada ao paciente "${otherPatient.name}".`,
            linkedPatientId: otherPatient.id,
            linkedPatientName: otherPatient.name,
          }, { status: 409 });
        }

        // Link user to this patient
        await db.update(patients).set({
          userId: existingUser.id,
          email: accountEmail,
          updatedAt: new Date(),
        }).where(eq(patients.id, id));

        return NextResponse.json({
          message: "Conta existente vinculada com sucesso!",
          userId: existingUser.id,
          linked: true,
        }, { status: 200 });
      }

      // --- MODE: Inform frontend about existing account ---
      return NextResponse.json({
        error: "existing_account",
        existingUserName: existingUser.name,
        existingUserId: existingUser.id,
        existingUserRole: existingUser.role,
      }, { status: 409 });
    }

    // --- MODE: Create new account ---
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Senha com pelo menos 8 caracteres é obrigatória." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [newUser] = await db.insert(users).values({
      name: patient.name,
      email: accountEmail,
      password: hashedPassword,
      role: "patient",
      phone: patient.phone || null,
    }).returning();

    // Link user to patient and sync email
    await db.update(patients).set({
      userId: newUser.id,
      email: accountEmail,
      updatedAt: new Date(),
    }).where(eq(patients.id, id));

    return NextResponse.json({ message: "Acesso ao portal criado com sucesso!", userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients/[id]/create-account error:", error);
    return NextResponse.json({ error: "Erro ao criar acesso." }, { status: 500 });
  }
}
