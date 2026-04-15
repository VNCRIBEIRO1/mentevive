/**
 * Seed focado: limpa banco → cria admin + Lia → 2 sessões (1 em 10min, 1 finalizada entre elas)
 * Uso: npx tsx scripts/seed-lia-test.ts
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { db } from "../src/lib/db";
import {
  appointments,
  availability,
  clinicalRecords,
  notifications,
  patients,
  payments,
  settings,
  users,
} from "../src/db/schema";
import { buildMeetingUrl } from "../src/lib/jitsi";

/* ---- helpers ---- */
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");

function fmtDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("sv-SE", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60_000);
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60_000);
}

function getSeedValue(envKey: string, fallback: string) {
  const value = process.env[envKey]?.trim();
  return value || fallback;
}

function getSeedPassword(envKey: string) {
  const value = process.env[envKey]?.trim();
  if (value) return value;
  return `Seed-${randomBytes(6).toString("hex")}`;
}

async function truncateAll() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurado.");
  const sql = neon(process.env.DATABASE_URL);

  // Ensure patient_notes column exists
  await sql.query("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_notes text");

  await sql.query(`
    TRUNCATE TABLE
      notifications,
      triages,
      clinical_records,
      documents,
      group_members,
      groups,
      payments,
      appointments,
      patients,
      blog_posts,
      users,
      blocked_dates,
      availability,
      settings
    RESTART IDENTITY CASCADE
  `);
}

async function main() {
  console.log("🧹 Limpando banco de dados...");
  await truncateAll();

  const now = new Date();

  /* ========== 1. Credenciais ========== */
  const adminCreds = {
    email: getSeedValue("SEED_LIA_ADMIN_EMAIL", "admin.seed@psicolobia.test"),
    password: getSeedPassword("SEED_LIA_ADMIN_PASSWORD"),
  };
  const liaCreds = {
    email: getSeedValue("SEED_LIA_PATIENT_EMAIL", "lia.monteiro@psicolobia.test"),
    password: getSeedPassword("SEED_LIA_PATIENT_PASSWORD"),
  };

  /* ========== 2. Admin ========== */
  console.log("👤 Criando admin...");
  const adminHash = await bcrypt.hash(adminCreds.password, 12);
  await db.insert(users).values({
    name: "Beatriz (Bea)",
    email: adminCreds.email,
    password: adminHash,
    role: "admin",
    phone: "11988840525",
    active: true,
  });

  /* ========== 3. Lia (paciente) ========== */
  console.log("👤 Criando paciente Lia...");
  const liaHash = await bcrypt.hash(liaCreds.password, 12);
  const [liaUser] = await db.insert(users).values({
    name: "Lia Monteiro",
    email: liaCreds.email,
    password: liaHash,
    role: "patient",
    phone: "11990000001",
    active: true,
  }).returning();

  const [liaPatient] = await db.insert(patients).values({
    userId: liaUser.id,
    name: "Lia Monteiro",
    email: liaCreds.email,
    phone: "11990000001",
    cpf: "111.111.111-11",
    birthDate: "1995-04-18",
    notes: "Paciente de teste — validação de fluxo admin + portal.",
    active: true,
  }).returning();

  /* ========== 4. Settings + Availability ========== */
  await db.insert(settings).values([
    {
      key: "pricing",
      value: JSON.stringify([
        { key: "individual_online", value: "180.00" },
        { key: "individual_presencial", value: "220.00" },
      ]),
    },
    {
      key: "areas",
      value: JSON.stringify(["Ansiedade", "Relacionamentos", "Autoconhecimento"]),
    },
  ]);

  await db.insert(availability).values(
    Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime: "00:00:00",
      endTime: "23:59:00",
      active: true,
    }))
  );

  /* ========== 5. Sessão FINALIZADA (ontem) ========== */
  console.log("📋 Criando sessão finalizada (ontem)...");
  const yesterdayStart = addDays(now, -1);
  yesterdayStart.setHours(14, 0, 0, 0);

  const [completedSession] = await db.insert(appointments).values({
    patientId: liaPatient.id,
    date: fmtDate(yesterdayStart),
    startTime: "14:00:00",
    endTime: "15:00:00",
    modality: "online",
    status: "completed",
    notes: "Sessão inicial de acolhimento. Paciente relatou dificuldade com ansiedade em contextos sociais.",
    patientNotes: "Me senti muito acolhida na sessão. A Bea me ajudou a entender melhor meus gatilhos de ansiedade. Vou praticar o exercício de respiração 4-6 que ela ensinou. Próxima semana quero falar sobre situações no trabalho.",
    meetingUrl: null, // will set after
  }).returning();

  // Set meeting URL using appointment ID
  await db.update(appointments)
    .set({ meetingUrl: buildMeetingUrl(completedSession.id) })
    .where(eq(appointments.id, completedSession.id));

  /* ========== 6. Sessão AO VIVO (daqui a 10 minutos) ========== */
  console.log("🔴 Criando sessão ao vivo (daqui a 10 minutos)...");
  const liveStart = addMinutes(now, 10);
  const liveEnd = addMinutes(liveStart, 60);

  const [liveSession] = await db.insert(appointments).values({
    patientId: liaPatient.id,
    date: fmtDate(liveStart),
    startTime: fmtTime(liveStart),
    endTime: fmtTime(liveEnd),
    modality: "online",
    status: "confirmed",
    notes: "Sessão de acompanhamento — continuar trabalho sobre ansiedade social.",
    meetingUrl: null,
  }).returning();

  await db.update(appointments)
    .set({ meetingUrl: buildMeetingUrl(liveSession.id) })
    .where(eq(appointments.id, liveSession.id));

  /* ========== 7. Prontuário da sessão finalizada ========== */
  console.log("📝 Criando prontuário clínico...");
  await db.insert(clinicalRecords).values({
    patientId: liaPatient.id,
    sessionDate: yesterdayStart,
    sessionNumber: 1,
    chiefComplaint: "Ansiedade em contextos sociais e dificuldade de se expressar no trabalho.",
    clinicalNotes: "Paciente apresenta padrão de evitação em situações de exposição. Relata pensamentos antecipatórios catastróficos. Boa vinculação terapêutica na primeira sessão.",
    interventions: "Psicoeducação sobre o ciclo da ansiedade (pensamento → sensação → comportamento). Exercício de respiração 4-6.",
    homework: "Praticar respiração 4-6 duas vezes ao dia. Registrar 2 situações de evitação e o que sentiu.",
    mood: "neutro",
    riskAssessment: "Sem risco agudo.",
    nextSessionPlan: "Explorar situações de trabalho e treino de assertividade.",
    private: true,
  });

  /* ========== 8. Pagamentos ========== */
  console.log("💳 Criando pagamentos...");
  await db.insert(payments).values([
    {
      patientId: liaPatient.id,
      appointmentId: completedSession.id,
      amount: "180.00",
      method: "pix",
      status: "paid",
      dueDate: completedSession.date,
      paidAt: addMinutes(yesterdayStart, 90),
      description: "Sessão online — acolhimento inicial",
    },
    {
      patientId: liaPatient.id,
      appointmentId: liveSession.id,
      amount: "180.00",
      method: "stripe",
      status: "pending",
      dueDate: liveSession.date,
      description: "Sessão online — acompanhamento",
      externalReference: liveSession.id,
    },
  ]);

  /* ========== 9. Notificações ========== */
  console.log("🔔 Criando notificações...");
  await db.insert(notifications).values([
    {
      type: "registration",
      title: "Ambiente de teste preparado",
      message: "Banco limpo com admin + Lia. 2 sessões criadas para validação.",
      icon: "🧪",
      linkUrl: "/admin",
    },
    {
      type: "appointment",
      title: "Sessão em 10 minutos",
      message: `Lia Monteiro tem sessão confirmada para ${fmtDate(liveStart)} às ${fmtTime(liveStart)}.`,
      patientId: liaPatient.id,
      appointmentId: liveSession.id,
      linkUrl: "/admin/agenda",
    },
    {
      type: "appointment",
      title: "Sessão finalizada",
      message: `Sessão com Lia Monteiro em ${fmtDate(yesterdayStart)} foi realizada com sucesso.`,
      patientId: liaPatient.id,
      appointmentId: completedSession.id,
      linkUrl: "/admin/prontuarios",
      read: true,
    },
  ]);

  /* ========== Relatório ========== */
  const report = {
    generatedAt: new Date().toISOString(),
    credentials: {
      admin: adminCreds,
      patient: liaCreds,
    },
    sessions: {
      completed: {
        id: completedSession.id,
        date: completedSession.date,
        time: "14:00 - 15:00",
        status: "completed",
        patientNotes: "✅ Anotação simulada salva",
      },
      live: {
        id: liveSession.id,
        date: liveSession.date,
        time: `${fmtTime(liveStart)} - ${fmtTime(liveEnd)}`,
        status: "confirmed",
        waitingRoom: `/portal/sala-espera/${liveSession.id}`,
        meetingUrl: buildMeetingUrl(liveSession.id),
      },
    },
  };

  console.log("\n✅ Seed completo!\n");
  console.log(JSON.stringify(report, null, 2));

  console.log("\n🔐 Credenciais:");
  console.log(`   Admin:    ${adminCreds.email} / ${adminCreds.password}`);
  console.log(`   Lia:      ${liaCreds.email} / ${liaCreds.password}`);
  console.log(`\n📅 Sessão ao vivo: ${fmtDate(liveStart)} às ${fmtTime(liveStart)}`);
  console.log(`   Sala de espera: /portal/sala-espera/${liveSession.id}`);
  console.log(`\n📋 Sessão finalizada: ${completedSession.date} 14:00-15:00 (com anotação do paciente)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  });
