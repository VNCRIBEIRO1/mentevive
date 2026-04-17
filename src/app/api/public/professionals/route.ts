import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenantMemberships, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const revalidate = 300;

export async function GET() {
  try {
    const professionals = await db
      .select({
        name: users.name,
        avatar: users.avatar,
        specialty: users.specialty,
        bio: users.bio,
        crp: users.crp,
        tenantSlug: tenants.slug,
        tenantName: tenants.name,
      })
      .from(users)
      .innerJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.userId, users.id),
          eq(tenantMemberships.role, "admin"),
          eq(tenantMemberships.active, true)
        )
      )
      .innerJoin(
        tenants,
        and(
          eq(tenants.id, tenantMemberships.tenantId),
          eq(tenants.active, true)
        )
      )
      .where(and(eq(users.profileVisible, true), eq(users.active, true)));

    return NextResponse.json(professionals, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("GET /api/public/professionals error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
