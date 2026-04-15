import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groups } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/api-auth";
import { createGroupSchema, formatZodError } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const result = await db.select().from(groups).orderBy(desc(groups.createdAt));
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/groups error:", error);
    return NextResponse.json({ error: "Erro ao buscar grupos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { name, description, modality, dayOfWeek, time, maxParticipants, price } = parsed.data;

    const [newGroup] = await db.insert(groups).values({
      name,
      description: description || null,
      modality: modality || "online",
      dayOfWeek: dayOfWeek || null,
      time: time || null,
      maxParticipants: maxParticipants || 8,
      price: price !== undefined && price !== null ? String(price) : null,
      active: true,
    }).returning();

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups error:", error);
    return NextResponse.json({ error: "Erro ao criar grupo." }, { status: 500 });
  }
}
