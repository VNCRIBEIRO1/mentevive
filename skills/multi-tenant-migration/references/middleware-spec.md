# Middleware Spec — Strategy C (Central Platform Route Guards)

## Current State (`src/proxy.ts`)

- Edge function using `next-auth/jwt` `getToken()`
- Guards `/admin/*` and `/portal/*` 
- Role-based: admin routes require `admin` or `therapist`
- Public: auth, webhook, blog, contact, setup, cron, availability, booked-slots, settings, blocked-dates

## Key Difference from Strategy A

**No subdomain parsing.** In Strategy C, the central platform lives on `app.MenteVive.com.br` — a single domain. Tenant context comes from the JWT session (set at login), not from the hostname.

## Target State

### Middleware Flow

```
Request → Check Path → Auth Required?
                          │ No → Pass through
                          │ Yes → Check JWT
                                   │ No JWT → Redirect /login
                                   │ Has JWT → Check tenant context
                                                │ /super/* → require isSuperAdmin
                                                │ /admin/* → require activeTenantId + role=admin|therapist
                                                │ /portal/* → require activeTenantId + role=patient
                                                │ needsTenantSelection → Redirect /select-tenant
```

### Updated Proxy Function

```typescript
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- PUBLIC PATHS (no auth needed) ---
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // --- AUTH CHECK ---
  const token = await getToken({ req: request, secret: getAuthSecret() });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- SUPERADMIN ROUTES ---
  if (pathname.startsWith("/super")) {
    if (!token.isSuperAdmin) {
      return new NextResponse("Acesso restrito", { status: 403 });
    }
    return NextResponse.next();
  }

  // --- TENANT SELECTION CHECK ---
  // Read activeTenantId from JWT or cookie
  const activeTenantId = token.activeTenantId
    || request.cookies.get("active-tenant-id")?.value;

  const membershipRole = token.membershipRole
    || request.cookies.get("membership-role")?.value;

  if (!activeTenantId && (pathname.startsWith("/admin") || pathname.startsWith("/portal"))) {
    // No tenant selected → redirect to tenant picker
    return NextResponse.redirect(new URL("/select-tenant", request.url));
  }

  // --- ROLE GUARDS ---
  if (pathname.startsWith("/admin")) {
    if (membershipRole !== "admin" && membershipRole !== "therapist") {
      return new NextResponse("Acesso restrito ao painel administrativo", { status: 403 });
    }
  }

  if (pathname.startsWith("/portal")) {
    // All membership roles can access portal (patients, but also admin viewing portal)
    // OR restrict: if (membershipRole !== "patient") ...
  }

  // --- INJECT TENANT HEADER FOR API ROUTES ---
  const response = NextResponse.next();
  if (activeTenantId) {
    response.headers.set("x-tenant-id", activeTenantId);
  }
  return response;
}
```

### Public Paths

```typescript
function isPublicPath(pathname: string): boolean {
  const publicPrefixes = [
    "/api/auth",
    "/api/stripe/webhook",
    "/api/contact",
    "/api/cron",
    "/login",
    "/registro",
    "/redefinir-senha",
    "/select-tenant",    // NEW: tenant picker is semi-public (requires auth but no tenant)
  ];

  const publicExact = [
    "/",
    "/robots.txt",
    "/sitemap.xml",
  ];

  return publicPrefixes.some(p => pathname.startsWith(p))
    || publicExact.includes(pathname)
    || pathname.startsWith("/_next")
    || pathname.startsWith("/api/portal/availability")
    || pathname.startsWith("/api/portal/booked-slots")
    || pathname.startsWith("/api/portal/settings")
    || pathname.startsWith("/api/portal/blocked-dates");
}
```

### Tenant Resolution for Public API Routes

Public API routes (availability, settings, etc.) need tenant context from a query parameter since they don't have a JWT:

```typescript
// In public API routes:
// GET /api/portal/availability?tenant=psicolobia
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenant");
  if (!tenantSlug) return error("tenant parameter required");

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.slug, tenantSlug), eq(tenants.active, true)))
    .limit(1);

  if (!tenant) return error("Consultório não encontrado");

  // Use tenant.id for queries
  const slots = await db.select()
    .from(availability)
    .where(eq(availability.tenantId, tenant.id));

  return json(slots);
}
```

### Login Page — Tenant Slug Passthrough

The login page reads `?tenant=SLUG` and passes it through the auth flow:

```
Client's site: psicolobia.com.br → [Entrar]
→ app.MenteVive.com.br/login?tenant=psicolobia
→ Login form includes hidden input: tenantSlug = "psicolobia"
→ On submit: NextAuth credentials include tenantSlug
→ authorize() uses tenantSlug to auto-select membership
```

## What's NOT Needed (vs Strategy A)

- ❌ No subdomain parsing from `Host` header
- ❌ No wildcard DNS configuration
- ❌ No tenant cache at edge (KV store)
- ❌ No custom domain → tenant lookup in middleware
- ❌ No `x-tenant-id` header injection from hostname

## What IS Needed

- ✅ JWT/cookie-based tenant context reading
- ✅ Redirect to `/select-tenant` if no active tenant
- ✅ `/super/*` route guard for superadmin
- ✅ Public API routes accept `?tenant=SLUG` parameter
- ✅ Login page reads `?tenant=SLUG` for pre-selection

  // --- AUTH CHECK ---
  const token = await getToken({ req: request, secret: getAuthSecret() });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- TENANT VALIDATION ---
  // If on a tenant subdomain, verify JWT tenant matches
  if (tenantId && token.tenantId !== tenantId) {
    // User is authenticated but for a different tenant
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // --- SUPER ADMIN ROUTES ---
  if (pathname.startsWith("/super") || pathname.startsWith("/api/super")) {
    if (token.role !== "superadmin") {
      return new NextResponse("Acesso negado", { status: 403 });
    }
    return NextResponse.next();
  }

  // --- ADMIN ROUTES ---
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (token.role !== "admin" && token.role !== "therapist") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  const response = NextResponse.next();
  if (tenantId) response.headers.set("x-tenant-id", tenantId);
  return response;
}
```

### Development Mode

For `localhost:3000` (no subdomain possible):
- Use `x-tenant-slug` header in dev requests
- Or default to first tenant in DB
- Or use query param `?tenant=bia`

```typescript
if (process.env.NODE_ENV === "development" && !slug) {
  const devSlug = request.headers.get("x-tenant-slug") 
    || request.nextUrl.searchParams.get("tenant")
    || "bia"; // default dev tenant
  // resolve tenant from devSlug
}
```

### Edge Runtime Compatibility

The middleware runs at Vercel Edge. Constraints:
- No Node.js APIs (crypto, fs, etc.)
- DB access: use `@neondatabase/serverless` (already in project, works at edge)
- Keep tenant lookup minimal (cache aggressively)
- `getToken()` from next-auth already works at edge

### Vercel Configuration

```json
// vercel.json — add wildcard domain
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
```

Vercel project settings:
1. Add `*.psicolobia.com.br` as wildcard domain
2. Add `psicolobia.com.br` as root domain
3. DNS: A/AAAA records pointing to Vercel + CNAME `*` to `cname.vercel-dns.com`

### Public Routes That Need Tenant Context

These routes are currently public (no auth) but MUST be tenant-scoped:

| Route | How to get tenant |
|-------|-------------------|
| `GET /api/portal/availability` | From `x-tenant-id` header (set by middleware) |
| `GET /api/portal/booked-slots` | From `x-tenant-id` header |
| `GET /api/portal/settings` | From `x-tenant-id` header |
| `GET /api/portal/blocked-dates` | From `x-tenant-id` header |
| `GET /api/blog` | From `x-tenant-id` header |
| `POST /api/contact` | From `x-tenant-id` header |
| Landing page (`/`) | From `x-tenant-id` header |

### Helper: Extract Tenant from Request

```typescript
// src/lib/tenant.ts
import { headers } from "next/headers";

export function getTenantId(): string {
  const headersList = headers();
  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) throw new Error("Tenant context required");
  return tenantId;
}

export function getTenantIdOptional(): string | null {
  const headersList = headers();
  return headersList.get("x-tenant-id");
}
```
