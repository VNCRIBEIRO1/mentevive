import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-secret";

/**
 * Edge Proxy — auth guard for /admin/*, /portal/*, and /select-tenant routes.
 *
 * Multi-tenant aware: checks JWT claims only (no cookie fallback).
 * Subdomain detection: extracts tenant slug from hostname (e.g. psicolobia.mentevive.com.br).
 * Redirects unauthenticated users to /login.
 * Redirects users without a selected tenant to /select-tenant.
 * Checks role-based access for admin routes.
 */

/** Known platform domains (no tenant slug extraction) */
const PLATFORM_HOSTS = new Set([
  "mentevive.vercel.app",
  "localhost",
  "127.0.0.1",
]);

/**
 * Extract tenant slug from subdomain.
 * e.g. "psicolobia.mentevive.com.br" → "psicolobia"
 * Returns empty string for platform-only hosts (no subdomain).
 */
function extractTenantFromHost(hostname: string): string {
  // Strip port if present
  const host = hostname.split(":")[0];

  // Skip known platform hosts
  if (PLATFORM_HOSTS.has(host)) return "";

  // localhost with subdomain: e.g. psicolobia.localhost → psicolobia
  if (host.endsWith(".localhost")) {
    return host.replace(".localhost", "");
  }

  // Custom domain: slug.mentevive.com.br → slug
  // Also handles slug.mentevive.vercel.app (Vercel preview)
  const parts = host.split(".");
  if (parts.length >= 3) {
    // e.g. ["psicolobia", "mentevive", "com", "br"] → slug = "psicolobia"
    // e.g. ["psicolobia", "mentevive", "vercel", "app"] → slug = "psicolobia"
    const slug = parts[0];
    // Avoid extracting "www" or "app" as tenant slug
    if (slug !== "www" && slug !== "app") {
      return slug;
    }
  }

  return "";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Subdomain tenant detection ──
  // If the hostname has a tenant subdomain AND the URL doesn't have ?tenant= yet,
  // inject it into the URL for login/registro pages so client components can read it.
  const subdomainSlug = extractTenantFromHost(request.nextUrl.hostname);
  if (subdomainSlug && (pathname === "/login" || pathname === "/registro")) {
    const existingTenant = request.nextUrl.searchParams.get("tenant");
    if (!existingTenant) {
      const url = request.nextUrl.clone();
      url.searchParams.set("tenant", subdomainSlug);
      return NextResponse.redirect(url);
    }
  }

  // Skip public paths
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
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
    pathname === "/registro"
  ) {
    // Even for public paths, set tenant header from subdomain if available
    if (subdomainSlug) {
      const response = NextResponse.next();
      response.headers.set("x-tenant-slug", subdomainSlug);
      return response;
    }
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

  // Tenant context: JWT claims only (no cookie fallback for security)
  const activeTenantId = token.activeTenantId as string | undefined;
  const membershipRole = token.membershipRole as string | undefined;

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
  if (subdomainSlug) {
    response.headers.set("x-tenant-slug", subdomainSlug);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
