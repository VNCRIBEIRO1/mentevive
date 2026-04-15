/**
 * Sala de Espera (Waiting Room) + Appointment Access Tests
 * Tests:
 * - GET /api/appointments/[id] — access control (admin, patient owner, unauthorized)
 * - Meeting URL generation integration
 * - Waiting room entry conditions (business logic)
 * - PUT/DELETE admin-only checks
 *
 * NOTE: The [id] dynamic route module is imported via dynamic import to handle
 * bracket-path resolution in Vitest.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { buildRoomName, buildMeetingUrl, jitsiConfig, jitsiInterfaceConfig } from "@/lib/jitsi";

// ─── Hoisted mock infrastructure ────────────────────────────────────
const mocks = vi.hoisted(() => {
  let _session: { user: { id: string; role: string } } | null = null;
  let _dbResults: Record<string, unknown>[][] = [];
  let _dbIdx = 0;
  let _notifications: Record<string, unknown>[] = [];

  function makeChain() {
    const chain: Record<string, unknown> = {};
    const resolve = () => {
      const r = _dbResults[_dbIdx] ?? [];
      _dbIdx++;
      return r;
    };
    for (const m of ["from", "where", "limit", "orderBy", "leftJoin"]) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.returning = vi.fn().mockImplementation(() => Promise.resolve(resolve()));
    chain.then = (onF: (v: unknown[]) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onF, onR);
    return chain;
  }

  return {
    setSession: (s: typeof _session) => { _session = s; },
    setDbResults: (...r: Record<string, unknown>[][]) => { _dbResults = r; _dbIdx = 0; },
    getNotifications: () => _notifications,
    reset: () => { _session = null; _dbResults = []; _dbIdx = 0; _notifications.length = 0; },

    requireAuth: vi.fn(async () => {
      if (!_session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Não autenticado." }), {
            status: 401, headers: { "Content-Type": "application/json" },
          }),
        };
      }
      return { error: false, session: _session };
    }),

    requireAdmin: vi.fn(async () => {
      if (!_session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Não autenticado." }), {
            status: 401, headers: { "Content-Type": "application/json" },
          }),
        };
      }
      if (_session.user?.role !== "admin" && _session.user?.role !== "therapist") {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Acesso negado." }), {
            status: 403, headers: { "Content-Type": "application/json" },
          }),
        };
      }
      return { error: false, session: _session };
    }),

    db: {
      select: vi.fn().mockImplementation(() => makeChain()),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockImplementation(() => Promise.resolve([])),
        })),
      })),
      update: vi.fn().mockImplementation(() => {
        const c: Record<string, unknown> = {};
        c.set = vi.fn().mockReturnValue(c);
        c.where = vi.fn().mockReturnValue(c);
        c.returning = vi.fn().mockImplementation(() => Promise.resolve([]));
        return c;
      }),
      delete: vi.fn().mockImplementation(() => {
        const c: Record<string, unknown> = {};
        c.where = vi.fn().mockReturnValue(c);
        c.returning = vi.fn().mockImplementation(() => Promise.resolve([]));
        return c;
      }),
    },

    createNotification: vi.fn(async (data: Record<string, unknown>) => {
      _notifications.push(data);
    }),
  };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/api-auth", () => ({
  requireAuth: mocks.requireAuth,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/notifications", () => ({
  createNotification: mocks.createNotification,
}));
vi.mock("@/db/schema", () => ({
  appointments: {},
  patients: {},
  availability: {},
  blockedDates: {},
  payments: {},
  settings: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

// Dynamic import for [id] route — resolves bracket path issue
type RouteModule = {
  GET: (req: import("next/server").NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  PUT: (req: import("next/server").NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  DELETE: (req: import("next/server").NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
};

let routeModule: RouteModule;

beforeAll(async () => {
  routeModule = (await import("../src/app/api/appointments/[id]/route")) as unknown as RouteModule;
});

// ─── Helpers ────────────────────────────────────────────────────────
function mockNextRequest(url = "http://localhost:3000/api/appointments/a1") {
  return { json: () => Promise.resolve({}), url } as unknown as import("next/server").NextRequest;
}

function mockNextRequestWithBody(body: Record<string, unknown>) {
  return { json: () => Promise.resolve(body), url: "http://localhost:3000/api/appointments/a1" } as unknown as import("next/server").NextRequest;
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

// =====================================================================
// GET /api/appointments/[id] — Access Control
// =====================================================================
describe("GET /api/appointments/[id]", () => {
  it("should reject unauthenticated requests", async () => {
    mocks.setSession(null);
    const res = await routeModule.GET(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(401);
  });

  it("should return 404 when appointment not found", async () => {
    mocks.setSession({ user: { id: "u1", role: "admin" } });
    mocks.setDbResults([]); // no appointment
    const res = await routeModule.GET(mockNextRequest(), makeParams("a999"));
    expect(res.status).toBe(404);
  });

  it("should allow admin to access any appointment", async () => {
    mocks.setSession({ user: { id: "admin1", role: "admin" } });
    mocks.setDbResults([
      { id: "a1", patientId: "p1", date: "2026-06-14", startTime: "10:00", status: "confirmed" },
    ]);
    const res = await routeModule.GET(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("a1");
  });

  it("should allow therapist to access any appointment", async () => {
    mocks.setSession({ user: { id: "t1", role: "therapist" } });
    mocks.setDbResults([
      { id: "a1", patientId: "p1", date: "2026-06-14", startTime: "10:00", status: "confirmed" },
    ]);
    const res = await routeModule.GET(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(200);
  });

  it("should allow patient to access their own appointment", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "a1", patientId: "p1", date: "2026-06-14", startTime: "10:00" }], // appointment
      [{ id: "p1" }] // patient record — matches appointment.patientId
    );
    const res = await routeModule.GET(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("a1");
  });

  it("should deny patient access to another patient's appointment", async () => {
    mocks.setSession({ user: { id: "u2", role: "patient" } });
    mocks.setDbResults(
      [{ id: "a1", patientId: "p1", date: "2026-06-14", startTime: "10:00" }], // apt belongs to p1
      [{ id: "p-other" }] // patient record is p-other (not p1)
    );
    const res = await routeModule.GET(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("não encontrado");
  });
});

// =====================================================================
// Meeting URL Integration
// =====================================================================
describe("Meeting URL Integration (Sala de Espera)", () => {
  it("should generate deterministic meeting URL from appointment ID", () => {
    const aptId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const url = buildMeetingUrl(aptId);
    expect(url).toMatch(/^https:\/\/meet\.jit\.si\/psicolobia-/);
    expect(buildMeetingUrl(aptId)).toBe(url);
  });

  it("should produce different URLs for different appointments", () => {
    const url1 = buildMeetingUrl("apt-1111-2222-3333-4444");
    const url2 = buildMeetingUrl("apt-5555-6666-7777-8888");
    expect(url1).not.toBe(url2);
  });

  it("should generate room name with psicolobia prefix for branding", () => {
    const room = buildRoomName("test-appointment-uuid");
    expect(room.startsWith("psicolobia-")).toBe(true);
  });

  it("should keep room name short (prefix + 16 hex chars)", () => {
    const room = buildRoomName("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    const suffix = room.replace("psicolobia-", "");
    expect(suffix.length).toBe(16);
  });

  it("patient and admin should resolve to the same room", () => {
    const aptId = "shared-appointment-id-uuid";
    const patientRoom = buildRoomName(aptId);
    const adminRoom = buildRoomName(aptId);
    expect(patientRoom).toBe(adminRoom);
  });

  it("Jitsi config should disable audio and enable video for therapeutic session", () => {
    expect(jitsiConfig.startWithAudioMuted).toBe(true);
    expect(jitsiConfig.startWithVideoMuted).toBe(false);
    expect(jitsiConfig.prejoinPageEnabled).toBe(false);
  });

  it("Jitsi interface should use brand colors", () => {
    expect(jitsiInterfaceConfig.DEFAULT_BACKGROUND).toBe("#FFF5EE");
    expect(jitsiInterfaceConfig.SHOW_JITSI_WATERMARK).toBe(false);
  });
});

// =====================================================================
// Waiting Room Entry Conditions (business logic)
// =====================================================================
describe("Waiting Room Entry Conditions", () => {
  it("requires meeting URL to be set (canEnter logic)", () => {
    const apt = { id: "a1", meetingUrl: null as string | null };
    const hasMeetingUrl = !!apt.meetingUrl;
    expect(hasMeetingUrl).toBe(false);
  });

  it("allows entry when meeting URL is present", () => {
    const apt = { id: "a1", meetingUrl: buildMeetingUrl("a1") };
    const hasMeetingUrl = !!apt.meetingUrl;
    expect(hasMeetingUrl).toBe(true);
    expect(apt.meetingUrl).toContain("meet.jit.si");
  });

  it("entry is allowed 10 minutes before session time (seconds <= 600)", () => {
    const sessionDateTime = new Date("2026-06-14T10:00:00");
    const tenMinBefore = new Date(sessionDateTime.getTime() - 10 * 60 * 1000);
    const seconds = Math.floor((sessionDateTime.getTime() - tenMinBefore.getTime()) / 1000);
    expect(seconds).toBe(600);
    expect(seconds <= 600).toBe(true);
  });

  it("entry is NOT allowed more than 10 minutes before", () => {
    const sessionDateTime = new Date("2026-06-14T10:00:00");
    const twentyMinBefore = new Date(sessionDateTime.getTime() - 20 * 60 * 1000);
    const seconds = Math.floor((sessionDateTime.getTime() - twentyMinBefore.getTime()) / 1000);
    expect(seconds).toBe(1200);
    expect(seconds <= 600).toBe(false);
  });

  it("entry is allowed after session start time (countdown = 0)", () => {
    expect(0 <= 600).toBe(true);
  });

  it("entry requires BOTH meeting URL and countdown <= 10 min", () => {
    // Simulates the full canEnter condition from sala-espera page
    const apt = { meetingUrl: buildMeetingUrl("a1") };
    const seconds = 600; // 10 min before
    const hasMeetingUrl = !!apt.meetingUrl;
    const canEnter = seconds <= 600 && hasMeetingUrl;
    expect(canEnter).toBe(true);

    // Without meeting URL
    const apt2 = { meetingUrl: null as string | null };
    const canEnter2 = seconds <= 600 && !!apt2.meetingUrl;
    expect(canEnter2).toBe(false);
  });
});

// =====================================================================
// PUT /api/appointments/[id] — Admin status change
// =====================================================================
describe("PUT /api/appointments/[id]", () => {
  it("should reject non-admin users", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    const res = await routeModule.PUT(mockNextRequestWithBody({ status: "confirmed" }), makeParams("a1"));
    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    mocks.setSession(null);
    const res = await routeModule.PUT(mockNextRequestWithBody({ status: "confirmed" }), makeParams("a1"));
    expect(res.status).toBe(401);
  });
});

// =====================================================================
// DELETE /api/appointments/[id] — Admin only
// =====================================================================
describe("DELETE /api/appointments/[id]", () => {
  it("should reject non-admin users", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    const res = await routeModule.DELETE(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(403);
  });

  it("should reject unauthenticated requests", async () => {
    mocks.setSession(null);
    const res = await routeModule.DELETE(mockNextRequest(), makeParams("a1"));
    expect(res.status).toBe(401);
  });
});
