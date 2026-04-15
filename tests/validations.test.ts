/**
 * Tests for Zod validation schemas.
 * Covers: accept valid input, reject invalid input, edge cases, formatZodError helper.
 */
import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  createPatientSchema,
  createAppointmentSchema,
  createPaymentSchema,
  updatePaymentSchema,
  createCheckoutSchema,
  createBlogPostSchema,
  contactSchema,
  createAvailabilitySchema,
  createTriageSchema,
  createBlockedDateSchema,
  formatZodError,
} from "@/lib/validations";

/* ============================================================
 * 1. Auth Schemas
 * ============================================================ */
describe("loginSchema", () => {
  it("should accept valid login", () => {
    const result = loginSchema.safeParse({ email: "bea@psicolobia.com.br", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = loginSchema.safeParse({ email: "bea@test.com", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("should reject missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("should accept valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Beatriz Silva",
      email: "bea@test.com",
      password: "Segura@123",
    });
    expect(result.success).toBe(true);
  });

  it("should require password >= 8 chars", () => {
    const result = registerSchema.safeParse({
      name: "Beatriz",
      email: "bea@test.com",
      password: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional phone", () => {
    const result = registerSchema.safeParse({
      name: "Beatriz",
      email: "bea@test.com",
      password: "Segura@123",
      phone: "11988840525",
    });
    expect(result.success).toBe(true);
  });

  it("should accept blank phone from controlled forms", () => {
    const result = registerSchema.safeParse({
      name: "Beatriz",
      email: "bea@test.com",
      password: "Segura@123",
      phone: "",
    });
    expect(result.success).toBe(true);
  });
});

/* ============================================================
 * 2. Patient Schema
 * ============================================================ */
describe("createPatientSchema", () => {
  it("should accept valid patient with required fields only", () => {
    const result = createPatientSchema.safeParse({
      name: "João da Silva",
      phone: "11999998888",
    });
    expect(result.success).toBe(true);
  });

  it("should accept patient with all optional fields", () => {
    const result = createPatientSchema.safeParse({
      name: "Maria",
      phone: "11999998888",
      email: "maria@test.com",
      cpf: "123.456.789-00",
      birthDate: "1990-01-15",
      gender: "feminino",
      address: "Rua das Flores, 123",
      emergencyContact: "José",
      emergencyPhone: "11988887777",
      notes: "Paciente com histórico de ansiedade",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing name", () => {
    const result = createPatientSchema.safeParse({ phone: "11999998888" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid birthDate format", () => {
    const result = createPatientSchema.safeParse({
      name: "João",
      phone: "11999998888",
      birthDate: "15/01/1990",
    });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 3. Appointment Schema
 * ============================================================ */
describe("createAppointmentSchema", () => {
  const validAppointment = {
    patientId: "550e8400-e29b-41d4-a716-446655440000",
    date: "2026-04-01",
    startTime: "09:00",
    endTime: "10:00",
  };

  it("should accept valid appointment", () => {
    const result = createAppointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for patientId", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, patientId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid date format", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, date: "01/04/2026" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid time format", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, startTime: "9am" });
    expect(result.success).toBe(false);
  });

  it("should accept time with seconds", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, startTime: "09:00:00" });
    expect(result.success).toBe(true);
  });

  it("should accept optional recurrenceType", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, recurrenceType: "weekly" });
    expect(result.success).toBe(true);
  });

  it("should accept optional initial status", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, status: "confirmed" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid recurrenceType", () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, recurrenceType: "monthly" });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 4. Payment Schema
 * ============================================================ */
describe("createPaymentSchema", () => {
  const validPayment = {
    patientId: "550e8400-e29b-41d4-a716-446655440000",
    amount: "150.00",
  };

  it("should accept valid payment with required fields", () => {
    const result = createPaymentSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });

  it("should accept stripe as payment method", () => {
    const result = createPaymentSchema.safeParse({ ...validPayment, method: "stripe" });
    expect(result.success).toBe(true);
  });

  it("should accept all valid payment methods", () => {
    for (const method of ["pix", "credit_card", "debit_card", "bank_transfer", "cash", "stripe"]) {
      const result = createPaymentSchema.safeParse({ ...validPayment, method });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid payment method", () => {
    const result = createPaymentSchema.safeParse({ ...validPayment, method: "bitcoin" });
    expect(result.success).toBe(false);
  });

  it("should reject non-numeric amount", () => {
    const result = createPaymentSchema.safeParse({ ...validPayment, amount: "abc" });
    expect(result.success).toBe(false);
  });

  it("should reject amount with more than 2 decimal places", () => {
    const result = createPaymentSchema.safeParse({ ...validPayment, amount: "150.123" });
    expect(result.success).toBe(false);
  });

  it("should accept amount without decimals", () => {
    const result = createPaymentSchema.safeParse({ ...validPayment, amount: "150" });
    expect(result.success).toBe(true);
  });
});

describe("updatePaymentSchema", () => {
  it("should accept partial update", () => {
    const result = updatePaymentSchema.safeParse({ status: "paid" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status", () => {
    const result = updatePaymentSchema.safeParse({ status: "processing" });
    expect(result.success).toBe(false);
  });

  it("should accept empty object (all optional)", () => {
    const result = updatePaymentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept nullable paidAt", () => {
    const result = updatePaymentSchema.safeParse({ paidAt: null });
    expect(result.success).toBe(true);
  });
});

/* ============================================================
 * 5. Stripe Checkout Schema
 * ============================================================ */
describe("createCheckoutSchema", () => {
  it("should accept valid UUID paymentId", () => {
    const result = createCheckoutSchema.safeParse({
      paymentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid paymentId", () => {
    const result = createCheckoutSchema.safeParse({ paymentId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("should reject missing paymentId", () => {
    const result = createCheckoutSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 6. Blog Post Schema
 * ============================================================ */
describe("createBlogPostSchema", () => {
  it("should accept valid blog post", () => {
    const result = createBlogPostSchema.safeParse({
      title: "Como lidar com ansiedade",
      slug: "como-lidar-com-ansiedade",
      content: "A ansiedade é uma resposta natural...",
    });
    expect(result.success).toBe(true);
  });

  it("should reject slug with uppercase", () => {
    const result = createBlogPostSchema.safeParse({
      title: "Test",
      slug: "UPPERCASE-Slug",
      content: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("should reject slug with spaces", () => {
    const result = createBlogPostSchema.safeParse({
      title: "Test",
      slug: "slug with spaces",
      content: "Content",
    });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 7. Contact Schema
 * ============================================================ */
describe("contactSchema", () => {
  it("should accept valid contact form", () => {
    const result = contactSchema.safeParse({
      name: "Paciente",
      email: "paciente@test.com",
      subject: "Consulta",
      message: "Gostaria de agendar uma sessão de terapia.",
    });
    expect(result.success).toBe(true);
  });

  it("should reject message shorter than 10 chars", () => {
    const result = contactSchema.safeParse({
      name: "P",
      email: "p@t.com",
      subject: "A",
      message: "Short",
    });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 8. Availability Schema
 * ============================================================ */
describe("createAvailabilitySchema", () => {
  it("should accept valid availability", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(true);
  });

  it("should reject dayOfWeek > 6", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: 7,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });

  it("should reject dayOfWeek < 0", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: -1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 9. Triagem Schema
 * ============================================================ */
describe("createTriageSchema", () => {
  it("should accept valid triagem", () => {
    const result = createTriageSchema.safeParse({
      appointmentId: "550e8400-e29b-41d4-a716-446655440000",
      mood: "ansioso",
      anxietyLevel: 7,
    });
    expect(result.success).toBe(true);
  });

  it("should reject anxietyLevel > 10", () => {
    const result = createTriageSchema.safeParse({
      appointmentId: "550e8400-e29b-41d4-a716-446655440000",
      anxietyLevel: 11,
    });
    expect(result.success).toBe(false);
  });

  it("should reject anxietyLevel < 0", () => {
    const result = createTriageSchema.safeParse({
      appointmentId: "550e8400-e29b-41d4-a716-446655440000",
      anxietyLevel: -1,
    });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 10. Blocked Date Schema
 * ============================================================ */
describe("createBlockedDateSchema", () => {
  it("should accept valid blocked date", () => {
    const result = createBlockedDateSchema.safeParse({
      date: "2026-12-25",
      reason: "Natal",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid date format", () => {
    const result = createBlockedDateSchema.safeParse({
      date: "25/12/2026",
    });
    expect(result.success).toBe(false);
  });
});

/* ============================================================
 * 11. formatZodError Helper
 * ============================================================ */
describe("formatZodError", () => {
  it("should format single error", () => {
    const result = loginSchema.safeParse({ email: "bad", password: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = formatZodError(result.error);
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("should format multiple errors separated by semicolons", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = formatZodError(result.error);
      expect(msg).toContain(";");
    }
  });

  it("should include field path", () => {
    const result = createPaymentSchema.safeParse({ patientId: "bad-uuid", amount: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = formatZodError(result.error);
      expect(msg).toContain("patientId");
      expect(msg).toContain("amount");
    }
  });
});
