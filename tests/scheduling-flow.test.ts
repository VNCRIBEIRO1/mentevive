// @ts-nocheck
/**
 * Scheduling Flow Tests
 * Tests the full patient scheduling lifecycle:
 * - Authentication validation
 * - Patient lookup
 * - Date/time validations (past, blocked, availability, overlap)
 * - Successful appointment creation + notification
 * - GET patient appointments
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mock infrastructure (runs before all imports) ──────────
const mocks = vi.hoisted(() => {
  let _session: { user: { id: string; role: string; email?: string } } | null = null;
  let _dbResults: Record<string, unknown>[][] = [];
  let _dbIdx = 0;
  let _insertedRows: Record<string, unknown>[] = [];
  let _notifications: Record<string, unknown>[] = [];

  function makeChain() {
    const chain: Record<string, (...args: unknown[]) => unknown> & { then: (onF: (v: unknown[]) => unknown, onR?: (e: unknown) => unknown) => Promise<unknown> } = {} as never;
    const resolve = () => {
      const r = _dbResults[_dbIdx] ?? [];
      _dbIdx++;
      return r;
    };
    for (const m of ["from", "where", "limit", "orderBy", "leftJoin"] as const) {
      (chain as Record<string, unknown>)[m] = vi.fn().mockReturnValue(chain);
    }
    (chain as Record<string, unknown>).returning = vi.fn().mockImplementation(() => Promise.resolve(resolve()));
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

    requireAdmin: vi.fn(async () => {
      if (!_session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Não autenticado." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }
      if (_session.user?.role !== "admin" && _session.user?.role !== "therapist") {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Acesso negado." }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }
      return { error: false, session: _session };
    }),

    db: {
      select: vi.fn().mockImplementation(() => makeChain()),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((vals: Record<string, unknown>) => {
          _insertedRows.push(vals);
          return {
            returning: vi.fn().mockImplementation(() =>
              Promise.resolve([{ id: `new-${_insertedRows.length}`, ...vals }])
            ),
          };
        }),
      })),
      update: vi.fn().mockImplementation(() => {
        const c: Record<string, unknown> = {};
        c.set = vi.fn().mockReturnValue(c);
        c.where = vi.fn().mockReturnValue(c);
        c.returning = vi.fn().mockImplementation(() => Promise.resolve([{ id: "u1" }]));
        return c;
      }),
      delete: vi.fn().mockImplementation(() => {
        const c: Record<string, unknown> = {};
        c.where = vi.fn().mockReturnValue(c);
        c.returning = vi.fn().mockImplementation(() => Promise.resolve([{ id: "d1" }]));
        return c;
      }),
    },

    createNotification: vi.fn(async (data: Record<string, unknown>) => {
      _notifications.push(data);
    }),
  };
});

// ─── Apply mocks ────────────────────────────────────────────────────
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
  notifications: {},
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  ne: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  gte: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
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

// ─── Import handlers AFTER mocks ────────────────────────────────────
import { POST, GET } from "@/app/api/portal/appointments/route";

// ─── Helpers ────────────────────────────────────────────────────────
function mockRequest(body?: Record<string, unknown>, url = "http://localhost:3000/api/portal/appointments") {
  return { json: () => Promise.resolve(body ?? {}), url } as unknown as import("next/server").NextRequest;
}

// ─── Tests ──────────────────────────────────────────────────────────
beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

describe("POST /api/portal/appointments — Scheduling", () => {
  describe("Authentication", () => {
    it("should reject unauthenticated requests with 401", async () => {
      mocks.setSession(null);
      const res = await POST(mockRequest({ date: "2026-06-15", startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain("autenticado");
    });
  });

  describe("Patient lookup", () => {
    it("should return 404 when patient record not found", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([]); // patient query returns empty
      const res = await POST(mockRequest({ date: "2026-06-15", startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain("paciente");
    });
  });

  describe("Validation — required fields", () => {
    it("should return 400 when date is missing", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(mockRequest({ startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("obrigatórios");
    });

    it("should return 400 when startTime is missing", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(mockRequest({ date: "2026-06-15", endTime: "10:00" }));
      expect(res.status).toBe(400);
    });

    it("should compute endTime server-side when endTime is not provided", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      // The server computes endTime = startTime + 60min
      // So missing endTime should NOT cause 400, it proceeds to validate date
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }], // patient
        [],                                              // no blocked date
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }], // availability
        []                                               // no overlap
      );
      const res = await POST(mockRequest({ date: "2026-06-14", startTime: "09:00" }));
      // Should succeed since server computes endTime
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.endTime).toBe("10:00");
    });
  });

  describe("Validation — past date", () => {
    it("should reject appointments in the past", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults([{ id: "p1", userId: "u1", name: "Maria" }]);
      const res = await POST(mockRequest({ date: "2020-01-01", startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("passadas");
    });
  });

  describe("Validation — blocked date", () => {
    it("should reject appointments on blocked dates", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }], // patient
        [{ id: "block-1" }]                            // blocked date found
      );
      const res = await POST(mockRequest({ date: "2026-12-25", startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("bloqueada");
    });
  });

  describe("Validation — availability", () => {
    it("should reject appointments outside configured availability", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }], // patient
        [],                                             // no blocked date
        []                                              // no availability slots
      );
      const res = await POST(mockRequest({ date: "2026-06-15", startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("disponibilidade");
    });
  });

  describe("Validation — time overlap", () => {
    it("should reject overlapping appointments", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],                          // patient
        [],                                                                      // no blocked date
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }], // availability
        [{ id: "existing-apt" }]                                                 // overlapping appointment
      );
      const res = await POST(mockRequest({ date: "2026-06-14", startTime: "09:00", endTime: "10:00" }));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("ocupado");
    });
  });

  describe("Successful creation", () => {
    it("should create appointment and return 201", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],                          // patient
        [],                                                                      // no blocked date
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }], // availability
        []                                                                       // no overlapping
      );
      const res = await POST(
        mockRequest({ date: "2026-06-14", startTime: "10:00", endTime: "11:00" })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.patientId).toBe("p1");
      expect(body.date).toBe("2026-06-14");
      expect(body.startTime).toBe("10:00");
      expect(body.status).toBe("pending");
    });

    it("should default modality to 'online'", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        []
      );
      const res = await POST(
        mockRequest({ date: "2026-06-14", startTime: "10:00", endTime: "11:00" })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.modality).toBe("online");
    });
    it("should send notification to admin on creation", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Maria" }],
        [],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        []
      );
      await POST(mockRequest({ date: "2026-06-14", startTime: "10:00", endTime: "11:00" }));

      const notifs = mocks.getNotifications();
      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe("appointment");
      expect(notifs[0].title).toContain("agendamento");
      expect(notifs[0].patientId).toBe("p1");
    });

    it("should include patient name in notification message", async () => {
      mocks.setSession({ user: { id: "u1", role: "patient" } });
      mocks.setDbResults(
        [{ id: "p1", userId: "u1", name: "Beatriz" }],
        [],
        [{ dayOfWeek: 0, startTime: "08:00", endTime: "20:00", active: true }],
        []
      );
      await POST(mockRequest({ date: "2026-06-14", startTime: "10:00", endTime: "11:00" }));

      const msg = mocks.getNotifications()[0].message as string;
      expect(msg).toContain("Beatriz");
    });
  });
});

describe("GET /api/portal/appointments", () => {
  it("should reject unauthenticated requests", async () => {
    mocks.setSession(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("should return 404 when patient not found", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults([]); // no patient
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("should return patient appointments list", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1", userId: "u1" }], // patient
      [
        { appointment: { id: "a1", date: "2026-04-15" }, patientName: "Maria" },
        { appointment: { id: "a2", date: "2026-04-22" }, patientName: "Maria" },
      ]
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });
});

