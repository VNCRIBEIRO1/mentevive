import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let session: { user: { id: string; role: string } } | null = null;
  let rateLimitResult = { success: true, remaining: 2 };
  let selectQueue: unknown[][] = [];
  let selectIndex = 0;
  const insertedRows: Array<Record<string, unknown>> = [];
  const updates: Array<Record<string, unknown>> = [];
  let compareResult = true;

  function nextResult() {
    const result = selectQueue[selectIndex] ?? [];
    selectIndex += 1;
    return result;
  }

  function makeSelectChain() {
    const chain: Record<string, unknown> & {
      then: (onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) => Promise<unknown>;
    } = {} as never;
    for (const method of ["from", "where", "limit"] as const) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (onFulfilled, onRejected) => Promise.resolve(nextResult()).then(onFulfilled, onRejected);
    return chain;
  }

  return {
    reset() {
      session = null;
      rateLimitResult = { success: true, remaining: 2 };
      selectQueue = [];
      selectIndex = 0;
      insertedRows.length = 0;
      updates.length = 0;
      compareResult = true;
    },
    setSession(value: typeof session) {
      session = value;
    },
    setRateLimitResult(value: typeof rateLimitResult) {
      rateLimitResult = value;
    },
    queueSelectResults(...results: unknown[][]) {
      selectQueue = results;
      selectIndex = 0;
    },
    setCompareResult(value: boolean) {
      compareResult = value;
    },
    getInsertedRows() {
      return insertedRows;
    },
    getUpdates() {
      return updates;
    },
    db: {
      select: vi.fn(() => makeSelectChain()),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          insertedRows.push(values);
          return Promise.resolve();
        }),
      })),
      update: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        let payload: Record<string, unknown> = {};
        chain.set = vi.fn((values: Record<string, unknown>) => {
          payload = values;
          return chain;
        });
        chain.where = vi.fn(() => {
          updates.push(payload);
          return Promise.resolve();
        });
        return chain;
      }),
    },
    requireAuth: vi.fn(async () => {
      if (!session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Não autenticado." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }
      return { error: false, session };
    }),
    rateLimit: vi.fn(() => rateLimitResult),
    bcrypt: {
      hash: vi.fn(async (value: string) => `hashed:${value}`),
      compare: vi.fn(async () => compareResult),
    },
  };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/api-auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("bcryptjs", () => ({ default: mocks.bcrypt }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
  isNull: vi.fn((field: unknown) => ({ field, op: "isNull" })),
  gt: vi.fn((field: unknown, value: unknown) => ({ field, value, op: "gt" })),
}));
vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.alloc(32, 1)),
  };
});
vi.mock("@/db/schema", () => ({
  users: { id: "id", email: "email", password: "password", updatedAt: "updatedAt" },
  passwordResetTokens: {
    id: "id",
    userId: "userId",
    token: "token",
    expiresAt: "expiresAt",
    usedAt: "usedAt",
  },
}));

import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { PUT as changePasswordPut } from "@/app/api/portal/profile/password/route";

function request(body: Record<string, unknown>, forwardedFor = "203.0.113.1") {
  return {
    headers: { get: (key: string) => (key === "x-forwarded-for" ? forwardedFor : null) },
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

describe("Password recovery flow", () => {
  it("gera token sem vazar se o e-mail existe", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.queueSelectResults([{ id: "user-1" }]);

    const response = await forgotPasswordPost(request({ email: "paciente@teste.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("Se o e-mail existir");
    expect(mocks.getInsertedRows()).toHaveLength(1);
    expect(mocks.getInsertedRows()[0]).toMatchObject({ userId: "user-1" });
    expect(String(mocks.getInsertedRows()[0].token)).toHaveLength(64);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("mantém resposta neutra quando o e-mail não existe", async () => {
    mocks.queueSelectResults([]);

    const response = await forgotPasswordPost(request({ email: "naoexiste@teste.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("Se o e-mail existir");
    expect(mocks.getInsertedRows()).toHaveLength(0);
  });

  it("bloqueia forgot password por rate limit", async () => {
    mocks.setRateLimitResult({ success: false, remaining: 0 });

    const response = await forgotPasswordPost(request({ email: "paciente@teste.com" }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toContain("Muitas tentativas");
  });

  it("redefine a senha com token válido e marca o token como usado", async () => {
    mocks.queueSelectResults([{ id: "token-1", userId: "user-1", token: "abc", usedAt: null }]);

    const response = await resetPasswordPost(request({ token: "abc", password: "NovaSenha123" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("Senha redefinida");
    expect(mocks.getUpdates()).toHaveLength(2);
    expect(mocks.getUpdates()[0]).toMatchObject({ password: "hashed:NovaSenha123" });
    expect(mocks.getUpdates()[1]).toHaveProperty("usedAt");
  });

  it("rejeita reset com token inválido ou expirado", async () => {
    mocks.queueSelectResults([]);

    const response = await resetPasswordPost(request({ token: "invalido", password: "NovaSenha123" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Token inválido ou expirado");
  });

  it("exige autenticação para trocar senha no portal", async () => {
    const response = await changePasswordPut(request({ currentPassword: "Atual123", newPassword: "NovaSenha123" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain("autenticado");
  });

  it("rejeita troca quando a senha atual está incorreta", async () => {
    mocks.setSession({ user: { id: "user-1", role: "patient" } });
    mocks.setCompareResult(false);
    mocks.queueSelectResults([{ password: "hash-atual" }]);

    const response = await changePasswordPut(
      request({ currentPassword: "Errada123", newPassword: "NovaSenha123" })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Senha atual incorreta");
    expect(mocks.getUpdates()).toHaveLength(0);
  });

  it("troca a senha no portal quando a senha atual confere", async () => {
    mocks.setSession({ user: { id: "user-1", role: "patient" } });
    mocks.setCompareResult(true);
    mocks.queueSelectResults([{ password: "hash-atual" }]);

    const response = await changePasswordPut(
      request({ currentPassword: "Atual123", newPassword: "NovaSenha123" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("Senha alterada");
    expect(mocks.getUpdates()).toHaveLength(1);
    expect(mocks.getUpdates()[0]).toMatchObject({ password: "hashed:NovaSenha123" });
  });
});
