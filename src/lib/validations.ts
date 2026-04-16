import { z } from "zod";

/* ============================================================
 * Zod validation schemas for API route inputs.
 * Import and use: schema.parse(body) or schema.safeParse(body)
 * ============================================================ */

/* ── Shared helpers ── */
const uuidField = z.string().uuid("ID inválido");
const optionalUuid = z.string().uuid("ID inválido").optional();
const optionalString = z.string().optional();
const requiredString = (label: string) => z.string().min(1, `${label} é obrigatório`);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD");
const timeString = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora deve estar no formato HH:MM");
const positiveDecimal = z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor deve ser numérico com até 2 casas decimais");
const optionalFormString = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().optional());
const honeypotField = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  return value.trim();
}, z.string().max(0, "Bot detectado.").optional());

/* ── Auth ── */
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  turnstileToken: optionalFormString,
  website: honeypotField,
});

export const registerSchema = z.object({
  name: requiredString("Nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  phone: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().min(10, "Telefone inválido").optional()
  ),
  accountType: z.enum(["patient", "therapist"]).default("patient"),
  clinicName: z.string().min(2, "Nome do consultório deve ter pelo menos 2 caracteres").max(100).optional(),
  crp: z.string().min(5, "CRP inválido").max(20).optional(),
  turnstileToken: optionalFormString,
  website: honeypotField,
}).refine(
  (data) => data.accountType !== "therapist" || (data.clinicName && data.clinicName.trim().length >= 2),
  { message: "Nome do consultório é obrigatório para psicólogos.", path: ["clinicName"] }
);

/* ── Password Recovery ── */
export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
  turnstileToken: optionalFormString,
  website: honeypotField,
});

export const resetPasswordSchema = z.object({
  token: requiredString("Token"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const changePasswordSchema = z.object({
  currentPassword: requiredString("Senha atual"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
});

/* ── Patients ── */
export const createPatientSchema = z.object({
  name: requiredString("Nome"),
  email: z.string().email("E-mail inválido").optional(),
  phone: requiredString("Telefone"),
  cpf: z.string().optional(),
  birthDate: dateString.optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

/* ── Appointments ── */
export const createAppointmentSchema = z.object({
  patientId: uuidField,
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  modality: z.literal("online").optional(),
  status: z.enum(["pending", "confirmed"]).optional(),
  notes: optionalString,
  recurrenceType: z.enum(["weekly", "biweekly"]).optional(),
});

export const updateAppointmentSchema = z.object({
  date: dateString.optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  modality: z.literal("online").optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  notes: optionalString,
  meetingUrl: z.string().url("URL inválida").optional().nullable(),
  therapistFeedback: optionalString,
});

/* ── Payments ── */
export const createPaymentSchema = z.object({
  patientId: uuidField,
  appointmentId: optionalUuid,
  amount: positiveDecimal,
  method: z.enum(["pix", "credit_card", "debit_card", "bank_transfer", "cash", "stripe"]).optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled", "refunded"]).optional(),
  dueDate: dateString.optional(),
  description: optionalString,
});

export const updatePaymentSchema = z.object({
  amount: positiveDecimal.optional(),
  method: z.enum(["pix", "credit_card", "debit_card", "bank_transfer", "cash", "stripe"]).optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled", "refunded"]).optional(),
  dueDate: dateString.optional(),
  paidAt: z.string().optional().nullable(),
  description: optionalString,
});

/* ── Stripe Checkout ── */
export const createCheckoutSchema = z.object({
  paymentId: uuidField,
});

/* ── Clinical Records ── */
export const createClinicalRecordSchema = z.object({
  patientId: uuidField,
  sessionDate: z.string().min(1, "Data da sessão é obrigatória"),
  sessionNumber: z.number().int().positive().optional(),
  chiefComplaint: optionalString,
  clinicalNotes: optionalString,
  interventions: optionalString,
  homework: optionalString,
  mood: optionalString,
  riskAssessment: optionalString,
  nextSessionPlan: optionalString,
  private: z.boolean().optional(),
});

export const updateClinicalRecordSchema = createClinicalRecordSchema.partial();

/* ── Blog Posts ── */
export const createBlogPostSchema = z.object({
  title: requiredString("Título"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hifens"),
  excerpt: optionalString,
  content: requiredString("Conteúdo"),
  coverImage: z.string().url("URL da imagem inválida").optional(),
  category: optionalString,
  tags: optionalString,
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

/* ── Groups ── */
export const createGroupSchema = z.object({
  name: requiredString("Nome do grupo"),
  description: optionalString,
  modality: z.literal("online").optional(),
  dayOfWeek: optionalString,
  time: timeString.optional(),
  maxParticipants: z.number().int().min(2).max(50).optional(),
  price: positiveDecimal.optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

/* ── Contact Form ── */
export const contactSchema = z.object({
  name: requiredString("Nome"),
  email: z.string().email("E-mail inválido"),
  subject: requiredString("Assunto"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
  turnstileToken: optionalFormString,
  website: honeypotField,
});

/* ── Availability ── */
export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
});

/* ── Settings ── */
export const updateSettingSchema = z.object({
  key: requiredString("Chave"),
  value: z.unknown(),
});

/* ── Triagem ── */
export const createTriageSchema = z.object({
  appointmentId: uuidField,
  mood: optionalString,
  sleepQuality: optionalString,
  anxietyLevel: z.number().int().min(0).max(10).optional(),
  mainConcern: optionalString,
  recentEvents: optionalString,
  medicationChanges: optionalString,
  additionalNotes: optionalString,
});

/* ── Blocked Dates ── */
export const createBlockedDateSchema = z.object({
  date: dateString,
  reason: optionalString,
});

/* ── Helper: format Zod errors for API responses ── */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}
