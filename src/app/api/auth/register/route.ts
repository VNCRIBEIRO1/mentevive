import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createNotification } from "@/lib/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema, formatZodError } from "@/lib/validations";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 registrations per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(ip, 5, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um momento e tente novamente." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { name, email, password, phone, turnstileToken } = parsed.data;

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Confirmação anti-spam inválida. Tente novamente." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "patient",
      phone: phone || null,
    }).returning();

    // Check if patient record already exists (admin may have pre-created it)
    const [existingPatient] = await db
      .select()
      .from(patients)
      .where(eq(patients.email, email))
      .limit(1);

    let patientId: string | undefined;

    if (existingPatient && !existingPatient.userId) {
      // Link existing patient to new user account
      await db.update(patients).set({
        userId: newUser.id,
        phone: phone || existingPatient.phone,
        updatedAt: new Date(),
      }).where(eq(patients.id, existingPatient.id));
      patientId = existingPatient.id;
    } else if (!existingPatient) {
      // Create new patient record
      const [newPatient] = await db.insert(patients).values({
        userId: newUser.id,
        name,
        email,
        phone: phone || "",
      }).returning();
      patientId = newPatient.id;
    }

    // Notify admin about new registration
    await createNotification({
      type: "registration",
      title: "Novo paciente cadastrado",
      message: `${name} (${email}) se cadastrou no portal.${existingPatient ? " Vinculado a cadastro existente." : ""}`,
      patientId,
      linkUrl: patientId ? `/admin/pacientes/${patientId}` : `/admin/pacientes`,
    });

    return NextResponse.json({ message: "Conta criada com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
