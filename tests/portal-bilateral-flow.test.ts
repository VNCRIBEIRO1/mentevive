// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";

type Session = { user: { id: string; role: string } } | null;

type TablesState = {
  patients: Array<Record<string, unknown>>;
  appointments: Array<Record<string, unknown>>;
  clinicalRecords: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
};

const mocks = vi.hoisted(() => {
  let session: Session = null;
  const state: TablesState = {
    patients: [],
    appointments: [],
    clinicalRecords: [],
    notifications: [],
    payments: [],
  };
  const createNotificationCalls: Array<Record<string, unknown>> = [];

  function resetState() {
    session = null;
    state.patients = [];
    state.appointments = [];
    state.clinicalRecords = [];
    state.notifications = [];
    state.payments = [];
    createNotificationCalls.length = 0;
  }

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  function evaluate(row: Record<string, unknown>, condition: unknown): boolean {
    if (!condition || typeof condition !== "object") return true;
    const typed = condition as { op?: string; field?: string; value?: unknown; conditions?: unknown[] };
    if (typed.op === "and") return (typed.conditions ?? []).every((item) => evaluate(row, item));
    if (typed.op === "eq") return row[typed.field ?? ""] === typed.value;
    return true;
  }

  function projectRow(
    row: Record<string, unknown>,
    selection?: Record<string, unknown>
  ): Record<string, unknown> {
    if (!selection) return clone(row);
    const projected: Record<string, unknown> = {};
    for (const [alias, field] of Object.entries(selection)) {
      if (typeof field === "string") {
        projected[alias] = row[field];
      }
    }
    return projected;
  }

  function resolveRows(
    tableName: keyof TablesState,
    selection?: Record<string, unknown>,
    condition?: unknown,
    orderField?: string,
    limitValue?: number
  ) {
    let rows = state[tableName].filter((row) => evaluate(row, condition)).map((row) => projectRow(row, selection));
    if (orderField) {
      rows = rows.sort((a, b) => String(b[orderField] ?? "").localeCompare(String(a[orderField] ?? "")));
    }
    if (typeof limitValue === "number") {
      rows = rows.slice(0, limitValue);
    }
    return rows;
  }

  function makeSelectChain(selection?: Record<string, unknown>) {
    let tableName: keyof TablesState | null = null;
    let condition: unknown;
    let orderField: string | undefined;
    let limitValue: number | undefined;

    const chain: Record<string, unknown> & {
      then: (onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) => Promise<unknown>;
    } = {} as never;

    chain.from = vi.fn((table: { __table: keyof TablesState }) => {
      tableName = table.__table;
      return chain;
    });
    chain.where = vi.fn((value: unknown) => {
      condition = value;
      return chain;
    });
    chain.orderBy = vi.fn((order: { field: string }) => {
      orderField = order.field;
      return chain;
    });
    chain.limit = vi.fn((value: number) => {
      limitValue = value;
      return chain;
    });
    chain.leftJoin = vi.fn().mockReturnValue(chain);
    chain.then = (onFulfilled, onRejected) =>
      Promise.resolve(resolveRows(tableName!, selection, condition, orderField, limitValue)).then(onFulfilled, onRejected);

    return chain;
  }

  function makeUpdateChain(tableName: keyof TablesState) {
    let payload: Record<string, unknown> = {};
    let updatedRows: Array<Record<string, unknown>> = [];
    const chain: Record<string, unknown> = {};

    chain.set = vi.fn((value: Record<string, unknown>) => {
      payload = value;
      return chain;
    });
    chain.where = vi.fn((condition: unknown) => {
      updatedRows = state[tableName]
        .filter((row) => evaluate(row, condition))
        .map((row) => {
          Object.assign(row, payload);
          return clone(row);
        });
      return chain;
    });
    chain.returning = vi.fn(async () => updatedRows);
    return chain;
  }

  return {
    reset: resetState,
    setSession(value: Session) {
      session = value;
    },
    seed(next: Partial<TablesState>) {
      state.patients = clone(next.patients ?? []);
      state.appointments = clone(next.appointments ?? []);
      state.clinicalRecords = clone(next.clinicalRecords ?? []);
      state.notifications = clone(next.notifications ?? []);
      state.payments = clone(next.payments ?? []);
      createNotificationCalls.length = 0;
    },
    getState() {
      return state;
    },
    getCreateNotificationCalls() {
      return createNotificationCalls;
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
    requireAdmin: vi.fn(async () => {
      if (!session) {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Não autenticado." }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }
      if (session.user.role !== "admin" && session.user.role !== "therapist") {
        return {
          error: true,
          response: new Response(JSON.stringify({ error: "Acesso negado." }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }),
        };
      }
      return { error: false, session };
    }),
    createNotification: vi.fn(async (payload: Record<string, unknown>) => {
      createNotificationCalls.push(payload);
    }),
    db: {
      select: vi.fn((selection?: Record<string, unknown>) => makeSelectChain(selection)),
      update: vi.fn((table: { __table: keyof TablesState }) => makeUpdateChain(table.__table)),
      insert: vi.fn((table: { __table: keyof TablesState }) => ({
        values: vi.fn((payload: Record<string, unknown>) => {
          const row = { id: `generated-${state[table.__table].length + 1}`, ...payload };
          state[table.__table].push(clone(row));
          return Promise.resolve();
        }),
      })),
      query: {
        patients: {
          findFirst: vi.fn(async ({ where, columns }: { where?: unknown; columns?: Record<string, boolean> }) => {
            const patient = state.patients.find((row) => evaluate(row, where));
            if (!patient) return undefined;
            if (!columns) return clone(patient);
            const picked: Record<string, unknown> = {};
            for (const key of Object.keys(columns)) {
              picked[key] = patient[key];
            }
            return picked;
          }),
        },
      },
    },
  };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/api-auth", () => ({
  requireAuth: mocks.requireAuth,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/notifications", () => ({ createNotification: mocks.createNotification }));
vi.mock("@/lib/jitsi", () => ({ buildMeetingUrl: vi.fn((id: string) => `https://meet.test/${id}`) }));
vi.mock("@/lib/session-pricing", () => ({
  getSessionPrice: vi.fn().mockResolvedValue(180),
}));
vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: vi.fn().mockReturnValue(false),
  createCheckoutSession: vi.fn().mockResolvedValue(null),
  refundPayment: vi.fn().mockResolvedValue(null),
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field: string, value: unknown) => ({ op: "eq", field, value })),
  ne: vi.fn((field: string, value: unknown) => ({ op: "ne", field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ op: "and", conditions })),
  lt: vi.fn((field: string, value: unknown) => ({ op: "lt", field, value })),
  gt: vi.fn((field: string, value: unknown) => ({ op: "gt", field, value })),
  desc: vi.fn((field: string) => ({ field })),
}));
vi.mock("@/db/schema", () => ({
  patients: {
    __table: "patients",
    id: "id",
    userId: "userId",
    name: "name",
    consentAcceptedAt: "consentAcceptedAt",
  },
  appointments: {
    __table: "appointments",
    id: "id",
    patientId: "patientId",
    date: "date",
    startTime: "startTime",
    endTime: "endTime",
    modality: "modality",
    status: "status",
    therapistFeedback: "therapistFeedback",
    patientNotes: "patientNotes",
    notes: "notes",
    meetingUrl: "meetingUrl",
    updatedAt: "updatedAt",
  },
  clinicalRecords: {
    __table: "clinicalRecords",
    id: "id",
    patientId: "patientId",
    sessionDate: "sessionDate",
    private: "private",
  },
  notifications: {
    __table: "notifications",
    id: "id",
    type: "type",
    title: "title",
    message: "message",
    patientId: "patientId",
    appointmentId: "appointmentId",
  },
  payments: {
    __table: "payments",
    id: "id",
    appointmentId: "appointmentId",
    status: "status",
    stripePaymentIntentId: "stripePaymentIntentId",
  },
  settings: {
    __table: "settings",
    key: "key",
    value: "value",
  },
}));

import { PUT as updateAppointmentPut } from "@/app/api/appointments/[id]/route";
import { POST as cancelAppointmentPost } from "@/app/api/portal/appointments/[id]/cancel/route";
import { GET as evolutionGet } from "@/app/api/portal/evolution/route";
import { GET as consentGet, POST as consentPost } from "@/app/api/portal/consent/route";

function request(body?: Record<string, unknown>, url = "http://localhost:3000/api/test") {
  return {
    url,
    json: async () => body ?? {},
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("Portal bilateral flow", () => {
  it("permite terapeuta registrar feedback e paciente enxergar a evolução", async () => {
    mocks.seed({
      patients: [{ id: "patient-1", userId: "user-patient", name: "Ana" }],
      appointments: [{
        id: "apt-1",
        patientId: "patient-1",
        date: "2026-05-20",
        startTime: "09:00",
        endTime: "10:00",
        modality: "online",
        status: "confirmed",
        meetingUrl: null,
        notes: null,
        therapistFeedback: null,
        patientNotes: "Cheguei mais regulada esta semana.",
      }],
      clinicalRecords: [{
        id: "record-1",
        patientId: "patient-1",
        sessionDate: "2026-05-20T09:00:00.000Z",
        private: false,
      }],
    });

    mocks.setSession({ user: { id: "therapist-1", role: "therapist" } });
    const adminResponse = await updateAppointmentPut(
      request({ status: "completed", therapistFeedback: "Boa evolução, manter rotina de respiração." }),
      { params: Promise.resolve({ id: "apt-1" }) }
    );
    const updatedAppointment = await adminResponse.json();

    expect(adminResponse.status).toBe(200);
    expect(updatedAppointment.therapistFeedback).toContain("Boa evolução");
    expect(mocks.getCreateNotificationCalls()).toHaveLength(1);

    mocks.setSession({ user: { id: "user-patient", role: "patient" } });
    const patientResponse = await evolutionGet();
    const patientBody = await patientResponse.json();

    expect(patientResponse.status).toBe(200);
    expect(patientBody.totalSessions).toBe(1);
    expect(patientBody.sessions[0].therapistFeedback).toContain("Boa evolução");
    expect(patientBody.records).toHaveLength(1);
  });

  it("impede paciente de usar endpoint administrativo de atualização", async () => {
    mocks.seed({
      patients: [{ id: "patient-1", userId: "user-patient", name: "Ana" }],
      appointments: [{
        id: "apt-1",
        patientId: "patient-1",
        date: "2026-05-20",
        startTime: "09:00",
        endTime: "10:00",
        modality: "online",
        status: "confirmed",
      }],
    });
    mocks.setSession({ user: { id: "user-patient", role: "patient" } });

    const response = await updateAppointmentPut(
      request({ therapistFeedback: "Tentativa indevida" }),
      { params: Promise.resolve({ id: "apt-1" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Acesso negado");
  });

  it("permite paciente cancelar sessão futura com mais de 24h de antecedência", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T10:00:00.000Z"));

    mocks.seed({
      patients: [{ id: "patient-1", userId: "user-patient", name: "Ana" }],
      appointments: [{
        id: "apt-2",
        patientId: "patient-1",
        date: "2026-05-20",
        startTime: "12:00",
        endTime: "13:00",
        modality: "online",
        status: "confirmed",
      }],
    });
    mocks.setSession({ user: { id: "user-patient", role: "patient" } });

    const response = await cancelAppointmentPost(request(), {
      params: Promise.resolve({ id: "apt-2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("cancelada com sucesso");
    expect(mocks.getState().appointments[0].status).toBe("cancelled");
    expect(mocks.getCreateNotificationCalls()).toHaveLength(1);
  });

  it("bloqueia cancelamento com menos de 24h de antecedência", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T15:30:00.000Z"));

    mocks.seed({
      patients: [{ id: "patient-1", userId: "user-patient", name: "Ana" }],
      appointments: [{
        id: "apt-3",
        patientId: "patient-1",
        date: "2026-05-20",
        startTime: "09:00",
        endTime: "10:00",
        modality: "online",
        status: "confirmed",
      }],
    });
    mocks.setSession({ user: { id: "user-patient", role: "patient" } });

    const response = await cancelAppointmentPost(request(), {
      params: Promise.resolve({ id: "apt-3" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("24h");
    expect(mocks.getState().appointments[0].status).toBe("confirmed");
  });

  it("persiste e retorna o consentimento LGPD do paciente", async () => {
    mocks.seed({
      patients: [{ id: "patient-1", userId: "user-patient", name: "Ana", consentAcceptedAt: null }],
    });
    mocks.setSession({ user: { id: "user-patient", role: "patient" } });

    const beforeResponse = await consentGet();
    const beforeBody = await beforeResponse.json();
    expect(beforeResponse.status).toBe(200);
    expect(beforeBody.consentAcceptedAt).toBeNull();

    const postResponse = await consentPost();
    const postBody = await postResponse.json();
    expect(postResponse.status).toBe(200);
    expect(postBody.ok).toBe(true);

    const afterResponse = await consentGet();
    const afterBody = await afterResponse.json();
    expect(afterResponse.status).toBe(200);
    expect(afterBody.consentAcceptedAt).toBeTruthy();
  });
});
