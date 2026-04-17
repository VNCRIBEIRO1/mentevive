"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Home, CalendarCheck, Sprout, CreditCard, ShieldCheck,
  Clock, Video, CheckCircle, ChevronRight, ChevronLeft,
  CalendarPlus, Wallet,
} from "lucide-react";

/* ── Fake data ── */
const PATIENT = { name: "Camila", initials: "CR" };

const SESSIONS = [
  { day: 14, month: "abr", time: "14:00 – 14:50", status: "Confirmada", statusColor: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-500/30", modality: "online" },
  { day: 21, month: "abr", time: "14:00 – 14:50", status: "Pendente", statusColor: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-500/30", modality: "online" },
  { day: 28, month: "abr", time: "14:00 – 14:50", status: "Pendente", statusColor: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-500/30", modality: "online" },
];

const TIMELINE = [
  { num: 8, date: "07 abr 2026", feedback: "Excelente progresso com exercícios de ACT. Continue praticando a defusão cognitiva.", note: "Me senti mais leve essa semana. Consegui usar a respiração no trabalho." },
  { num: 7, date: "31 mar 2026", feedback: "Identificamos padrões de evitação. Proposta de exercícios de exposição gradual.", note: "Percebi que evito situações no trabalho. Quero trabalhar isso." },
  { num: 6, date: "24 mar 2026", feedback: null, note: "Semana difícil, mas a meditação ajudou." },
];

const PAYMENTS = [
  { date: "07/04", desc: "Sessão #8 — Individual", val: "R$ 180,00", status: "Pago", color: "text-emerald-400 bg-emerald-900/40" },
  { date: "31/03", desc: "Sessão #7 — Individual", val: "R$ 180,00", status: "Pago", color: "text-emerald-400 bg-emerald-900/40" },
  { date: "14/04", desc: "Sessão #9 — Individual", val: "R$ 180,00", status: "Pendente", color: "text-amber-400 bg-amber-900/40" },
];

const TRIAGE_DATA = {
  mood: "Bem",
  moodEmoji: "🙂",
  sleep: "Bom — poderia ser melhor",
  anxiety: 4,
  concern: "Ansiedade antes de reuniões importantes no trabalho",
};

/* ── Screen mockup components ── */

function ScreenDashboard() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-teal/10 to-primary/8 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{PATIENT.initials}</div>
        <div>
          <p className="text-[11px] font-bold text-txt">Boa tarde, {PATIENT.name} 🌿</p>
          <p className="text-[9px] text-txt-muted">Seu espaço seguro. Acompanhe sessões, evolução e tudo sobre seu processo.</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: <CalendarCheck className="w-3 h-3 text-emerald-400" />, val: "3", label: "Próximas", bg: "from-emerald-900/30 ring-emerald-500/20" },
          { icon: <CheckCircle className="w-3 h-3 text-teal" />, val: "8", label: "Realizadas", bg: "from-teal/15 ring-teal/20" },
          { icon: <Clock className="w-3 h-3 text-primary-light" />, val: "14 abr", label: "Próxima", bg: "from-primary/12 ring-primary/20" },
          { icon: <Wallet className="w-3 h-3 text-amber-400" />, val: "R$ 180", label: "Pendente", bg: "from-amber-900/30 ring-amber-500/20" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} to-transparent rounded-lg p-2 ring-1 text-center`}>
            <div className="flex justify-center mb-0.5">{s.icon}</div>
            <p className="text-[11px] font-bold text-txt leading-tight">{s.val}</p>
            <p className="text-[7px] text-txt-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-2.5">
        <p className="text-[9px] font-bold text-txt mb-2 flex items-center gap-1"><CalendarCheck className="w-3 h-3 text-teal" /> Próximas Sessões</p>
        {SESSIONS.slice(0, 2).map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
            <div className="w-8 text-center flex-shrink-0">
              <p className="text-[11px] font-bold text-teal leading-none">{s.day}</p>
              <p className="text-[7px] uppercase text-txt-muted">{s.month}</p>
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-txt flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-txt-muted" /> {s.time}</p>
              <p className="text-[7px] text-txt-muted flex items-center gap-0.5"><Video className="w-2 h-2" /> Online</p>
            </div>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${s.statusColor}`}>{s.status}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: <CalendarPlus className="w-3 h-3" />, label: "Agendar", col: "text-teal" },
          { icon: <Sprout className="w-3 h-3" />, label: "Evolução", col: "text-teal-dark" },
          { icon: <CreditCard className="w-3 h-3" />, label: "Pagamentos", col: "text-primary-light" },
        ].map((a) => (
          <div key={a.label} className="flex items-center gap-1.5 bg-card rounded-lg py-2 px-2.5 border border-border">
            <span className={a.col}>{a.icon}</span>
            <span className="text-[8px] font-medium text-txt">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenSessions() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-teal/10 to-transparent rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center"><CalendarCheck className="w-4 h-4 text-teal" /></div>
          <div>
            <p className="text-[11px] font-bold text-txt">Minhas Sessões</p>
            <p className="text-[8px] text-txt-muted">Histórico e próximas sessões</p>
          </div>
        </div>
        <div className="bg-teal text-white text-[8px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><CalendarPlus className="w-2.5 h-2.5" /> Agendar</div>
      </div>
      <div className="flex gap-1">
        {["Todas", "Pendentes", "Confirmadas", "Realizadas"].map((f, i) => (
          <span key={f} className={`text-[7px] font-bold px-2 py-1 rounded-full ${i === 0 ? "bg-teal text-white" : "bg-card text-txt-muted border border-border"}`}>{f}</span>
        ))}
      </div>
      {SESSIONS.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-border hover:border-teal/30">
          <div className="w-10 text-center flex-shrink-0 bg-gradient-to-br from-teal/15 to-transparent rounded-lg py-1.5">
            <p className="text-sm font-bold text-teal leading-none">{s.day}</p>
            <p className="text-[7px] uppercase text-txt-muted font-semibold">{s.month}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-txt flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-txt-muted" /> {s.time}</p>
            <div className="flex items-center gap-1 mt-0.5"><Video className="w-2.5 h-2.5 text-teal" /><span className="text-[8px] text-txt-muted">Online</span></div>
          </div>
          <div className="text-right">
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${s.statusColor}`}>{s.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenEvolution() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-teal/10 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center"><Sprout className="w-4 h-4 text-teal" /></div>
        <div>
          <p className="text-[11px] font-bold text-txt">Minha Evolução</p>
          <p className="text-[8px] text-txt-muted">Acompanhe seu processo terapêutico</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-teal/12 to-transparent rounded-lg p-2.5 ring-1 ring-teal/20 text-center">
          <p className="text-lg font-bold text-teal">8</p>
          <p className="text-[8px] text-txt-muted">Sessões realizadas</p>
        </div>
        <div className="bg-gradient-to-br from-accent/12 to-transparent rounded-lg p-2.5 ring-1 ring-accent/20 text-center">
          <p className="text-lg font-bold text-accent">5</p>
          <p className="text-[8px] text-txt-muted">Registros clínicos</p>
        </div>
      </div>
      <div className="relative pl-5">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal/30 via-primary/20 to-accent/30" />
        {TIMELINE.map((t, i) => (
          <div key={i} className="relative mb-3 last:mb-0">
            <div className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-teal to-primary border-2 border-card shadow-sm" />
            <div className="bg-card rounded-xl p-2.5 border border-border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-bold text-txt">Sessão #{t.num}</p>
                <p className="text-[7px] text-txt-muted">{t.date}</p>
              </div>
              {t.feedback && (
                <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-2 mb-1.5">
                  <p className="text-[7px] font-bold text-purple-400 mb-0.5">💬 Feedback da Terapeuta:</p>
                  <p className="text-[8px] text-txt leading-relaxed">{t.feedback}</p>
                </div>
              )}
              {t.note && (
                <div className="bg-blue-900/30 border border-blue-500/20 rounded-lg p-2">
                  <p className="text-[7px] font-bold text-blue-400 mb-0.5">📝 Minha anotação:</p>
                  <p className="text-[8px] text-txt leading-relaxed">{t.note}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenPayments() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><CreditCard className="w-4 h-4 text-primary" /></div>
        <div>
          <p className="text-[11px] font-bold text-txt">Meus Pagamentos</p>
          <p className="text-[8px] text-txt-muted">Histórico e pendências</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-gradient-to-br from-emerald-900/30 to-transparent rounded-lg p-2 ring-1 ring-emerald-500/20 text-center">
          <p className="text-[11px] font-bold text-emerald-400">R$ 1.440</p>
          <p className="text-[7px] text-txt-muted">Total Pago</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/30 to-transparent rounded-lg p-2 ring-1 ring-amber-500/20 text-center">
          <p className="text-[11px] font-bold text-amber-400">R$ 180</p>
          <p className="text-[7px] text-txt-muted">Pendente</p>
        </div>
        <div className="bg-gradient-to-br from-primary/12 to-transparent rounded-lg p-2 ring-1 ring-primary/20 text-center">
          <p className="text-[11px] font-bold text-txt">9</p>
          <p className="text-[7px] text-txt-muted">Pagamentos</p>
        </div>
      </div>
      {PAYMENTS.map((p, i) => (
        <div key={i} className="flex items-center justify-between p-2.5 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-[9px] font-bold text-txt-muted">{p.date}</div>
            <div>
              <p className="text-[9px] font-medium text-txt">{p.desc}</p>
              <p className="text-[11px] font-bold text-txt mt-0.5">{p.val}</p>
            </div>
          </div>
          <span className={`text-[7px] font-bold px-2 py-0.5 rounded-md ${p.color}`}>{p.status}</span>
        </div>
      ))}
    </div>
  );
}

function ScreenTriage() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-accent/10 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-accent" /></div>
        <div>
          <p className="text-[11px] font-bold text-txt">Triagem Pré-Sessão</p>
          <p className="text-[8px] text-txt-muted">Sessão #9 — 14 abr 2026</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-3">
        <p className="text-[8px] font-bold text-txt mb-2">Como você está se sentindo hoje?</p>
        <div className="flex gap-1.5">
          {[
            { emoji: "😄", label: "Muito bem", active: false },
            { emoji: "🙂", label: "Bem", active: true },
            { emoji: "😐", label: "Neutro", active: false },
            { emoji: "😟", label: "Mal", active: false },
            { emoji: "😢", label: "Muito mal", active: false },
          ].map((m) => (
            <div key={m.label} className={`flex-1 text-center p-1.5 rounded-lg border ${m.active ? "border-teal bg-teal/12 ring-1 ring-teal/25" : "border-border"}`}>
              <span className="text-sm">{m.emoji}</span>
              <p className="text-[6px] text-txt-muted mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-3">
        <p className="text-[8px] font-bold text-txt mb-1.5">Qualidade do sono</p>
        <div className="bg-teal/12 text-teal text-[8px] font-medium px-2.5 py-1.5 rounded-lg">✓ {TRIAGE_DATA.sleep}</div>
      </div>
      <div className="bg-card rounded-xl border border-border p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[8px] font-bold text-txt">Nível de ansiedade</p>
          <span className="text-[9px] font-bold text-teal">{TRIAGE_DATA.anxiety}/10</span>
        </div>
        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal to-teal-dark rounded-full" style={{ width: `${TRIAGE_DATA.anxiety * 10}%` }} />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-3">
        <p className="text-[8px] font-bold text-txt mb-1">Principal preocupação</p>
        <p className="text-[8px] text-txt-light leading-relaxed">{TRIAGE_DATA.concern}</p>
      </div>
    </div>
  );
}

/* ── Screen configuration ── */
const screens = [
  { id: "dashboard", label: "Início", icon: <Home className="w-3.5 h-3.5" />, component: ScreenDashboard, url: "/portal" },
  { id: "sessions", label: "Sessões", icon: <CalendarCheck className="w-3.5 h-3.5" />, component: ScreenSessions, url: "/portal/sessoes" },
  { id: "evolution", label: "Evolução", icon: <Sprout className="w-3.5 h-3.5" />, component: ScreenEvolution, url: "/portal/evolucao" },
  { id: "payments", label: "Pagamentos", icon: <CreditCard className="w-3.5 h-3.5" />, component: ScreenPayments, url: "/portal/pagamentos" },
  { id: "triage", label: "Triagem", icon: <ShieldCheck className="w-3.5 h-3.5" />, component: ScreenTriage, url: "/portal/triagem" },
];

const SCREEN_INTERVAL = 3600;

function getDirection(from: number, to: number) {
  if (to === from) return 1;
  if ((from + 1) % screens.length === to) return 1;
  if ((from - 1 + screens.length) % screens.length === to) return -1;
  return to > from ? 1 : -1;
}

export function PortalScreenCarousel() {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    if (idx === current) return;
    setDirection(getDirection(current, idx));
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    const target = (current + 1) % screens.length;
    setDirection(1);
    setCurrent(target);
  }, [current]);

  const prev = useCallback(() => {
    const target = (current - 1 + screens.length) % screens.length;
    setDirection(-1);
    setCurrent(target);
  }, [current]);

  useEffect(() => {
    if (paused || reduce) return;
    timerRef.current = setTimeout(next, SCREEN_INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, reduce, next]);

  const screen = screens[current];
  const Screen = screen.component;

  const variants = {
    enter: (d: number) => reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 80 : -80, scale: 0.96 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? -80 : 80, scale: 0.96 },
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Telas do portal do paciente"
    >
      <motion.div
        className="absolute -inset-6 rounded-3xl blur-3xl opacity-40"
        animate={{
          background: [
            "radial-gradient(circle at 30% 50%, rgba(91,155,213,0.15), rgba(94,173,165,0.08), transparent)",
            "radial-gradient(circle at 70% 50%, rgba(110,207,246,0.15), rgba(91,155,213,0.08), transparent)",
            "radial-gradient(circle at 50% 30%, rgba(94,173,165,0.15), rgba(110,207,246,0.08), transparent)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />

      <div className="relative bg-card rounded-2xl shadow-warm-xl overflow-hidden ring-1 ring-border">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-surface to-card border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <div className="flex-1 mx-2">
            <motion.div key={screen.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-md px-3 py-1 text-[10px] text-txt-muted text-center truncate">
              mentevive.vercel.app{screen.url}
            </motion.div>
          </div>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden sm:flex flex-col w-14 border-r border-border bg-gradient-to-b from-card to-surface py-3 gap-0.5 items-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-[8px] font-bold mb-2">{PATIENT.initials}</div>
            {screens.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i)} aria-label={`Abrir ${s.label}`} aria-current={i === current ? "page" : undefined}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${i === current ? "bg-teal/15 text-teal" : "text-txt-muted hover:bg-surface hover:text-txt-light"}`}>
                {s.icon}
                <span className="text-[5px] font-medium leading-none">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-3.5 sm:p-4 bg-gradient-to-br from-bg to-card min-h-[340px] sm:min-h-[380px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={screen.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <Screen />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-card">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-surface text-txt-muted hover:text-txt-light transition-colors" aria-label="Tela anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            {screens.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i)} aria-label={`Abrir ${s.label}`} aria-current={i === current ? "page" : undefined}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold transition-all duration-300 ${i === current ? "bg-teal/15 text-teal scale-105" : "text-txt-muted hover:text-txt-light"}`}>
                {s.icon}
                <span className={`${i === current ? "inline" : "hidden sm:inline"}`}>{s.label}</span>
              </button>
            ))}
          </div>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-surface text-txt-muted hover:text-txt-light transition-colors" aria-label="Próxima tela">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!paused && !reduce && (
        <div className="mt-3 mx-auto w-48 h-1 bg-surface rounded-full overflow-hidden">
          <motion.div key={`prog-${current}`} className="h-full bg-gradient-to-r from-teal to-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: SCREEN_INTERVAL / 1000, ease: "linear" }} />
        </div>
      )}
    </div>
  );
}
