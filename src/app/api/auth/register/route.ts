import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, patients, tenants, tenantMemberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
    const tenantSlug = body.tenantSlug as string | undefined;

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Confirmação anti-spam inválida. Tente novamente." },
        { status: 400 }
      );
    }

    // Resolve tenant
    let tenantId: string;
    if (tenantSlug) {
      const [tenant] = await db.select({ id: tenants.id }).from(tenants)
        .where(and(eq(tenants.slug, tenantSlug), eq(tenants.active, true))).limit(1);
      if (!tenant) {
        return NextResponse.json({ error: "Consultório não encontrado." }, { status: 404 });
      }
      tenantId = tenant.id;
    } else {
      // Fallback: use the first (default) tenant
      const [defaultTenant] = await db.select({ id: tenants.id }).from(tenants)
        .where(eq(tenants.active, true)).limit(1);
      if (!defaultTenant) {
        return NextResponse.json({ error: "Nenhum consultório disponível." }, { status: 500 });
      }
      tenantId = defaultTenant.id;
    }

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let userId: string;
    let isNewUser = false;

    if (existing.length > 0) {
      userId = existing[0].id;
      // Check if user already has membership in this tenant
      const [existingMembership] = await db.select().from(tenantMemberships)
        .where(and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.tenantId, tenantId),
        )).limit(1);
      if (existingMembership) {
        return NextResponse.json({ error: "Você já tem conta neste consultório. Faça login." }, { status: 409 });
      }
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "patient",
        phone: phone || null,
      }).returning();
      userId = newUser.id;
      isNewUser = true;
    }

    // Create tenant membership
    await db.insert(tenantMemberships).values({
      userId,
      tenantId,
      role: "patient",
    });

    // Check if patient record already exists for this tenant
    const [existingPatient] = await db
      .select()
      .from(patients)
      .where(and(eq(patients.email, email), eq(patients.tenantId, tenantId)))
      .limit(1);

    let patientId: string | undefined;

    if (existingPatient && !existingPatient.userId) {
      // Link existing patient to user account
      await db.update(patients).set({
        userId,
        phone: phone || existingPatient.phone,
        updatedAt: new Date(),
      }).where(eq(patients.id, existingPatient.id));
      patientId = existingPatient.id;
    } else if (!existingPatient) {
      // Create new patient record
      const [newPatient] = await db.insert(patients).values({
        userId,
        tenantId,
        name,
        email,
        phone: phone || "",
      }).returning();
      patientId = newPatient.id;
    }

    // Notify admin about new registration
    await createNotification({
      tenantId,
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
