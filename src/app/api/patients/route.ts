import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, users } from "@/db/schema";
import { ilike, or, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    let query = db.select().from(patients).orderBy(desc(patients.createdAt));

    if (q) {
      query = query.where(
        or(
          ilike(patients.name, `%${q}%`),
          ilike(patients.email, `%${q}%`),
          ilike(patients.phone, `%${q}%`)
        )
      ) as typeof query;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: "Erro ao buscar pacientes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const { name, email, phone, cpf, birthDate, gender, address, emergencyContact, emergencyPhone, notes, createAccount, password } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nome e telefone são obrigatórios." }, { status: 400 });
    }

    let userId: string | null = null;

    // If admin wants to create portal access for the patient
    if (createAccount && email) {
      if (!password || password.length < 8) {
        return NextResponse.json({ error: "Senha de pelo menos 8 caracteres é necessária para criar acesso ao portal." }, { status: 400 });
      }

      const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser) {
        return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "patient",
        phone: phone || null,
      }).returning();
      userId = newUser.id;
    }

    const [newPatient] = await db.insert(patients).values({
      userId,
      name,
      email: email || null,
      phone,
      cpf: cpf || null,
      birthDate: birthDate || null,
      gender: gender || null,
      address: address || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      notes: notes || null,
    }).returning();

    return NextResponse.json({ ...newPatient, hasAccount: !!userId }, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: "Erro ao criar paciente." }, { status: 500 });
  }
}
