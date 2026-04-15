import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

function hasValidSetupKey(providedKey: string | null, expectedKey: string | undefined) {
  if (!providedKey || !expectedKey) return false;

  const provided = Buffer.from(providedKey);
  const expected = Buffer.from(expectedKey);

  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  try {
    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json({ error: "Rota de setup indisponível." }, { status: 404 });
    }

    const setupKey = request.headers.get("x-setup-key");
    if (!hasValidSetupKey(setupKey, setupSecret)) {
      return NextResponse.json({ error: "Chave de setup inválida." }, { status: 403 });
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json({ error: "Setup já foi concluído." }, { status: 409 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Admin já existe." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [admin] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      active: true,
    }).returning();

    return NextResponse.json({
      message: "Admin criado com sucesso!",
      user: { id: admin.id, email: admin.email, role: admin.role },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/setup error:", error);
    return NextResponse.json({ error: "Erro ao configurar admin." }, { status: 500 });
  }
}
