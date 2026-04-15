import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-secret";

/**
 * Edge Proxy — auth guard for /admin/*, /portal/*, and /select-tenant routes.
 *
 * Multi-tenant aware: checks JWT + tenant cookies.
 * Redirects unauthenticated users to /login.
 * Redirects users without a selected tenant to /select-tenant.
 * Checks role-based access for admin routes.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/contact") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/portal/availability") ||
    pathname.startsWith("/api/portal/booked-slots") ||
    pathname.startsWith("/api/portal/settings") ||
    pathname.startsWith("/api/portal/blocked-dates") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname.startsWith("/blog")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  });

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Tenant context: JWT activeTenantId or cookie fallback
  const activeTenantId =
    token.activeTenantId || request.cookies.get("active-tenant-id")?.value;
  const membershipRole =
    token.membershipRole || request.cookies.get("membership-role")?.value;

  // Allow select-tenant page even without active tenant
  if (pathname === "/select-tenant") {
    // If already has tenant selected, redirect to appropriate dashboard
    if (activeTenantId && membershipRole) {
      const dest = membershipRole === "patient" ? "/portal" : "/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // Super admin routes don't require tenant selection
  if (pathname.startsWith("/super")) {
    if (!token.isSuperAdmin) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.next();
  }

  // Require tenant selection for all protected routes
  if (!activeTenantId) {
    if (token.needsTenantSelection) {
      return NextResponse.redirect(new URL("/select-tenant", request.url));
    }
    // No tenant and no memberships → back to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: require admin or therapist membership role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (membershipRole !== "admin" && membershipRole !== "therapist") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  // Inject tenant headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-tenant-id", activeTenantId);
  if (membershipRole) {
    response.headers.set("x-membership-role", membershipRole);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
