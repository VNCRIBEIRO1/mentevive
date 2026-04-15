/**
 * Recurring Appointments (Processo Terapêutico) Tests
 * Tests the recurrence flow:
 * - Authentication + patient lookup
 * - Validation (fields, recurrence type, past date, availability)
 * - Weekly/biweekly date generation
 * - Blocked date + overlap skipping
 * - Notification on success
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mock infrastructure ────────────────────────────────────
const mocks = vi.hoisted(() => {
  let _session: { user: { id: string; role: string } } | null = null;
  let _dbResults: Record<string, unknown>[][] = [];
  let _dbIdx = 0;
  let _insertedRows: Record<string, unknown>[] = [];
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
    setDbResults: (...r: Record<string, unknown>[][]) => { _dbResults = r; _dbIdx = 0; _insertedRows = []; },
    getInsertedRows: () => _insertedRows,
    getNotifications: () => _notifications,
    reset: () => { _session = null; _dbResults = []; _dbIdx = 0; _insertedRows = []; _notifications.length = 0; },

    requireAuth: vi.fn(async () => {
      if (!_session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Não autenticado." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }
      return { error: false, session: _session };
    }),

    requireAdmin: vi.fn(async () => ({
      error: false,
      session: _session,
    })),

    db: {
      select: vi.fn().mockImplementation(() => makeChain()),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((vals: Record<string, unknown>) => {
          _insertedRows.push(vals);
          return {
            returning: vi.fn().mockImplementation(() =>
              Promise.resolve([{ id: `apt-${_insertedRows.length}`, ...vals }])
            ),
          };
        }),
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
  triages: {},
  payments: {},
  settings: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  ne: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  and: vi.fn(),
}));
vi.mock("@/lib/custom-availability", () => ({
  getCustomAvailability: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/session-pricing", () => ({
  getSessionPrice: vi.fn().mockResolvedValue(180),
}));
vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: vi.fn().mockReturnValue(false),
  createCheckoutSession: vi.fn().mockResolvedValue(null),
}));

import { POST } from "@/app/api/portal/appointments/recurrence/route";

// ─── Helpers ────────────────────────────────────────────────────────
function mockRequest(body?: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body ?? {}),
    url: "http://localhost:3000/api/portal/appointments/recurrence",
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

// =====================================================================
// POST /api/portal/appointments/recurrence
// =====================================================================
describe("POST /api/portal/appointments/recurrence", () => {
  describe("Authentication & patient", () => {
    it("should reject unauthenticated requests", async () => {
      mocks.setSession(null);
      const res = await POST(mockRequest({ startDate: "2026-06-14" }));
      expect(res.status).toBe(401);
    });

    it("should return 404 when patient not found", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([]); // no patient
      const res = await POST(
        mockRequest({ startDate: "2026-06-14", startTime: "10:00", endTime: "11:00", recurrenceType: "weekly" })
      );
      expect(res.status).toBe(404);
    });
  });

  describe("Validation — required fields", () => {
    it("should return 400 when startDate is missing", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(
        mockRequest({ startTime: "10:00", endTime: "11:00", recurrenceType: "weekly" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("obrigatórios");
    });

    it("should return 400 when startTime is missing", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(
        mockRequest({ startDate: "2026-06-14", endTime: "11:00", recurrenceType: "weekly" })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("Validation — recurrence type", () => {
    it("should return 400 for invalid recurrence type", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "monthly",
        })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("recorrência");
    });

    it("should accept 'weekly' type", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      // patient → availability → blocked dates → 8x overlap checks
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [], // no blocked dates
        // 8 overlap checks (one per generated date), all empty
        [], [], [], [], [], [], [], []
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14", // Sunday
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 8,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(8);
    });

    it("should accept 'biweekly' type", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [],
        [], [], [], [], [], [], [], []
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "biweekly",
          weeks: 8,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(8);
    });
  });

  describe("Validation — past date", () => {
    it("should reject past start dates", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(
        mockRequest({
          startDate: "2020-01-01",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
        })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("passadas");
    });
  });

  describe("Validation — availability", () => {
    it("should reject when no availability for the day of week", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [] // no availability slots
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
        })
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("Nenhuma sessão");
    });
  });

  describe("Skipping logic", () => {
    it("should skip blocked dates and continue", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [{ date: "2026-06-21" }], // blocked date: 2nd week
        // Overlap checks for non-blocked dates (weeks 1, 3, 4, 5, 6, 7, 8 = 7 checks)
        [], [], [], [], [], [], []
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 8,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(7);
      expect(body.skipped).toBe(1);
      expect(body.skippedDates[0].reason).toContain("bloqueada");
    });

    it("should skip overlapping slots and continue", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [], // no blocked dates
        // First overlap check returns an existing appointment
        [{ id: "existing-1" }],
        // Remaining 7 overlap checks are empty
        [], [], [], [], [], [], []
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 8,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(7);
      expect(body.skipped).toBe(1);
      expect(body.skippedDates[0].reason).toContain("ocupado");
    });

    it("should return 409 when ALL slots are blocked/occupied", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [], // no blocked dates
        // All 2 overlap checks return existing appointments (weeks=2, minimum)
        [{ id: "e1" }],
        [{ id: "e2" }]
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 2,
        })
      );
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("Nenhuma sessão");
    });
  });

  describe("Successful creation", () => {
    it("should include recurrenceGroupId in response", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [],
        [], []
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 2,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.recurrenceGroupId).toBeDefined();
      expect(typeof body.recurrenceGroupId).toBe("string");
    });

    it("should clamp weeks between 2 and 24", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      // With weeks=1 → clamped to 2
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [],
        [], []
      );
      const res = await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 1,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(2);
    });

    it("should send notification to admin", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [],
        [], []
      );
      await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "weekly",
          weeks: 2,
        })
      );
      const notifs = mocks.getNotifications();
      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe("appointment");
      expect(notifs[0].title).toContain("Processo terapêutico");
      expect((notifs[0].message as string)).toContain("semanal");
    });

    it("should mention 'quinzenal' for biweekly recurrence", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        [],
        [], []
      );
      await POST(
        mockRequest({
          startDate: "2026-06-14",
          startTime: "10:00",
          endTime: "11:00",
          recurrenceType: "biweekly",
          weeks: 2,
        })
      );
      const msg = mocks.getNotifications()[0].message as string;
      expect(msg).toContain("quinzenal");
    });
  });
});
