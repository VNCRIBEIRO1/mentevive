import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ========== ENUMS ========== */
export const userRoleEnum = pgEnum("user_role", ["admin", "therapist", "patient"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);
export const sessionModalityEnum = pgEnum("session_modality", ["online", "presencial"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "cash",
  "stripe",
]);
export const blogStatusEnum = pgEnum("blog_status", ["draft", "published", "archived"]);

/* ========== USERS ========== */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("patient").notNull(),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== PASSWORD RESET TOKENS ========== */
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ========== PATIENTS ========== */
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").unique().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 20 }),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 255 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  notes: text("notes"),
  consentAcceptedAt: timestamp("consent_accepted_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== CLINICAL RECORDS (Prontuário) ========== */
export const clinicalRecords = pgTable("clinical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  therapistId: uuid("therapist_id").references(() => users.id),
  sessionDate: timestamp("session_date").notNull(),
  sessionNumber: integer("session_number"),
  chiefComplaint: text("chief_complaint"),
  clinicalNotes: text("clinical_notes"),
  interventions: text("interventions"),
  homework: text("homework"),
  mood: varchar("mood", { length: 50 }),
  riskAssessment: text("risk_assessment"),
  nextSessionPlan: text("next_session_plan"),
  private: boolean("private").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== APPOINTMENTS ========== */
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  modality: sessionModalityEnum("modality").default("online").notNull(),
  status: appointmentStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  patientNotes: text("patient_notes"),
  therapistFeedback: text("therapist_feedback"),
  meetingUrl: text("meeting_url"),
  reminderSentAt: timestamp("reminder_sent_at"),
  recurrenceType: varchar("recurrence_type", { length: 20 }), // 'weekly' | 'biweekly' | null
  recurrenceGroupId: uuid("recurrence_group_id"), // groups related recurring sessions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== AVAILABILITY ========== */
export const availability = pgTable("availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  active: boolean("active").default(true).notNull(),
});

/* ========== PAYMENTS ========== */
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  description: text("description"),
  /* ---- Stripe fields ---- */
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),  // Stripe Payment Intent ID
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),              // Stripe Checkout Session ID
  checkoutUrl: text("checkout_url"),                                            // Stripe checkout redirect URL
  externalReference: varchar("external_reference", { length: 100 }),            // Our payment UUID sent to Stripe
  stripeStatus: varchar("stripe_status", { length: 50 }),                       // Raw Stripe status string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== DOCUMENTS ========== */
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ========== BLOG POSTS ========== */
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  category: varchar("category", { length: 100 }),
  tags: text("tags"),
  status: blogStatusEnum("status").default("draft").notNull(),
  authorId: uuid("author_id").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== GROUPS ========== */
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  modality: sessionModalityEnum("modality").default("online").notNull(),
  dayOfWeek: varchar("day_of_week", { length: 20 }),
  time: time("time"),
  maxParticipants: integer("max_participants").default(8),
  price: decimal("price", { precision: 10, scale: 2 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  patientId: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

/* ========== TRIAGES (pre-session intake) ========== */
export const triages = pgTable("triages", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id")
    .references(() => appointments.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  mood: varchar("mood", { length: 50 }),
  sleepQuality: varchar("sleep_quality", { length: 50 }),
  anxietyLevel: integer("anxiety_level"),
  mainConcern: text("main_concern"),
  recentEvents: text("recent_events"),
  medicationChanges: text("medication_changes"),
  additionalNotes: text("additional_notes"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== BLOCKED DATES (admin blocks specific dates) ========== */
export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull().unique(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ========== SETTINGS (key-value store for pricing, areas, config) ========== */
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== NOTIFICATIONS ========== */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // triage, appointment, payment, registration, status_change
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  icon: varchar("icon", { length: 10 }),
  linkUrl: varchar("link_url", { length: 500 }),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ========== RELATIONS ========== */
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  blogPosts: many(blogPosts),
  passwordResetTokens: many(passwordResetTokens),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  appointments: many(appointments),
  clinicalRecords: many(clinicalRecords),
  payments: many(payments),
  documents: many(documents),
  groupMemberships: many(groupMembers),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  payments: many(payments),
}));

export const clinicalRecordsRelations = relations(clinicalRecords, ({ one }) => ({
  patient: one(patients, { fields: [clinicalRecords.patientId], references: [patients.id] }),
  therapist: one(users, { fields: [clinicalRecords.therapistId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  patient: one(patients, { fields: [payments.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [payments.appointmentId], references: [appointments.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  patient: one(patients, { fields: [groupMembers.patientId], references: [patients.id] }),
}));

export const triagesRelations = relations(triages, ({ one }) => ({
  appointment: one(appointments, { fields: [triages.appointmentId], references: [appointments.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  patient: one(patients, { fields: [notifications.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [notifications.appointmentId], references: [appointments.id] }),
  payment: one(payments, { fields: [notifications.paymentId], references: [payments.id] }),
}));
