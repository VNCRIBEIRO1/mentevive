/**
 * Triagem (Pre-session Triage) Tests
 * Tests the triage flow:
 * - GET triage by appointmentId (auth, ownership, returns data)
 * - POST triage create/update (auth, ownership, validation, notification)
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
      return { error: false, session: _session };
    }),

    db: {
      select: vi.fn().mockImplementation(() => makeChain()),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((vals: Record<string, unknown>) => {
          _insertedRows.push(vals);
          return {
            returning: vi.fn().mockImplementation(() =>
              Promise.resolve([{ id: `triage-${_insertedRows.length}`, ...vals }])
            ),
          };
        }),
      })),
      update: vi.fn().mockImplementation(() => {
        const c: Record<string, unknown> = {};
        c.set = vi.fn().mockReturnValue(c);
        c.where = vi.fn().mockReturnValue(c);
        c.returning = vi.fn().mockImplementation(() =>
          Promise.resolve([{ id: "triage-updated", completed: true }])
        );
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
  and: vi.fn(),
  desc: vi.fn(),
}));

// ─── Import handlers ────────────────────────────────────────────────
import { GET, POST } from "@/app/api/portal/triagem/route";

// ─── Helpers ────────────────────────────────────────────────────────
function mockRequest(
  body?: Record<string, unknown>,
  url = "http://localhost:3000/api/portal/triagem"
) {
  return { json: () => Promise.resolve(body ?? {}), url } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

// =====================================================================
// GET /api/portal/triagem?appointmentId=xxx
// =====================================================================
describe("GET /api/portal/triagem", () => {
  it("should reject unauthenticated requests", async () => {
    mocks.setSession(null);
    const res = await GET(mockRequest(undefined, "http://localhost:3000/api/portal/triagem?appointmentId=a1"));
    expect(res.status).toBe(401);
  });

  it("should return 400 when appointmentId is missing", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    const res = await GET(mockRequest(undefined, "http://localhost:3000/api/portal/triagem"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("appointmentId");
  });

  it("should return 404 when appointment not found or not owned by patient", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }], // patient found
      []               // appointment not found (not owned)
    );
    const res = await GET(mockRequest(undefined, "http://localhost:3000/api/portal/triagem?appointmentId=a999"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("não encontrado");
  });

  it("should return triage data when found", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }],                                                   // patient
      [{ id: "a1", patientId: "p1" }],                                  // appointment
      [{ id: "t1", mood: "good", sleepQuality: "regular", completed: true }] // triage
    );
    const res = await GET(mockRequest(undefined, "http://localhost:3000/api/portal/triagem?appointmentId=a1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mood).toBe("good");
    expect(body.completed).toBe(true);
  });

  it("should return null when no triage exists", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }],                  // patient
      [{ id: "a1", patientId: "p1" }], // appointment
      []                                // no triage
    );
    const res = await GET(mockRequest(undefined, "http://localhost:3000/api/portal/triagem?appointmentId=a1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});

// =====================================================================
// POST /api/portal/triagem
// =====================================================================
describe("POST /api/portal/triagem", () => {
  const triagemData = {
    appointmentId: "a1",
    mood: "anxious",
    sleepQuality: "bad",
    anxietyLevel: 7,
    mainConcern: "Dificuldade em lidar com pressão no trabalho",
  };

  it("should reject unauthenticated requests", async () => {
    mocks.setSession(null);
    const res = await POST(mockRequest(triagemData));
    expect(res.status).toBe(401);
  });

  it("should return 400 when appointmentId is missing", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    const res = await POST(mockRequest({ mood: "good" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("appointmentId");
  });

  it("should return 404 when patient not found", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults([]); // no patient
    const res = await POST(mockRequest(triagemData));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("paciente");
  });

  it("should return 404 when appointment not owned by patient", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }], // patient found
      []               // appointment not found / not owned
    );
    const res = await POST(mockRequest(triagemData));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("não encontrado");
  });

  it("should create new triage and return 201", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }],                  // patient
      [{ id: "a1", patientId: "p1" }], // appointment
      [],                               // no existing triage → create new
      // After insert, notification queries:
      [{ id: "a1", patientId: "p1", date: "2026-06-14" }], // apt for notification
      [{ name: "Maria" }]               // patient name for notification
    );
    const res = await POST(mockRequest(triagemData));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.appointmentId).toBe("a1");
    expect(body.mood).toBe("anxious");
    expect(body.completed).toBe(true);
  });

  it("should update existing triage and return 200", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }],                                             // patient
      [{ id: "a1", patientId: "p1" }],                            // appointment
      [{ id: "t-existing", mood: "good", completed: false }],     // existing triage
      // After update, notification queries:
      [{ id: "a1", patientId: "p1", date: "2026-06-14" }],        // apt for notification
      [{ name: "Maria" }]                                          // patient name
    );
    const res = await POST(mockRequest({ ...triagemData, mood: "calm" }));
    expect(res.status).toBe(200);
  });

  it("should send notification when triage is created", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }],
      [{ id: "a1", patientId: "p1" }],
      [],
      [{ id: "a1", patientId: "p1", date: "2026-06-14" }],
      [{ name: "Maria" }]
    );
    await POST(mockRequest(triagemData));
    const notifs = mocks.getNotifications();
    expect(notifs.length).toBe(1);
    expect(notifs[0].type).toBe("triage");
    expect(notifs[0].title).toContain("triagem");
  });

  it("should include main concern in notification for new triage", async () => {
    mocks.setSession({ user: { id: "u1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "p1" }],
      [{ id: "a1", patientId: "p1" }],
      [],
      [{ id: "a1", patientId: "p1", date: "2026-06-14" }],
      [{ name: "Maria" }]
    );
    await POST(mockRequest(triagemData));
    const msg = mocks.getNotifications()[0].message as string;
    expect(msg).toContain("Dificuldade em lidar com pressão no trabalho");
  });
});
