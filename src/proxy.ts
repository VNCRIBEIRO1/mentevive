import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-secret";

/**
 * Edge Proxy — auth guard for /admin/* and /portal/* routes.
 *
 * Checks JWT token at the edge (before the request reaches the API/page).
 * Redirects unauthenticated users to /login.
 * Checks role-based access for admin routes.
 *
 * Public routes (API webhooks, blog, auth) are NOT affected.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths — API auth, webhook, public pages, static assets,
  // and scheduling data endpoints (used by landing page calendar without auth)
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

  // Admin routes: require admin or therapist role
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token.role !== "admin" && token.role !== "therapist") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
