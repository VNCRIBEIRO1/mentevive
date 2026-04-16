import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

function getTenantContext(session: { user: { activeTenantId?: string; membershipRole?: string } }) {
  const tenantId = session.user.activeTenantId;
  const role = session.user.membershipRole;
  return { tenantId, role };
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { tenantId, role } = getTenantContext(session);

  if (!tenantId) {
    return { error: true, response: NextResponse.json({ error: "Nenhum consultório selecionado." }, { status: 403 }) };
  }
  if (role !== "admin" && role !== "therapist") {
    return { error: true, response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) };
  }
  return { error: false, session, tenantId, role };
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { tenantId, role } = getTenantContext(session);

  if (!tenantId) {
    return { error: true, response: NextResponse.json({ error: "Nenhum consultório selecionado." }, { status: 403 }) };
  }
  return { error: false, session, tenantId, role };
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  if (!session.user?.isSuperAdmin) {
    return { error: true, response: NextResponse.json({ error: "Acesso negado." }, { status: 403 }) };
  }
  return { error: false, session };
}
