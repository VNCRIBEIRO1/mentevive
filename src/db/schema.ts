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
  uniqueIndex,
  index,
  jsonb,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ========== ENUMS ========== */
export const platformRoleEnum = pgEnum("platform_role", ["superadmin", "user"]);
export const membershipRoleEnum = pgEnum("membership_role", ["admin", "therapist", "patient"]);
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
export const tenantPlanEnum = pgEnum("tenant_plan", ["free", "starter", "professional", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
]);

/* ========== TENANTS ========== */
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 63 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  landingDomain: varchar("landing_domain", { length: 255 }),
  branding: jsonb("branding"), // { logo, primaryColor, accentColor, ... }
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false).notNull(),
  // Platform subscription billing
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEndsAt: timestamp("trial_ends_at"),
  plan: tenantPlanEnum("plan").default("free").notNull(),
  maxPatients: integer("max_patients").default(50),
  maxAppointmentsPerMonth: integer("max_appointments_per_month").default(200),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ========== TENANT MEMBERSHIPS ========== */
export const tenantMemberships = pgTable("tenant_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  role: membershipRoleEnum("role").default("patient").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("tenant_memberships_user_tenant_unique").on(table.userId, table.tenantId),
  index("idx_tenant_memberships_user").on(table.userId),
  index("idx_tenant_memberships_tenant").on(table.tenantId),
]);

/* ========== USERS ========== */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("patient").notNull(), // legacy — kept for backward compat during migration
  platformRole: platformRoleEnum("platform_role").default("user").notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
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
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
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
}, (table) => [
  uniqueIndex("patients_tenant_user_unique").on(table.tenantId, table.userId),
  uniqueIndex("patients_tenant_id_unique").on(table.tenantId, table.id),
  index("idx_patients_tenant").on(table.tenantId),
]);

/* ========== CLINICAL RECORDS (Prontuário) ========== */
export const clinicalRecords = pgTable("clinical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull(),
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
}, (table) => [
  index("idx_clinical_records_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.patientId],
    foreignColumns: [patients.tenantId, patients.id],
    name: "clinical_records_tenant_patient_fk",
  }).onDelete("cascade"),
]);

/* ========== APPOINTMENTS ========== */
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull(),
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
}, (table) => [
  uniqueIndex("appointments_tenant_id_unique").on(table.tenantId, table.id),
  index("idx_appointments_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.patientId],
    foreignColumns: [patients.tenantId, patients.id],
    name: "appointments_tenant_patient_fk",
  }).onDelete("cascade"),
]);

/* ========== AVAILABILITY ========== */
export const availability = pgTable("availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  active: boolean("active").default(true).notNull(),
});

/* ========== PAYMENTS ========== */
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull(),
  appointmentId: uuid("appointment_id"),
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
}, (table) => [
  uniqueIndex("payments_tenant_id_unique").on(table.tenantId, table.id),
  index("idx_payments_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.patientId],
    foreignColumns: [patients.tenantId, patients.id],
    name: "payments_tenant_patient_fk",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tenantId, table.appointmentId],
    foreignColumns: [appointments.tenantId, appointments.id],
    name: "payments_tenant_appointment_fk",
  }),
]);

/* ========== DOCUMENTS ========== */
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_documents_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.patientId],
    foreignColumns: [patients.tenantId, patients.id],
    name: "documents_tenant_patient_fk",
  }).onDelete("cascade"),
]);

/* ========== BLOG POSTS ========== */
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
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
}, (table) => [
  uniqueIndex("blog_posts_tenant_slug_unique").on(table.tenantId, table.slug),
  index("idx_blog_posts_tenant").on(table.tenantId),
]);

/* ========== GROUPS ========== */
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  modality: sessionModalityEnum("modality").default("online").notNull(),
  dayOfWeek: varchar("day_of_week", { length: 20 }),
  time: time("time"),
  maxParticipants: integer("max_participants").default(8),
  price: decimal("price", { precision: 10, scale: 2 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("groups_tenant_id_unique").on(table.tenantId, table.id),
  index("idx_groups_tenant").on(table.tenantId),
]);

export const groupMembers = pgTable("group_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull(),
  patientId: uuid("patient_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
}, (table) => [
  index("idx_group_members_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.groupId],
    foreignColumns: [groups.tenantId, groups.id],
    name: "group_members_tenant_group_fk",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tenantId, table.patientId],
    foreignColumns: [patients.tenantId, patients.id],
    name: "group_members_tenant_patient_fk",
  }).onDelete("cascade"),
]);

/* ========== TRIAGES (pre-session intake) ========== */
export const triages = pgTable("triages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").notNull().unique(),
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
}, (table) => [
  index("idx_triages_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.appointmentId],
    foreignColumns: [appointments.tenantId, appointments.id],
    name: "triages_tenant_appointment_fk",
  }).onDelete("cascade"),
]);

/* ========== BLOCKED DATES (admin blocks specific dates) ========== */
export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("blocked_dates_tenant_date_unique").on(table.tenantId, table.date),
  index("idx_blocked_dates_tenant").on(table.tenantId),
]);

/* ========== SETTINGS (key-value store for pricing, areas, config) ========== */
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("settings_tenant_key_unique").on(table.tenantId, table.key),
  index("idx_settings_tenant").on(table.tenantId),
]);

/* ========== NOTIFICATIONS ========== */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // triage, appointment, payment, registration, status_change
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  icon: varchar("icon", { length: 10 }),
  linkUrl: varchar("link_url", { length: 500 }),
  patientId: uuid("patient_id"),
  appointmentId: uuid("appointment_id"),
  paymentId: uuid("payment_id"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_notifications_tenant").on(table.tenantId),
  foreignKey({
    columns: [table.tenantId, table.patientId],
    foreignColumns: [patients.tenantId, patients.id],
    name: "notifications_tenant_patient_fk",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tenantId, table.appointmentId],
    foreignColumns: [appointments.tenantId, appointments.id],
    name: "notifications_tenant_appointment_fk",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tenantId, table.paymentId],
    foreignColumns: [payments.tenantId, payments.id],
    name: "notifications_tenant_payment_fk",
  }).onDelete("cascade"),
]);

/* ========== CDKEYS (Activation Codes) ========== */
export const cdkeys = pgTable("cdkeys", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 32 }).unique().notNull(),
  plan: tenantPlanEnum("plan").default("starter").notNull(), // plan granted upon redemption
  durationDays: integer("duration_days").default(30).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at"),
  createdBy: uuid("created_by").references(() => users.id), // superadmin who created it
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_cdkeys_code").on(table.code),
  index("idx_cdkeys_tenant").on(table.tenantId),
]);

/* ========== RELATIONS ========== */

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, { fields: [tenants.ownerUserId], references: [users.id] }),
  memberships: many(tenantMemberships),
  patients: many(patients),
  appointments: many(appointments),
  availability: many(availability),
  clinicalRecords: many(clinicalRecords),
  payments: many(payments),
  documents: many(documents),
  blogPosts: many(blogPosts),
  groups: many(groups),
  groupMembers: many(groupMembers),
  triages: many(triages),
  blockedDates: many(blockedDates),
  settings: many(settings),
  notifications: many(notifications),
  cdkeys: many(cdkeys),
}));

export const tenantMembershipsRelations = relations(tenantMemberships, ({ one }) => ({
  user: one(users, { fields: [tenantMemberships.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [tenantMemberships.tenantId], references: [tenants.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(tenantMemberships),
  blogPosts: many(blogPosts),
  passwordResetTokens: many(passwordResetTokens),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  tenant: one(tenants, { fields: [patients.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  appointments: many(appointments),
  clinicalRecords: many(clinicalRecords),
  payments: many(payments),
  documents: many(documents),
  groupMemberships: many(groupMembers),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  tenant: one(tenants, { fields: [appointments.tenantId], references: [tenants.id] }),
  patient: one(patients, { fields: [appointments.tenantId, appointments.patientId], references: [patients.tenantId, patients.id] }),
  payments: many(payments),
}));

export const clinicalRecordsRelations = relations(clinicalRecords, ({ one }) => ({
  tenant: one(tenants, { fields: [clinicalRecords.tenantId], references: [tenants.id] }),
  patient: one(patients, { fields: [clinicalRecords.tenantId, clinicalRecords.patientId], references: [patients.tenantId, patients.id] }),
  therapist: one(users, { fields: [clinicalRecords.therapistId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, { fields: [payments.tenantId], references: [tenants.id] }),
  patient: one(patients, { fields: [payments.tenantId, payments.patientId], references: [patients.tenantId, patients.id] }),
  appointment: one(appointments, { fields: [payments.tenantId, payments.appointmentId], references: [appointments.tenantId, appointments.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  tenant: one(tenants, { fields: [documents.tenantId], references: [tenants.id] }),
  patient: one(patients, { fields: [documents.tenantId, documents.patientId], references: [patients.tenantId, patients.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  tenant: one(tenants, { fields: [blogPosts.tenantId], references: [tenants.id] }),
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  tenant: one(tenants, { fields: [groups.tenantId], references: [tenants.id] }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  tenant: one(tenants, { fields: [groupMembers.tenantId], references: [tenants.id] }),
  group: one(groups, { fields: [groupMembers.tenantId, groupMembers.groupId], references: [groups.tenantId, groups.id] }),
  patient: one(patients, { fields: [groupMembers.tenantId, groupMembers.patientId], references: [patients.tenantId, patients.id] }),
}));

export const triagesRelations = relations(triages, ({ one }) => ({
  tenant: one(tenants, { fields: [triages.tenantId], references: [tenants.id] }),
  appointment: one(appointments, { fields: [triages.tenantId, triages.appointmentId], references: [appointments.tenantId, appointments.id] }),
}));

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
  tenant: one(tenants, { fields: [blockedDates.tenantId], references: [tenants.id] }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  tenant: one(tenants, { fields: [settings.tenantId], references: [tenants.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, { fields: [notifications.tenantId], references: [tenants.id] }),
  patient: one(patients, { fields: [notifications.tenantId, notifications.patientId], references: [patients.tenantId, patients.id] }),
  appointment: one(appointments, { fields: [notifications.tenantId, notifications.appointmentId], references: [appointments.tenantId, appointments.id] }),
  payment: one(payments, { fields: [notifications.tenantId, notifications.paymentId], references: [payments.tenantId, payments.id] }),
}));

export const cdkeysRelations = relations(cdkeys, ({ one }) => ({
  tenant: one(tenants, { fields: [cdkeys.tenantId], references: [tenants.id] }),
  creator: one(users, { fields: [cdkeys.createdBy], references: [users.id] }),
}));
