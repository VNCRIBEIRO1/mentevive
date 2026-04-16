import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, patients, tenants, tenantMemberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createNotification } from "@/lib/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema, formatZodError } from "@/lib/validations";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { ensureTenantMembership } from "@/lib/tenant-guards";

/**
 * Generate a URL-safe slug from a clinic name.
 * E.g. "Consultório da Bia" → "consultorio-da-bia"
 */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

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

    const { name, email, password, phone, turnstileToken, accountType, clinicName, crp } = parsed.data;
    const tenantSlug = body.tenantSlug as string | undefined;
    const isTherapist = accountType === "therapist";

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Confirmação anti-spam inválida. Tente novamente." },
        { status: 400 }
      );
    }

    // ── Therapist flow: create new tenant ──
    if (isTherapist) {
      // Check if user already exists
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ error: "E-mail já cadastrado. Faça login." }, { status: 409 });
      }

      // Generate unique slug
      let baseSlug = slugify(clinicName!);
      if (!baseSlug) baseSlug = slugify(name);
      let slug = baseSlug;
      let attempt = 0;
      while (true) {
        const [dup] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
        if (!dup) break;
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const [newUser] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        role: "therapist",
        phone: phone || null,
      }).returning();

      // Create tenant
      const [newTenant] = await db.insert(tenants).values({
        slug,
        name: clinicName!,
        ownerUserId: newUser.id,
        plan: "free",
        maxPatients: 50,
        maxAppointmentsPerMonth: 200,
      }).returning();

      // Create admin membership
      await ensureTenantMembership(newTenant.id, newUser.id, "admin");

      return NextResponse.json({
        message: "Conta profissional criada com sucesso!",
        tenantSlug: slug,
        crp: crp || undefined,
      }, { status: 201 });
    }

    // Patient flow: join an existing tenant (tenantSlug is required)
    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant obrigatorio para cadastro de paciente. Use o link do consultorio." },
        { status: 400 }
      );
    }
    const [tenant] = await db.select({ id: tenants.id }).from(tenants)
      .where(and(eq(tenants.slug, tenantSlug), eq(tenants.active, true))).limit(1);
    if (!tenant) {
      return NextResponse.json({ error: "Consultorio nao encontrado." }, { status: 404 });
    }
    const tenantId = tenant.id;

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let userId: string;
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
    }

    // Create tenant membership
    await ensureTenantMembership(tenantId, userId, "patient");

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
      }).where(and(eq(patients.tenantId, tenantId), eq(patients.id, existingPatient.id)));
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
