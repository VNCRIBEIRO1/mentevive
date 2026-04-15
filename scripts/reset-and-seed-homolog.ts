import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  appointments,
  availability,
  clinicalRecords,
  documents,
  notifications,
  patients,
  payments,
  settings,
  triages,
  users,
} from "../src/db/schema";
import { buildMeetingUrl } from "../src/lib/jitsi";

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
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");

type ScenarioReport = {
  slug: string;
  patientName: string;
  summary: string;
  portalHighlights: string[];
  adminHighlights: string[];
  appointmentId?: string;
  waitingRoomUrl?: string;
  meetingUrl?: string;
};

type SeedReport = {
  generatedAt: string;
  databaseHost: string;
  credentials: {
    admin: { email: string; password: string };
    therapist: { email: string; password: string };
    patients: Array<{ label: string; email: string; password: string }>;
  };
  scenarios: ScenarioReport[];
};

function fmtDate(date: Date) {
  return date.toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
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

async function ensureStripeSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurado.");
  }

  const sql = neon(process.env.DATABASE_URL);
  await sql.query("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'stripe'");
  await sql.query(
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id varchar(255)"
  );
  await sql.query(
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id varchar(255)"
  );
  await sql.query(
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_status varchar(50)"
  );
}

async function truncateAll() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurado.");
  }

  const sql = neon(process.env.DATABASE_URL);
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

async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "therapist" | "patient";
  phone?: string;
}) {
  const hashed = await bcrypt.hash(params.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      name: params.name,
      email: params.email,
      password: hashed,
      role: params.role,
      phone: params.phone || null,
      active: true,
    })
    .returning();
  return user;
}

async function createPatientAccount(params: {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  birthDate: string;
  notes: string;
}) {
  const user = await createUser({
    name: params.name,
    email: params.email,
    password: params.password,
    role: "patient",
    phone: params.phone,
  });

  const [patient] = await db
    .insert(patients)
    .values({
      userId: user.id,
      name: params.name,
      email: params.email,
      phone: params.phone,
      cpf: params.cpf,
      birthDate: params.birthDate,
      notes: params.notes,
      active: true,
    })
    .returning();

  return { user, patient };
}

async function createAppointment(params: {
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: "online" | "presencial";
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  notes?: string;
  recurrenceType?: "weekly" | "biweekly";
  recurrenceGroupId?: string;
}) {
  const [appointment] = await db
    .insert(appointments)
    .values({
      patientId: params.patientId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      modality: params.modality,
      status: params.status,
      notes: params.notes || null,
      recurrenceType: params.recurrenceType || null,
      recurrenceGroupId: params.recurrenceGroupId || null,
      meetingUrl: params.modality === "online" ? buildMeetingUrl(crypto.randomUUID()) : null,
    })
    .returning();

  if (params.modality === "online") {
    await db
      .update(appointments)
      .set({ meetingUrl: buildMeetingUrl(appointment.id) })
      .where(eq(appointments.id, appointment.id));
    appointment.meetingUrl = buildMeetingUrl(appointment.id);
  }

  return appointment;
}

async function main() {
  await ensureStripeSchema();
  await truncateAll();

  const now = new Date();
  const soonStart = addMinutes(now, 15);
  const soonEnd = addMinutes(soonStart, 60);

  const adminCreds = {
    email: getSeedValue("HOMOLOG_ADMIN_EMAIL", "admin@psicolobia.test"),
    password: getSeedPassword("HOMOLOG_ADMIN_PASSWORD"),
  };
  const therapistCreds = {
    email: getSeedValue("HOMOLOG_THERAPIST_EMAIL", "terapeuta@psicolobia.test"),
    password: getSeedPassword("HOMOLOG_THERAPIST_PASSWORD"),
  };
  const patientCreds = [
    {
      label: "Simulação 1",
      name: "Lia Monteiro",
      email: getSeedValue("HOMOLOG_PATIENT_1_EMAIL", "lia.monteiro@psicolobia.test"),
      password: getSeedPassword("HOMOLOG_PATIENT_1_PASSWORD"),
      phone: "11990000001",
      cpf: "111.111.111-11",
      birthDate: "1995-04-18",
      notes: "Paciente de teste para sessão ao vivo com sala de espera e vídeo.",
    },
    {
      label: "Simulação 2",
      name: "Caio Martins",
      email: getSeedValue("HOMOLOG_PATIENT_2_EMAIL", "caio.martins@psicolobia.test"),
      password: getSeedPassword("HOMOLOG_PATIENT_2_PASSWORD"),
      phone: "11990000002",
      cpf: "222.222.222-22",
      birthDate: "1991-09-03",
      notes: "Paciente em processo terapêutico semanal com histórico e triagem.",
    },
    {
      label: "Simulação 3",
      name: "Marina Souza",
      email: getSeedValue("HOMOLOG_PATIENT_3_EMAIL", "marina.souza@psicolobia.test"),
      password: getSeedPassword("HOMOLOG_PATIENT_3_PASSWORD"),
      phone: "11990000003",
      cpf: "333.333.333-33",
      birthDate: "1988-12-12",
      notes: "Paciente com ciclo fechado e materiais pós-sessão salvos no portal.",
    },
  ];

  await createUser({
    name: "Beatriz Homolog",
    email: adminCreds.email,
    password: adminCreds.password,
    role: "admin",
    phone: "11988840525",
  });

  await createUser({
    name: "Terapeuta Teste",
    email: therapistCreds.email,
    password: therapistCreds.password,
    role: "therapist",
    phone: "11988840526",
  });

  const [lia, caio, marina] = await Promise.all(
    patientCreds.map((patient) => createPatientAccount(patient))
  );

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
      value: JSON.stringify([
        "Ansiedade",
        "Relacionamentos",
        "Autoconhecimento",
        "Regulação emocional",
      ]),
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

  const liveAppointment = await createAppointment({
    patientId: lia.patient.id,
    date: fmtDate(soonStart),
    startTime: fmtTime(soonStart),
    endTime: fmtTime(soonEnd),
    modality: "online",
    status: "confirmed",
    notes:
      "Sessão ao vivo para validar sala de espera, countdown e botão de entrada 10 min antes.",
  });

  const recurrenceGroupId = crypto.randomUUID();

  const caioPast1 = await createAppointment({
    patientId: caio.patient.id,
    date: fmtDate(addDays(now, -14)),
    startTime: "19:00:00",
    endTime: "20:00:00",
    modality: "online",
    status: "completed",
    notes: "Sessão 1 do processo: autocobrança e sobrecarga.",
    recurrenceType: "weekly",
    recurrenceGroupId,
  });

  const caioPast2 = await createAppointment({
    patientId: caio.patient.id,
    date: fmtDate(addDays(now, -7)),
    startTime: "19:00:00",
    endTime: "20:00:00",
    modality: "online",
    status: "completed",
    notes: "Sessão 2 do processo: limites no trabalho e rotina.",
    recurrenceType: "weekly",
    recurrenceGroupId,
  });

  const caioUpcoming = await createAppointment({
    patientId: caio.patient.id,
    date: fmtDate(addDays(now, 7)),
    startTime: "19:00:00",
    endTime: "20:00:00",
    modality: "online",
    status: "confirmed",
    notes: "Próxima sessão do processo com triagem já preenchida.",
    recurrenceType: "weekly",
    recurrenceGroupId,
  });

  const marinaCompleted1 = await createAppointment({
    patientId: marina.patient.id,
    date: fmtDate(addDays(now, -30)),
    startTime: "10:00:00",
    endTime: "11:00:00",
    modality: "presencial",
    status: "completed",
    notes: "Sessão inicial de acolhimento e objetivos.",
  });

  const marinaCompleted2 = await createAppointment({
    patientId: marina.patient.id,
    date: fmtDate(addDays(now, -21)),
    startTime: "10:00:00",
    endTime: "11:00:00",
    modality: "online",
    status: "completed",
    notes: "Sessão de reorganização de rotina e descanso.",
  });

  const marinaCompleted3 = await createAppointment({
    patientId: marina.patient.id,
    date: fmtDate(addDays(now, -14)),
    startTime: "10:00:00",
    endTime: "11:00:00",
    modality: "online",
    status: "completed",
    notes: "Consolidação do processo e fechamento do ciclo.",
  });

  await db.insert(triages).values({
    appointmentId: caioUpcoming.id,
    mood: "bem",
    sleepQuality: "regular",
    anxietyLevel: 4,
    mainConcern: "Organizar limites sem culpa.",
    recentEvents: "Semana intensa de trabalho.",
    medicationChanges: "Nenhuma alteração.",
    additionalNotes: "Quero revisar os combinados de descanso.",
    completed: true,
  });

  await db.insert(clinicalRecords).values([
    {
      patientId: caio.patient.id,
      sessionDate: new Date(`${caioPast1.date}T${caioPast1.startTime}`),
      sessionNumber: 1,
      chiefComplaint: "Autocrítica elevada e exaustão.",
      clinicalNotes: "Mapeamento de gatilhos e padrão de exigência interna.",
      interventions: "Psicoeducação sobre autocompaixão.",
      homework: "Registrar 3 situações de autocrítica e reescrever em tom gentil.",
      mood: "neutro",
      riskAssessment: "Sem risco agudo.",
      nextSessionPlan: "Revisar registros e trabalhar limites.",
      private: true,
    },
    {
      patientId: caio.patient.id,
      sessionDate: new Date(`${caioPast2.date}T${caioPast2.startTime}`),
      sessionNumber: 2,
      chiefComplaint: "Ansiedade antecipatória em conversas difíceis.",
      clinicalNotes: "Paciente relata melhora com pausas entre demandas.",
      interventions: "Ensaio comportamental e técnica 4-6 de respiração.",
      homework: "Praticar pausa de 90 segundos antes de responder demandas urgentes.",
      mood: "bem",
      riskAssessment: "Sem risco agudo.",
      nextSessionPlan: "Aprofundar conversas reais e ajustar expectativas.",
      private: true,
    },
    {
      patientId: marina.patient.id,
      sessionDate: new Date(`${marinaCompleted1.date}T${marinaCompleted1.startTime}`),
      sessionNumber: 1,
      chiefComplaint: "Sobrecarga e desconexão do próprio ritmo.",
      clinicalNotes: "Início do plano de regulação e descanso.",
      interventions: "Linha do tempo de energia e ancoragem corporal.",
      homework: "Separar 15 minutos por dia para pausa sem telas.",
      mood: "mal",
      riskAssessment: "Sem risco agudo.",
      nextSessionPlan: "Revisar adesão às pausas.",
      private: true,
    },
    {
      patientId: marina.patient.id,
      sessionDate: new Date(`${marinaCompleted2.date}T${marinaCompleted2.startTime}`),
      sessionNumber: 2,
      chiefComplaint: "Manter constância nas rotinas.",
      clinicalNotes: "Paciente respondeu bem à rotina mínima viável.",
      interventions: "Planejamento em blocos e revisão de expectativas.",
      homework: "Escolher uma rotina-base e repetir por 7 dias.",
      mood: "neutro",
      riskAssessment: "Sem risco agudo.",
      nextSessionPlan: "Avaliar consistência e manutenção.",
      private: true,
    },
    {
      patientId: marina.patient.id,
      sessionDate: new Date(`${marinaCompleted3.date}T${marinaCompleted3.startTime}`),
      sessionNumber: 3,
      chiefComplaint: "Fechamento do ciclo inicial com mais clareza.",
      clinicalNotes: "Consolidação dos aprendizados e plano de manutenção.",
      interventions: "Síntese do percurso e critérios de retorno.",
      homework: "Observar sinais de sobrecarga antes de aceitar novas demandas.",
      mood: "bem",
      riskAssessment: "Sem risco agudo.",
      nextSessionPlan: "Retorno apenas se necessário.",
      private: true,
    },
  ]);

  await db.insert(payments).values([
    {
      patientId: lia.patient.id,
      appointmentId: liveAppointment.id,
      amount: "180.00",
      method: "stripe",
      status: "pending",
      dueDate: liveAppointment.date,
      description: "Sessão online de demonstração — Simulação 1",
      externalReference: liveAppointment.id,
    },
    {
      patientId: caio.patient.id,
      appointmentId: caioPast1.id,
      amount: "180.00",
      method: "pix",
      status: "paid",
      dueDate: caioPast1.date,
      paidAt: new Date(`${caioPast1.date}T21:00:00`),
      description: "Sessão 1 do processo terapêutico",
    },
    {
      patientId: caio.patient.id,
      appointmentId: caioPast2.id,
      amount: "180.00",
      method: "pix",
      status: "paid",
      dueDate: caioPast2.date,
      paidAt: new Date(`${caioPast2.date}T21:00:00`),
      description: "Sessão 2 do processo terapêutico",
    },
    {
      patientId: caio.patient.id,
      appointmentId: caioUpcoming.id,
      amount: "180.00",
      method: "stripe",
      status: "pending",
      dueDate: caioUpcoming.date,
      description: "Próxima sessão do processo terapêutico",
      externalReference: caioUpcoming.id,
    },
    {
      patientId: marina.patient.id,
      appointmentId: marinaCompleted1.id,
      amount: "220.00",
      method: "bank_transfer",
      status: "paid",
      dueDate: marinaCompleted1.date,
      paidAt: new Date(`${marinaCompleted1.date}T13:00:00`),
      description: "Sessão presencial 1",
    },
    {
      patientId: marina.patient.id,
      appointmentId: marinaCompleted2.id,
      amount: "180.00",
      method: "stripe",
      status: "paid",
      dueDate: marinaCompleted2.date,
      paidAt: new Date(`${marinaCompleted2.date}T12:00:00`),
      description: "Sessão online 2",
    },
    {
      patientId: marina.patient.id,
      appointmentId: marinaCompleted3.id,
      amount: "180.00",
      method: "pix",
      status: "paid",
      dueDate: marinaCompleted3.date,
      paidAt: new Date(`${marinaCompleted3.date}T12:00:00`),
      description: "Sessão online 3",
    },
  ]);

  await db.insert(documents).values([
    {
      patientId: lia.patient.id,
      title: "Antes da sessão ao vivo",
      type: "session_note",
      content:
        "Durante a espera:\n- Respire por 2 minutos.\n- Separe água e papel.\n- Liste 3 pontos que quer abordar.\n\nApós a sessão:\n- Anote um insight central.\n- Observe como o corpo ficou depois da conversa.",
    },
    {
      patientId: caio.patient.id,
      title: "Sessão 1 — Notas práticas",
      type: "session_note",
      content:
        "Durante a semana:\n- Observe quando a autocobrança aparece.\n- Dê nome ao sentimento.\n\nApós a sessão:\n- Reescreva 1 pensamento com mais gentileza.",
    },
    {
      patientId: caio.patient.id,
      title: "Sessão 2 — Exercício de continuidade",
      type: "session_note",
      content:
        "Durante o processo:\n- Faça a pausa de 90 segundos antes de responder mensagens importantes.\n- Note se a tensão diminui no corpo.\n\nPara a próxima sessão:\n- Traga 2 exemplos reais.",
    },
    {
      patientId: marina.patient.id,
      title: "Sessão 1 — Lembretes de regulação",
      type: "session_note",
      content:
        "Após a sessão:\n- Faça pausas curtas e sem tela.\n- Observe quando o corpo avisa que passou do limite.",
    },
    {
      patientId: marina.patient.id,
      title: "Sessão 2 — Rotina mínima viável",
      type: "session_note",
      content:
        "Durante a semana:\n- Mantenha uma rotina-base simples.\n- Marque no fim do dia se ela foi possível ou não.\n\nSem se punir se não sair perfeito.",
    },
    {
      patientId: marina.patient.id,
      title: "Sessão 3 — Plano de manutenção",
      type: "session_note",
      content:
        "Após o ciclo:\n- Revise os sinais de sobrecarga.\n- Volte a este painel quando quiser retomar os pontos-chave.\n- Se precisar, solicite nova sessão pelo portal.",
    },
  ]);

  await db.insert(notifications).values([
    {
      type: "registration",
      title: "Ambiente de homologação preparado",
      message: "Banco recriado com 3 jornadas controladas de teste.",
      icon: "🧪",
      linkUrl: "/admin",
    },
    {
      type: "appointment",
      title: "Sessão ao vivo em 15 minutos",
      message: `Lia Monteiro está confirmada para ${liveAppointment.date} às ${liveAppointment.startTime}.`,
      patientId: lia.patient.id,
      appointmentId: liveAppointment.id,
      linkUrl: "/admin/agenda",
    },
  ]);

  const report: SeedReport = {
    generatedAt: new Date().toISOString(),
    databaseHost: new URL(process.env.DATABASE_URL || "http://localhost").host,
    credentials: {
      admin: adminCreds,
      therapist: therapistCreds,
      patients: patientCreds.map(({ label, email, password }) => ({
        label,
        email,
        password,
      })),
    },
    scenarios: [
      {
        slug: "simulacao-1-sessao-ao-vivo",
        patientName: lia.patient.name,
        summary:
          "Sessão online confirmada em 15 minutos com sala de espera, meetingUrl e cobrança pendente.",
        portalHighlights: [
          "Próxima sessão imediata",
          "Contagem regressiva",
          "Botão libera 10 minutos antes",
          "Nota pré/pós-sessão no portal",
        ],
        adminHighlights: [
          "Agenda com sessão confirmada",
          "Financeiro com pagamento pendente",
        ],
        appointmentId: liveAppointment.id,
        waitingRoomUrl: `/portal/sala-espera/${liveAppointment.id}`,
        meetingUrl: liveAppointment.meetingUrl || undefined,
      },
      {
        slug: "simulacao-2-processo-terapeutico",
        patientName: caio.patient.name,
        summary:
          "Processo terapêutico semanal com histórico, triagem, pagamentos e prontuário.",
        portalHighlights: [
          "Histórico de sessões",
          "Triagem preenchida",
          "Notas práticas em Documentos e Notas",
        ],
        adminHighlights: [
          "Prontuário de 2 sessões",
          "Próxima sessão recorrente confirmada",
          "Pagamentos pagos e pendente",
        ],
        appointmentId: caioUpcoming.id,
        waitingRoomUrl: `/portal/sala-espera/${caioUpcoming.id}`,
        meetingUrl: caioUpcoming.meetingUrl || undefined,
      },
      {
        slug: "simulacao-3-historico-fechado",
        patientName: marina.patient.name,
        summary:
          "Histórico encerrado com 3 sessões concluídas, prontuários completos e notas permanentes.",
        portalHighlights: [
          "Sessões concluídas no histórico",
          "Notas de manutenção salvas",
          "Sem cobranças pendentes",
        ],
        adminHighlights: [
          "Prontuários completos",
          "Financeiro quitado",
          "Paciente útil para validar leitura de histórico",
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(process.cwd(), "homolog-report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
