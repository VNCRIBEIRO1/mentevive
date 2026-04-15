import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  addCustomAvailabilitySlot,
  getCustomAvailability,
  listUpcomingCustomAvailability,
  removeCustomAvailabilitySlot,
} from "@/lib/custom-availability";

function minutesBetween(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");

    const rows = from
      ? await listUpcomingCustomAvailability(auth.tenantId!, from)
      : await getCustomAvailability(auth.tenantId!);

    return NextResponse.json(date ? rows.filter((slot) => slot.date === date) : rows);
  } catch (error) {
    console.error("GET /api/custom-availability error:", error);
    return NextResponse.json({ error: "Erro ao buscar horários personalizados." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const body = await req.json();
    const { date, startTime, endTime } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: "Data, início e fim são obrigatórios." }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "O horário final precisa ser maior que o inicial." }, { status: 400 });
    }

    if (minutesBetween(startTime, endTime) < 60) {
      return NextResponse.json({ error: "Cada horário disponível precisa ter pelo menos 60 minutos." }, { status: 400 });
    }

    const rows = await addCustomAvailabilitySlot(auth.tenantId!, { date, startTime, endTime });
    return NextResponse.json(rows, { status: 201 });
  } catch (error) {
    console.error("POST /api/custom-availability error:", error);
    return NextResponse.json({ error: "Erro ao salvar horário personalizado." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do horário personalizado é obrigatório." }, { status: 400 });
    }

    const rows = await removeCustomAvailabilitySlot(auth.tenantId!, id);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("DELETE /api/custom-availability error:", error);
    return NextResponse.json({ error: "Erro ao remover horário personalizado." }, { status: 500 });
  }
}
