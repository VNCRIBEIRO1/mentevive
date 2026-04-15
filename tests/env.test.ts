/**
 * Tests for environment validation (src/lib/env.ts).
 * Covers: getEnv(), isStripeConfigured(), required/optional vars, error formatting.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/* ── We must re-import the module fresh for each test to reset the singleton ── */
let getEnv: () => import("@/lib/env").Env;
let isStripeConfigured: () => boolean;

/** Reset module cache and env vars between tests */
async function loadModule() {
  // Clear module cache so the singleton resets
  vi.resetModules();
  const mod = await import("@/lib/env");
  getEnv = mod.getEnv;
  isStripeConfigured = mod.isStripeConfigured;
}

const REQUIRED_ENV = {
  DATABASE_URL: "postgresql://user:pass@host/db?sslmode=require",
  NEXTAUTH_SECRET: "test-secret-abc123",
  NEXTAUTH_URL: "http://localhost:3000",
};

describe("getEnv()", () => {
  beforeEach(async () => {
    // Set minimal required env
    Object.assign(process.env, REQUIRED_ENV);
    await loadModule();
  });

  afterEach(() => {
    // Clean up env
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.CRON_SECRET;
    delete process.env.SETUP_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  it("should return valid env when all required vars are set", () => {
    const env = getEnv();
    expect(env.DATABASE_URL).toBe(REQUIRED_ENV.DATABASE_URL);
    expect(env.NEXTAUTH_SECRET).toBe(REQUIRED_ENV.NEXTAUTH_SECRET);
    expect(env.NEXTAUTH_URL).toBe(REQUIRED_ENV.NEXTAUTH_URL);
  });

  it("should throw when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    await loadModule();
    expect(() => getEnv()).toThrow("Invalid environment variables");
  });

  it("should throw when NEXTAUTH_SECRET is missing", async () => {
    delete process.env.NEXTAUTH_SECRET;
    await loadModule();
    expect(() => getEnv()).toThrow("Invalid environment variables");
  });

  it("should accept AUTH_SECRET when NEXTAUTH_SECRET is missing", async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_SECRET = "authjs-secret";
    await loadModule();
    const env = getEnv();
    expect(env.NEXTAUTH_SECRET).toBe("authjs-secret");
  });

  it("should throw when NEXTAUTH_URL is not a valid URL", async () => {
    process.env.NEXTAUTH_URL = "not-a-url";
    await loadModule();
    expect(() => getEnv()).toThrow("Invalid environment variables");
  });

  it("should accept optional Stripe vars when present", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake123";
    await loadModule();
    const env = getEnv();
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_fake123");
    expect(env.STRIPE_WEBHOOK_SECRET).toBe("whsec_fake123");
  });

  it("should have undefined Stripe vars when not set", () => {
    const env = getEnv();
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
    expect(env.CRON_SECRET).toBeUndefined();
  });

  it("should accept SETUP_SECRET when present", async () => {
    process.env.SETUP_SECRET = "bootstrap-secret";
    await loadModule();
    const env = getEnv();
    expect(env.SETUP_SECRET).toBe("bootstrap-secret");
  });

  it("should accept Turnstile vars when present", async () => {
    process.env.TURNSTILE_SECRET_KEY = "turnstile-secret";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "turnstile-site-key";
    await loadModule();
    const env = getEnv();
    expect(env.TURNSTILE_SECRET_KEY).toBe("turnstile-secret");
    expect(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBe("turnstile-site-key");
  });

  it("should cache env after first call (singleton)", () => {
    const env1 = getEnv();
    const env2 = getEnv();
    expect(env1).toBe(env2); // Same reference = cached
  });
});

describe("isStripeConfigured() (env.ts)", () => {
  beforeEach(async () => {
    Object.assign(process.env, REQUIRED_ENV);
    await loadModule();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("should return false when STRIPE_SECRET_KEY is not set", () => {
    expect(isStripeConfigured()).toBe(false);
  });

  it("should return true when STRIPE_SECRET_KEY is set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    await loadModule();
    expect(isStripeConfigured()).toBe(true);
  });
});
