import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenantMemberships, tenants } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { tenantSlug } = await request.json();
    if (!tenantSlug || typeof tenantSlug !== "string") {
      return NextResponse.json({ error: "Slug do consultório é obrigatório." }, { status: 400 });
    }

    // Find membership for this tenant
    const [membership] = await db
      .select({
        tenantId: tenantMemberships.tenantId,
        role: tenantMemberships.role,
        slug: tenants.slug,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
      .where(
        and(
          eq(tenantMemberships.userId, session.user.id),
          eq(tenants.slug, tenantSlug),
          eq(tenantMemberships.active, true),
          eq(tenants.active, true),
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Acesso negado a este consultório." }, { status: 403 });
    }

    // Set tenant context cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };

    const response = NextResponse.json({
      success: true,
      tenantId: membership.tenantId,
      role: membership.role,
      slug: membership.slug,
    });

    response.cookies.set("active-tenant-id", membership.tenantId, cookieOptions);
    response.cookies.set("active-tenant-slug", membership.slug, cookieOptions);
    response.cookies.set("membership-role", membership.role, cookieOptions);

    return response;
  } catch (error) {
    console.error("Select tenant error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // List all active memberships for the user
    const memberships = await db
      .select({
        tenantId: tenantMemberships.tenantId,
        role: tenantMemberships.role,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
      .where(
        and(
          eq(tenantMemberships.userId, session.user.id),
          eq(tenantMemberships.active, true),
          eq(tenants.active, true),
        )
      );

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("List memberships error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
