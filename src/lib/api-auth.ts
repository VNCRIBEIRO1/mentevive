import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";

async function getCookie(name: string): Promise<string | undefined> {
  try {
    return (await cookies()).get(name)?.value;
  } catch {
    return undefined;
  }
}

async function getTenantContext(session: { user: { activeTenantId?: string; membershipRole?: string } }) {
  const tenantId = session.user.activeTenantId || await getCookie("active-tenant-id");
  const role = session.user.membershipRole || await getCookie("membership-role");
  return { tenantId, role };
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: true, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { tenantId, role } = await getTenantContext(session);

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

  const { tenantId, role } = await getTenantContext(session);

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
