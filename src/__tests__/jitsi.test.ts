// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("buildRoomName", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, NEXTAUTH_SECRET: "test-secret-key-2026" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns a room name starting with psicolobia-", async () => {
    const { buildRoomName } = await import("@/lib/jitsi");
    const name = buildRoomName("550e8400-e29b-41d4-a716-446655440000");
    expect(name).toMatch(/^psicolobia-[0-9a-f]{16}$/);
  });

  it("is deterministic for the same appointment ID", async () => {
    const { buildRoomName } = await import("@/lib/jitsi");
    const id = "some-appointment-id-123";
    const a = buildRoomName(id);
    const b = buildRoomName(id);
    expect(a).toBe(b);
  });

  it("produces different names for different appointment IDs", async () => {
    const { buildRoomName } = await import("@/lib/jitsi");
    const a = buildRoomName("id-aaa");
    const b = buildRoomName("id-bbb");
    expect(a).not.toBe(b);
  });

  it("produces different names with different secrets", async () => {
    const { buildRoomName: build1 } = await import("@/lib/jitsi");
    const name1 = build1("same-id");

    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, NEXTAUTH_SECRET: "different-secret" };
    const { buildRoomName: build2 } = await import("@/lib/jitsi");
    const name2 = build2("same-id");

    expect(name1).not.toBe(name2);
  });

  it("uses 16 hex chars after prefix", async () => {
    const { buildRoomName } = await import("@/lib/jitsi");
    const name = buildRoomName("any-uuid");
    const hash = name.replace("psicolobia-", "");
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("falls back to AUTH_SECRET when NEXTAUTH_SECRET is not set", async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_SECRET = "authjs-secret-2026";

    const { buildRoomName } = await import("@/lib/jitsi");
    const name = buildRoomName("appointment-auth-secret");
    expect(name).toMatch(/^psicolobia-[0-9a-f]{16}$/);
  });
});

describe("buildMeetingUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...process.env, NEXTAUTH_SECRET: "test-secret" };
  });

  it("returns a valid Jitsi URL", async () => {
    const { buildMeetingUrl } = await import("@/lib/jitsi");
    const url = buildMeetingUrl("test-id");
    expect(url).toMatch(/^https:\/\/meet\.jit\.si\/psicolobia-[0-9a-f]{16}$/);
  });
});
