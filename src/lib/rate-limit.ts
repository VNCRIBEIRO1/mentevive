/**
 * In-memory rate limiter — zero external dependencies.
 *
 * Uses a Map<key, {count, resetAt}> with sliding window.
 * Suitable for Vercel Hobby / low-traffic deployments where
 * each serverless cold-start resets the map (acceptable trade-off).
 *
 * For higher traffic, swap with Redis / Upstash later.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number; // epoch ms
};

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Check rate limit for a given key (IP, email, etc.).
 *
 * @param key      Unique identifier (IP address, email, etc.)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds (default 60s)
 * @returns        { success: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): { success: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired → reset
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // Within window
  entry.count++;

  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
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
