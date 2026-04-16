import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let session: { user: { id: string; role: string } } | null = null;
  let payment: Record<string, unknown> | null = null;
  let patient: Record<string, unknown> | null = null;
  let checkoutArgs: Record<string, unknown> | null = null;
  let updatePayload: Record<string, unknown> | null = null;

  function makeSelectChain(result: Record<string, unknown>[]) {
    const chain: Record<string, unknown> = {};
    for (const method of ["from", "where", "limit"] as const) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected);
    return chain;
  }

  return {
    setSession(value: typeof session) {
      session = value;
    },
    setPayment(value: Record<string, unknown> | null) {
      payment = value;
    },
    setPatient(value: Record<string, unknown> | null) {
      patient = value;
    },
    getCheckoutArgs() {
      return checkoutArgs;
    },
    getUpdatePayload() {
      return updatePayload;
    },
    reset() {
      session = null;
      payment = null;
      patient = null;
      checkoutArgs = null;
      updatePayload = null;
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
    getAuthorizedPayment: vi.fn(async () => {
      if (!payment) {
        return { payment: null, reason: "not_found" as const };
      }
      return { payment, reason: null };
    }),
    createCheckoutSession: vi.fn(async (value: Record<string, unknown>) => {
      checkoutArgs = value;
      return {
        sessionId: "sess_123",
        checkoutUrl: "https://checkout.stripe.test/session",
      };
    }),
    db: {
      select: vi.fn().mockImplementation(() => makeSelectChain(patient ? [patient] : [])),
      update: vi.fn().mockImplementation(() => {
        const chain: Record<string, unknown> = {};
        chain.set = vi.fn((value: Record<string, unknown>) => {
          updatePayload = value;
          return chain;
        });
        chain.where = vi.fn().mockReturnValue(chain);
        return chain;
      }),
    },
  };
});

vi.mock("@/lib/api-auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/payment-access", () => ({
  getAuthorizedPayment: mocks.getAuthorizedPayment,
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: vi.fn(() => true),
  createCheckoutSession: mocks.createCheckoutSession,
  createConnectedCheckoutSession: mocks.createCheckoutSession,
}));

vi.mock("@/lib/db", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/validations", () => ({
  createCheckoutSchema: {
    safeParse: (body: Record<string, unknown>) => ({ success: true, data: body }),
  },
  formatZodError: vi.fn(() => "validation error"),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/db/schema", () => ({
  payments: {},
  patients: {},
  tenants: {},
}));

type RouteModule = {
  POST: (req: { json: () => Promise<Record<string, unknown>> }) => Promise<Response>;
};

let routeModule: RouteModule;

beforeAll(async () => {
  routeModule = (await import("../src/app/api/stripe/create-checkout/route")) as unknown as RouteModule;
});

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
  process.env.NEXTAUTH_URL = "https://mentevive.vercel.app";
});

describe("POST /api/stripe/create-checkout", () => {
  it("builds appointment-aware success and cancel URLs", async () => {
    mocks.setSession({ user: { id: "user-1", role: "patient" } });
    mocks.setPayment({
      id: "pay-1",
      amount: "150.00",
      status: "pending",
      description: "Sessao online",
      patientId: "patient-1",
      appointmentId: "apt-1",
      checkoutUrl: null,
      stripeSessionId: null,
    });
    mocks.setPatient({
      id: "patient-1",
      email: "paciente@example.com",
    });

    const response = await routeModule.POST({
      json: async () => ({ paymentId: "pay-1" }),
    });

    const body = await response.json();
    const checkoutArgs = mocks.getCheckoutArgs();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toContain("checkout.stripe.test");
    expect(checkoutArgs?.successUrl).toContain("/portal/agendar?");
    expect(checkoutArgs?.successUrl).toContain("paymentId=pay-1");
    expect(checkoutArgs?.successUrl).toContain("appointmentId=apt-1");
    expect(checkoutArgs?.cancelUrl).toContain("stripe_status=cancelled");
    expect(mocks.getUpdatePayload()).toMatchObject({
      stripeSessionId: "sess_123",
      checkoutUrl: "https://checkout.stripe.test/session",
      externalReference: "pay-1",
    });
  });
});
