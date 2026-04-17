# API Security Hardening Skill — MenteVive Multi-Tenant SaaS

## Scope
Security improvements for the Next.js API layer, auth system, and middleware/proxy configuration.

---

## 1. Rate Limiting — Upgrade from In-Memory to Distributed

### Current State 🔴 CRITICAL
```typescript
// src/lib/rate-limit.ts — In-memory Map
const store = new Map<string, RateLimitEntry>();
```

**Problems on Vercel Serverless:**
- Each cold start creates a new `Map` — rate limits reset
- Multiple concurrent function instances don't share state
- An attacker can bypass by hitting different instances

### Recommended: Upstash Redis Rate Limiting

#### Install
```bash
npm install @upstash/ratelimit @upstash/redis
```

#### Environment Variables
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

#### Implementation
```typescript
// src/lib/rate-limit.ts — Replace entire file
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Connection-less HTTP-based Redis — ideal for serverless
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limiters for different contexts
const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, "10 m"), // 8 attempts per 10 minutes
  analytics: true,
  prefix: "rl:login",
});

const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
  analytics: true,
  prefix: "rl:api",
});

const registrationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 registrations per hour per IP
  analytics: true,
  prefix: "rl:register",
});

export { loginLimiter, apiLimiter, registrationLimiter };

/**
 * Backward-compatible wrapper for existing code.
 * Kept during migration — replace direct usages with specific limiters.
 */
export async function rateLimit(
  key: string,
  limit: number,
  _windowMs = 60_000
): Promise<{ success: boolean; remaining: number }> {
  const { success, remaining } = await apiLimiter.limit(key);
  return { success, remaining };
}

// getClientIp remains unchanged
export function getClientIp(request: { headers: any }): string {
  const forwarded = request.headers instanceof Headers
    ? request.headers.get("x-forwarded-for")
    : request.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  const realIp = request.headers instanceof Headers
    ? request.headers.get("x-real-ip")
    : request.headers["x-real-ip"];
  return String(realIp || "unknown");
}
```

#### Graceful Fallback (if Redis unavailable)
```typescript
// Fallback to allow requests if Redis is down (fail-open)
export async function rateLimitSafe(
  limiter: Ratelimit,
  key: string
): Promise<{ success: boolean; remaining: number }> {
  try {
    return await limiter.limit(key);
  } catch {
    console.error("[rate-limit] Redis unavailable, allowing request");
    return { success: true, remaining: 1 };
  }
}
```

**Cost**: Upstash free tier includes 10,000 commands/day — sufficient for low-traffic SaaS.

---

## 2. Next.js Proxy (formerly Middleware)

### Current State 🔴 CRITICAL
**No `middleware.ts` or `proxy.ts` exists.** Tenant context is extracted manually in each API route.

### Why It Matters
- Tenant resolution is repeated in every API endpoint
- No centralized auth check at the edge
- No request-level tenant isolation enforcement
- Security headers not applied consistently

### Recommended: Create `src/proxy.ts`

> **Note**: Next.js 16 renamed `middleware.ts` to `proxy.ts`. Either works, but `proxy.ts` is the new convention.

```typescript
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Security headers (centralized)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");

  // 2. API rate limiting headers
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    response.headers.set("X-RateLimit-Policy", "60;w=60"); // informational
  }

  // 3. Protected routes — require auth token
  const protectedPaths = ["/dashboard", "/patients", "/agenda", "/financeiro"];
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));
  
  if (isProtected) {
    const token = request.cookies.get("next-auth.session-token")?.value
      || request.cookies.get("__Secure-next-auth.session-token")?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
```

---

## 3. JWT Session Security

### Current State ⚠️ MEDIUM RISK
```typescript
session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 } // 30 days
```

### Recommended Changes

#### 3.1 Reduce JWT MaxAge
```typescript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60, // 7 days instead of 30
  updateAge: 24 * 60 * 60,   // Force refresh every 24h
}
```

#### 3.2 Add Token Rotation (NextAuth built-in)
NextAuth's `updateAge` triggers token refresh. Combined with shorter `maxAge`, this limits the window for stolen tokens.

---

## 4. Feature Gating Enforcement

### Current State ⚠️ MEDIUM RISK
`isFeatureAllowed()` exists in `plans.ts` but is **NOT enforced in API routes**.
A tenant on `free` plan could access `/api/blog` endpoints directly.

### Recommended: Feature Gate Middleware

```typescript
// src/lib/feature-gate.ts
import { getTenantSubscriptionState, isFeatureAllowed, type FeatureKey } from "@/lib/plans";
import { NextResponse } from "next/server";

/**
 * Wraps an API handler with feature gating.
 * Returns 403 if the tenant's plan doesn't include the feature.
 */
export function requireFeature(feature: FeatureKey, handler: Function) {
  return async (req: Request, context: any) => {
    // Extract tenant from auth (assumes requireAdmin/requireAuth was called)
    const auth = await getServerSession(authOptions);
    const tenantId = auth?.user?.activeTenantId;
    
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getTenantSubscriptionState(tenantId);
    if (!state || !isFeatureAllowed(state.plan, feature)) {
      return NextResponse.json(
        { error: "Feature not available on your plan", feature },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}
```

**Usage in API routes:**
```typescript
// src/app/api/blog/route.ts
import { requireFeature } from "@/lib/feature-gate";

export const POST = requireFeature("blog", async (req: Request) => {
  // Only executes if tenant plan includes "blog"
  // ...existing handler
});
```

### Routes That Need Feature Gating
| Route | Feature Key |
|-------|-----------|
| `/api/blog/*` | `blog` |
| `/api/groups/*` | `grupos` |
| `/api/stripe/connect/*` | `stripe_connect` |

---

## 5. Content Security Policy Hardening

### Current State ⚠️
CSP includes `unsafe-inline` and `unsafe-eval` — defeats XSS protection.

### Recommended: Nonce-Based CSP

```typescript
// In proxy.ts or next.config.js headers
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-{{NONCE}}' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self';
  connect-src 'self' https://*.neon.tech https://*.stripe.com https://challenges.cloudflare.com;
  frame-src https://challenges.cloudflare.com https://meet.jit.si;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, " ").trim();
```

**Note**: `unsafe-inline` for styles is acceptable (Tailwind generates inline styles). `unsafe-eval` should be REMOVED.

---

## 6. Stripe Webhook Security

### Current State ⚠️ MEDIUM RISK
Dev mode bypass: if `NODE_ENV === 'development'`, webhook signature validation is skipped.

### Fix
```typescript
// Always validate webhook signature, even in development
// If testing locally, use Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook
const sig = request.headers.get("stripe-signature");
if (!sig) {
  return NextResponse.json({ error: "Missing signature" }, { status: 400 });
}

try {
  event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
} catch (err) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}
```

### Refund Atomicity
Current code updates local status to "refunded" even if Stripe API refund fails.

```typescript
// ❌ Current (unsafe)
await stripe.refunds.create({ payment_intent: pi });
await db.update(payments).set({ status: "refunded" }); // Runs even if above throws

// ✅ Fixed (atomic)
try {
  await stripe.refunds.create({ payment_intent: pi });
  await db.update(payments).set({ status: "refunded" }).where(...);
} catch (err) {
  await db.update(payments).set({ status: "refund_failed" }).where(...);
  throw err;
}
```

---

## 7. Input Validation Audit

### Current Strengths ✅
- Zod schemas on all form inputs
- Honeypot fields on registration
- Turnstile CAPTCHA on login

### Additional Hardening
- [ ] Add `maxLength` constraints to all text inputs in Zod schemas
- [ ] Add CSRF protection tokens for state-changing API routes
- [ ] Validate `Content-Type: application/json` on all POST endpoints

---

## 8. Checklist

### Priority 1 — Critical
- [ ] Replace in-memory rate limiting with Upstash Redis
- [ ] Create `proxy.ts` for centralized auth + headers
- [ ] Remove `unsafe-eval` from CSP
- [ ] Fix Stripe webhook always-validate signature

### Priority 2 — High
- [ ] Add feature gating to API routes (blog, groups, stripe_connect)
- [ ] Reduce JWT maxAge from 30d to 7d
- [ ] Fix refund atomicity

### Priority 3 — Medium
- [ ] Add nonce-based CSP for scripts
- [ ] Audit all `db.` calls for tenant scoping
- [ ] Add Content-Type validation to POST endpoints
