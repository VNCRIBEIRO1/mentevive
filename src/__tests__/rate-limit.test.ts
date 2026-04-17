// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to test the module fresh each time to reset the internal Map
let rateLimit: typeof import("@/lib/rate-limit").rateLimit;
let getClientIp: typeof import("@/lib/rate-limit").getClientIp;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/rate-limit");
  rateLimit = mod.rateLimit;
  getClientIp = mod.getClientIp;
});

describe("rateLimit", () => {
  it("allows requests within the limit", async () => {
    const r1 = await rateLimit("test-ip", 3, 60_000);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await rateLimit("test-ip", 3, 60_000);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await rateLimit("test-ip", 3, 60_000);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimit("blocked-ip", 3, 60_000);
    }
    const r4 = await rateLimit("blocked-ip", 3, 60_000);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimit("ip-a", 3, 60_000);
    }
    const blocked = await rateLimit("ip-a", 3, 60_000);
    expect(blocked.success).toBe(false);

    // Different key should still work
    const ok = await rateLimit("ip-b", 3, 60_000);
    expect(ok.success).toBe(true);
    expect(ok.remaining).toBe(2);
  });

  it("resets after window expires", async () => {
    vi.useFakeTimers();
    try {
      await rateLimit("expire-ip", 2, 1000);
      await rateLimit("expire-ip", 2, 1000);
      const blocked = await rateLimit("expire-ip", 2, 1000);
      expect(blocked.success).toBe(false);

      // Advance past window
      vi.advanceTimersByTime(1100);

      const reset = await rateLimit("expire-ip", 2, 1000);
      expect(reset.success).toBe(true);
      expect(reset.remaining).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.42, 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.42");
  });

  it("extracts IP from x-real-ip header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});
