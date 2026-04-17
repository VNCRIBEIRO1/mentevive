/**
 * Distributed rate limiter — Upstash Redis (HTTP-based, serverless-safe).
 *
 * Falls back to in-memory if Upstash env vars are not configured.
 * Each limiter uses a sliding window algorithm.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

// Specific limiters for different contexts
export const loginLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(8, "10 m"), prefix: "rl:login" })
  : null;

export const apiLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "rl:api" })
  : null;

export const registrationLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), prefix: "rl:register" })
  : null;

// ── In-memory fallback (when Upstash is not configured) ──

type RateLimitEntry = { count: number; resetAt: number };
const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function inMemoryLimit(key: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  entry.count++;
  if (entry.count > limit) return { success: false, remaining: 0 };
  return { success: true, remaining: limit - entry.count };
}

/**
 * Backward-compatible rate limit function.
 * Uses Upstash Redis when available, falls back to in-memory.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): Promise<{ success: boolean; remaining: number }> {
  if (apiLimiter) {
    try {
      const { success, remaining } = await apiLimiter.limit(key);
      return { success, remaining };
    } catch {
      // Fail-open: allow request if Redis is unreachable
      return { success: true, remaining: 1 };
    }
  }
  return inMemoryLimit(key, limit, windowMs);
}

/**
 * Extract client IP from request headers.
 * Works on Vercel (x-forwarded-for) and standard proxies.
 */
type HeaderCarrier =
  | Pick<Request, "headers">
  | {
      headers: Headers | Record<string, string | string[] | undefined>;
    };

function readHeader(
  headers: HeaderCarrier["headers"],
  key: string
): string | null {
  if (headers instanceof Headers) {
    return headers.get(key);
  }

  const value = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

export function getClientIp(request: HeaderCarrier): string {
  const forwarded = readHeader(request.headers, "x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated; first entry is the client
    return forwarded.split(",")[0].trim();
  }
  return readHeader(request.headers, "x-real-ip") || "unknown";
}
