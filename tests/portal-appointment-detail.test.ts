import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let session: { user: { id: string; role: string } } | null = null;
  let dbResults: Record<string, unknown>[][] = [];
  let dbIndex = 0;

  function makeChain() {
    const chain: Record<string, unknown> = {};
    const resolve = () => {
      const result = dbResults[dbIndex] ?? [];
      dbIndex += 1;
      return result;
    };

    for (const method of ["from", "where", "limit"] as const) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }

    chain.then = (onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected);

    return chain;
  }

  return {
    setSession(value: typeof session) {
      session = value;
    },
    setDbResults(...value: Record<string, unknown>[][]) {
      dbResults = value;
      dbIndex = 0;
    },
    reset() {
      session = null;
      dbResults = [];
      dbIndex = 0;
    },
    requireAuth: vi.fn(async () => {
      if (!session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Nao autenticado." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }

      return { error: false, session };
    }),
    db: {
      select: vi.fn().mockImplementation(() => makeChain()),
    },
  };
});

vi.mock("@/lib/api-auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mocks.db,
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

vi.mock("@/db/schema", () => ({
  appointments: {},
  patients: {},
}));

type RouteModule = {
  GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
};

let routeModule: RouteModule;

beforeAll(async () => {
  routeModule = (await import("../src/app/api/portal/appointments/[id]/route")) as unknown as RouteModule;
});

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/portal/appointments/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.setSession(null);

    const response = await routeModule.GET({} as Request, makeParams("apt-1"));

    expect(response.status).toBe(401);
  });

  it("returns appointment for the authenticated patient owner", async () => {
    mocks.setSession({ user: { id: "user-1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "patient-1" }],
      [{ id: "apt-1", patientId: "patient-1", status: "confirmed" }],
    );

    const response = await routeModule.GET({} as Request, makeParams("apt-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("apt-1");
  });

  it("returns 404 when the appointment does not belong to the patient", async () => {
    mocks.setSession({ user: { id: "user-1", role: "patient" } });
    mocks.setDbResults(
      [{ id: "patient-1" }],
      [],
    );

    const response = await routeModule.GET({} as Request, makeParams("apt-2"));

    expect(response.status).toBe(404);
  });
});
