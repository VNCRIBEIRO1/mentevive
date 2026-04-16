"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Home, CalendarCheck, Sprout, CreditCard, ShieldCheck,
  Clock, Video, CheckCircle, ChevronRight, ChevronLeft,
  CalendarPlus, Wallet,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   Fake data — Active patient "Camila Ribeiro"
   who has completed sessions, made notes, and paid
   ───────────────────────────────────────────────── */
const PATIENT = { name: "Camila", initials: "CR" };

const SESSIONS = [
  { day: 14, month: "abr", time: "14:00 – 14:50", status: "Confirmada", statusColor: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200", modality: "online" },
  { day: 21, month: "abr", time: "14:00 – 14:50", status: "Pendente", statusColor: "bg-amber-50 text-amber-600 ring-1 ring-amber-200", modality: "online" },
  { day: 28, month: "abr", time: "14:00 – 14:50", status: "Pendente", statusColor: "bg-amber-50 text-amber-600 ring-1 ring-amber-200", modality: "online" },
];

const TIMELINE = [
  { num: 8, date: "07 abr 2026", feedback: "Excelente progresso com exercícios de ACT. Continue praticando a defusão cognitiva.", note: "Me senti mais leve essa semana. Consegui usar a respiração no trabalho." },
  { num: 7, date: "31 mar 2026", feedback: "Identificamos padrões de evitação. Proposta de exercícios de exposição gradual.", note: "Percebi que evito situações no trabalho. Quero trabalhar isso." },
  { num: 6, date: "24 mar 2026", feedback: null, note: "Semana difícil, mas a meditação ajudou." },
];

const PAYMENTS = [
  { date: "07/04", desc: "Sessão #8 — Individual", val: "R$ 180,00", status: "Pago", color: "text-emerald-600 bg-emerald-50" },
  { date: "31/03", desc: "Sessão #7 — Individual", val: "R$ 180,00", status: "Pago", color: "text-emerald-600 bg-emerald-50" },
  { date: "14/04", desc: "Sessão #9 — Individual", val: "R$ 180,00", status: "Pendente", color: "text-amber-600 bg-amber-50" },
];

const TRIAGE_DATA = {
  mood: "Bem",
  moodEmoji: "🙂",
  sleep: "Bom — poderia ser melhor",
  anxiety: 4,
  concern: "Ansiedade antes de reuniões importantes no trabalho",
};

/* ─────────────────────────────────────────────────
   Screen mockup components (5 screens)
   ───────────────────────────────────────────────── */

function ScreenDashboard() {
  return (
    <div className="space-y-3">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-teal/8 to-primary/5 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {PATIENT.initials}
        </div>
        <div>
          <p className="text-[11px] font-bold text-txt">Boa tarde, {PATIENT.name} 🌿</p>
          <p className="text-[9px] text-txt-muted">Seu espaço seguro. Acompanhe sessões, evolução e tudo sobre seu processo.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: <CalendarCheck className="w-3 h-3 text-emerald-600" />, val: "3", label: "Próximas", bg: "from-emerald-50 ring-emerald-100" },
          { icon: <CheckCircle className="w-3 h-3 text-teal" />, val: "8", label: "Realizadas", bg: "from-teal/8 ring-teal/10" },
          { icon: <Clock className="w-3 h-3 text-primary-dark" />, val: "14 abr", label: "Próxima", bg: "from-primary/8 ring-primary/10" },
          { icon: <Wallet className="w-3 h-3 text-amber-600" />, val: "R$ 180", label: "Pendente", bg: "from-amber-50 ring-amber-100" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} to-transparent rounded-lg p-2 ring-1 text-center`}>
            <div className="flex justify-center mb-0.5">{s.icon}</div>
            <p className="text-[11px] font-bold text-txt leading-tight">{s.val}</p>
            <p className="text-[7px] text-txt-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="bg-white rounded-xl border border-gray-100 p-2.5">
        <p className="text-[9px] font-bold text-txt mb-2 flex items-center gap-1">
          <CalendarCheck className="w-3 h-3 text-teal" /> Próximas Sessões
        </p>
        {SESSIONS.slice(0, 2).map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
            <div className="w-8 text-center flex-shrink-0">
              <p className="text-[11px] font-bold text-teal-dark leading-none">{s.day}</p>
              <p className="text-[7px] uppercase text-txt-muted">{s.month}</p>
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-txt flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-txt-muted" /> {s.time}
              </p>
              <p className="text-[7px] text-txt-muted flex items-center gap-0.5">
                <Video className="w-2 h-2" /> Online
              </p>
            </div>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${s.statusColor}`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: <CalendarPlus className="w-3 h-3" />, label: "Agendar", col: "text-teal" },
          { icon: <Sprout className="w-3 h-3" />, label: "Evolução", col: "text-teal-dark" },
          { icon: <CreditCard className="w-3 h-3" />, label: "Pagamentos", col: "text-primary-dark" },
        ].map((a) => (
          <div key={a.label} className="flex items-center gap-1.5 bg-white rounded-lg py-2 px-2.5 border border-gray-100">
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
      {/* Header */}
      <div className="bg-gradient-to-r from-teal/8 to-transparent rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal/12 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-teal" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-txt">Minhas Sessões</p>
            <p className="text-[8px] text-txt-muted">Histórico e próximas sessões</p>
          </div>
        </div>
        <div className="bg-teal text-white text-[8px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
          <CalendarPlus className="w-2.5 h-2.5" /> Agendar
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1">
        {["Todas", "Pendentes", "Confirmadas", "Realizadas"].map((f, i) => (
          <span key={f} className={`text-[7px] font-bold px-2 py-1 rounded-full ${i === 0 ? "bg-teal text-white" : "bg-gray-100 text-txt-muted"}`}>
            {f}
          </span>
        ))}
      </div>

      {/* Sessions */}
      {SESSIONS.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-gray-50 hover:border-teal/20">
          <div className="w-10 text-center flex-shrink-0 bg-gradient-to-br from-teal/8 to-transparent rounded-lg py-1.5">
            <p className="text-sm font-bold text-teal-dark leading-none">{s.day}</p>
            <p className="text-[7px] uppercase text-txt-muted font-semibold">{s.month}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-txt flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-txt-muted" /> {s.time}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Video className="w-2.5 h-2.5 text-teal" />
              <span className="text-[8px] text-txt-muted">Online</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${s.statusColor}`}>{s.status}</span>
            <div className="flex gap-1.5 mt-1 justify-end">
              <span className="text-[7px] text-accent font-bold">Triagem</span>
              <span className="text-[7px] text-teal-dark font-bold">Sala de Espera</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenEvolution() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal/8 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal/12 flex items-center justify-center">
          <Sprout className="w-4 h-4 text-teal" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-txt">Minha Evolução</p>
          <p className="text-[8px] text-txt-muted">Acompanhe seu processo terapêutico</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-teal/8 to-transparent rounded-lg p-2.5 ring-1 ring-teal/10 text-center">
          <p className="text-lg font-bold text-teal-dark">8</p>
          <p className="text-[8px] text-txt-muted">Sessões realizadas</p>
        </div>
        <div className="bg-gradient-to-br from-accent/8 to-transparent rounded-lg p-2.5 ring-1 ring-accent/10 text-center">
          <p className="text-lg font-bold text-accent">5</p>
          <p className="text-[8px] text-txt-muted">Registros clínicos</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-5">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal/30 via-primary/20 to-accent/30" />
        {TIMELINE.map((t, i) => (
          <div key={i} className="relative mb-3 last:mb-0">
            <div className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-teal to-primary border-2 border-white shadow-sm" />
            <div className="bg-white rounded-xl p-2.5 border border-gray-50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-bold text-txt">Sessão #{t.num}</p>
                <p className="text-[7px] text-txt-muted">{t.date}</p>
              </div>
              {t.feedback && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-2 mb-1.5">
                  <p className="text-[7px] font-bold text-purple-600 mb-0.5">💬 Feedback da Bea:</p>
                  <p className="text-[8px] text-txt leading-relaxed">{t.feedback}</p>
                </div>
              )}
              {t.note && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                  <p className="text-[7px] font-bold text-blue-600 mb-0.5">📝 Minha anotação:</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/8 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-primary-dark" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-txt">Meus Pagamentos</p>
          <p className="text-[8px] text-txt-muted">Histórico e pendências</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-gradient-to-br from-green-50 to-transparent rounded-lg p-2 ring-1 ring-green-100 text-center">
          <p className="text-[11px] font-bold text-green-600">R$ 1.440</p>
          <p className="text-[7px] text-txt-muted">Total Pago</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-transparent rounded-lg p-2 ring-1 ring-amber-100 text-center">
          <p className="text-[11px] font-bold text-amber-600">R$ 180</p>
          <p className="text-[7px] text-txt-muted">Pendente</p>
        </div>
        <div className="bg-gradient-to-br from-primary/8 to-transparent rounded-lg p-2 ring-1 ring-primary/10 text-center">
          <p className="text-[11px] font-bold text-txt">9</p>
          <p className="text-[7px] text-txt-muted">Pagamentos</p>
        </div>
      </div>

      {/* List */}
      {PAYMENTS.map((p, i) => (
        <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[9px] font-bold text-txt-muted">
              {p.date}
            </div>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/8 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent/12 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-txt">Triagem Pré-Sessão</p>
          <p className="text-[8px] text-txt-muted">Sessão #9 — 14 abr 2026</p>
        </div>
      </div>

      {/* Mood */}
      <div className="bg-white rounded-xl border border-gray-50 p-3">
        <p className="text-[8px] font-bold text-txt mb-2">Como você está se sentindo hoje?</p>
        <div className="flex gap-1.5">
          {[
            { emoji: "😄", label: "Muito bem", active: false },
            { emoji: "🙂", label: "Bem", active: true },
            { emoji: "😐", label: "Neutro", active: false },
            { emoji: "😟", label: "Mal", active: false },
            { emoji: "😢", label: "Muito mal", active: false },
          ].map((m) => (
            <div key={m.label} className={`flex-1 text-center p-1.5 rounded-lg border ${m.active ? "border-teal bg-teal/8 ring-1 ring-teal/20" : "border-gray-100"}`}>
              <span className="text-sm">{m.emoji}</span>
              <p className="text-[6px] text-txt-muted mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div className="bg-white rounded-xl border border-gray-50 p-3">
        <p className="text-[8px] font-bold text-txt mb-1.5">Qualidade do sono</p>
        <div className="bg-teal/8 text-teal-dark text-[8px] font-medium px-2.5 py-1.5 rounded-lg">
          ✓ {TRIAGE_DATA.sleep}
        </div>
      </div>

      {/* Anxiety level */}
      <div className="bg-white rounded-xl border border-gray-50 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[8px] font-bold text-txt">Nível de ansiedade</p>
          <span className="text-[9px] font-bold text-teal">{TRIAGE_DATA.anxiety}/10</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal to-teal-dark rounded-full" style={{ width: `${TRIAGE_DATA.anxiety * 10}%` }} />
        </div>
      </div>

      {/* Main concern */}
      <div className="bg-white rounded-xl border border-gray-50 p-3">
        <p className="text-[8px] font-bold text-txt mb-1">Principal preocupação</p>
        <p className="text-[8px] text-txt-light leading-relaxed">{TRIAGE_DATA.concern}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Screen configuration
   ───────────────────────────────────────────────── */
const screens = [
  { id: "dashboard", label: "Início", icon: <Home className="w-3.5 h-3.5" />, component: ScreenDashboard, url: "/portal" },
  { id: "sessions", label: "Sessões", icon: <CalendarCheck className="w-3.5 h-3.5" />, component: ScreenSessions, url: "/portal/sessoes" },
  { id: "evolution", label: "Evolução", icon: <Sprout className="w-3.5 h-3.5" />, component: ScreenEvolution, url: "/portal/evolucao" },
  { id: "payments", label: "Pagamentos", icon: <CreditCard className="w-3.5 h-3.5" />, component: ScreenPayments, url: "/portal/pagamentos" },
  { id: "triage", label: "Triagem", icon: <ShieldCheck className="w-3.5 h-3.5" />, component: ScreenTriage, url: "/portal/triagem" },
];

const SCREEN_INTERVAL = 3600;
const AUTO_NAV_TRAVEL_MS = 650;
const AUTO_NAV_PRESS_MS = 170;
const AUTO_NAV_RELEASE_MS = 180;

function getDirection(from: number, to: number) {
  if (to === from) return 1;
  if ((from + 1) % screens.length === to) return 1;
  if ((from - 1 + screens.length) % screens.length === to) return -1;
  return to > from ? 1 : -1;
}

/* ─────────────────────────────────────────────────
   Main exported component: animated browser carousel
   ───────────────────────────────────────────────── */
export function PortalScreenCarousel() {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  // This extra state lets the auto-play feel like a guided click-through, not just a slide swap.
  const [autoTarget, setAutoTarget] = useState<number | null>(null);
  const [isAutoPressing, setIsAutoPressing] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, ready: false });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const bottomTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const autoTimeouts = useRef<number[]>([]);
  const cursorTarget = autoTarget ?? current;
  const showAutoDemo = !paused && !reduce;
  const stopAutoTimers = useCallback(() => {
    autoTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    autoTimeouts.current = [];
  }, []);

  const clearAutoSequence = useCallback(() => {
    stopAutoTimers();
    setAutoTarget(null);
    setIsAutoPressing(false);
  }, [stopAutoTimers]);

  const syncCursor = useCallback((idx: number) => {
    const wrapper = wrapperRef.current;
    const button = bottomTabRefs.current[idx];

    if (!wrapper || !button) {
      setCursorPos((prev) => ({ ...prev, ready: false }));
      return;
    }

    const wrapperBox = wrapper.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();

    setCursorPos({
      x: buttonBox.left - wrapperBox.left + (buttonBox.width / 2),
      y: buttonBox.top - wrapperBox.top + (buttonBox.height / 2),
      ready: true,
    });
  }, []);

  const goTo = useCallback((idx: number) => {
    clearAutoSequence();
    if (idx === current) return;
    setDirection(getDirection(current, idx));
    setCurrent(idx);
  }, [clearAutoSequence, current]);

  const next = useCallback(() => {
    clearAutoSequence();
    const target = (current + 1) % screens.length;
    setDirection(getDirection(current, target));
    setCurrent(target);
  }, [clearAutoSequence, current]);

  const prev = useCallback(() => {
    clearAutoSequence();
    const target = (current - 1 + screens.length) % screens.length;
    setDirection(getDirection(current, target));
    setCurrent(target);
  }, [clearAutoSequence, current]);

  const runAutoNavigation = useCallback((idx: number) => {
    clearAutoSequence();
    setAutoTarget(idx);

    autoTimeouts.current = [
      window.setTimeout(() => setIsAutoPressing(true), AUTO_NAV_TRAVEL_MS),
      window.setTimeout(() => {
        setDirection(getDirection(current, idx));
        setCurrent(idx);
      }, AUTO_NAV_TRAVEL_MS + AUTO_NAV_PRESS_MS),
      window.setTimeout(() => setIsAutoPressing(false), AUTO_NAV_TRAVEL_MS + AUTO_NAV_PRESS_MS + (AUTO_NAV_RELEASE_MS / 2)),
      window.setTimeout(() => {
        setAutoTarget(null);
        setIsAutoPressing(false);
      }, AUTO_NAV_TRAVEL_MS + AUTO_NAV_PRESS_MS + AUTO_NAV_RELEASE_MS),
    ];
  }, [clearAutoSequence, current]);

  useEffect(() => {
    if (paused || reduce) {
      stopAutoTimers();
      return;
    }

    const timer = window.setTimeout(() => {
      runAutoNavigation((current + 1) % screens.length);
    }, SCREEN_INTERVAL);

    return () => {
      window.clearTimeout(timer);
      stopAutoTimers();
    };
  }, [current, paused, reduce, runAutoNavigation, stopAutoTimers]);

  useEffect(() => {
    if (reduce) return;

    const updateCursor = () => syncCursor(cursorTarget);

    updateCursor();
    window.addEventListener("resize", updateCursor);
    return () => window.removeEventListener("resize", updateCursor);
  }, [cursorTarget, reduce, syncCursor]);

  const screen = screens[current];
  const Screen = screen.component;

  const variants = {
    enter: (d: number) => reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? 80 : -80, scale: 0.96 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d: number) => reduce ? { opacity: 0 } : { opacity: 0, x: d > 0 ? -80 : 80, scale: 0.96 },
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => {
        setPaused(true);
        clearAutoSequence();
      }}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Telas do portal do paciente"
    >
      {/* Glow behind */}
      <motion.div
        className="absolute -inset-6 rounded-3xl blur-3xl opacity-40"
        animate={{
          background: [
            "radial-gradient(circle at 30% 50%, rgba(15,118,110,0.2), rgba(212,165,116,0.1), transparent)",
            "radial-gradient(circle at 70% 50%, rgba(232,160,191,0.2), rgba(15,118,110,0.1), transparent)",
            "radial-gradient(circle at 50% 30%, rgba(212,165,116,0.2), rgba(232,160,191,0.1), transparent)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Browser chrome */}
      <div className="relative bg-white rounded-2xl shadow-warm-xl overflow-hidden ring-1 ring-black/5">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <div className="flex-1 mx-2">
            <motion.div
              key={screen.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-100 rounded-md px-3 py-1 text-[10px] text-gray-400 text-center truncate"
            >
              mentevive.vercel.app{screen.url}
            </motion.div>
          </div>
        </div>

        {/* Sidebar + Content layout */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden sm:flex flex-col w-14 border-r border-gray-50 bg-gradient-to-b from-white to-gray-50/50 py-3 gap-0.5 items-center">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-[8px] font-bold mb-2">
              {PATIENT.initials}
            </div>
            {screens.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`Abrir ${s.label}`}
                aria-current={i === current ? "page" : undefined}
                className={`relative w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                  i === current
                    ? "bg-teal/10 text-teal shadow-[0_8px_22px_rgba(15,118,110,0.12)]"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                {showAutoDemo && autoTarget === i && (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-lg border border-teal/20"
                    animate={isAutoPressing ? { scale: [1, 0.92, 1.05], opacity: [0.55, 0.9, 0] } : { scale: 1, opacity: 0.35 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                )}
                {s.icon}
                <span className="text-[5px] font-medium leading-none">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 p-3.5 sm:p-4 bg-gradient-to-br from-bg/50 to-white min-h-[340px] sm:min-h-[380px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={screen.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Screen />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white">
          {/* Prev/Next */}
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Tela anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Screen tabs */}
          <div className="relative flex gap-1">
            {screens.map((s, i) => (
              <button
                key={s.id}
                ref={(element) => {
                  bottomTabRefs.current[i] = element;
                }}
                onClick={() => goTo(i)}
                aria-label={`Abrir ${s.label}`}
                aria-current={i === current ? "page" : undefined}
                className={`relative isolate flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold transition-all duration-300 ${
                  i === current
                    ? "bg-teal/10 text-teal scale-105 shadow-[0_12px_26px_rgba(15,118,110,0.12)]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {showAutoDemo && autoTarget === i && (
                  <>
                    <motion.span
                      className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-teal/10"
                      animate={isAutoPressing ? { scale: [1, 0.94, 1.08], opacity: [0.35, 0.55, 0.05] } : { scale: 1, opacity: 0.15 }}
                      transition={{ duration: 0.42, ease: "easeOut" }}
                    />
                    <motion.span
                      className="pointer-events-none absolute inset-0 -z-10 rounded-full ring-2 ring-teal/20"
                      animate={isAutoPressing ? { scale: [1, 1.12], opacity: [0.8, 0] } : { scale: 1, opacity: 0.45 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </>
                )}
                {s.icon}
                <span className={`${i === current ? "inline" : "hidden sm:inline"}`}>{s.label}</span>
              </button>
            ))}

          </div>

          <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Próxima tela">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating cursor — rendered outside the overflow-hidden chrome */}
      {showAutoDemo && cursorPos.ready && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 z-30"
          animate={{
            x: cursorPos.x - 14,
            y: cursorPos.y - 38,
            scale: isAutoPressing ? 0.86 : 1,
            opacity: 1,
          }}
          transition={{
            x: { type: "spring", stiffness: 280, damping: 24 },
            y: { type: "spring", stiffness: 280, damping: 24 },
            scale: { duration: 0.16, ease: "easeOut" },
            opacity: { duration: 0.2 },
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-teal/25 blur-lg scale-150" />
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white shadow-[0_10px_28px_rgba(15,118,110,0.25)]">
              <span className="h-3 w-3 rounded-full bg-gradient-to-br from-teal to-primary" />
            </div>
            <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-2 rotate-45 border-b-2 border-r-2 border-white bg-white" />
          </div>
        </motion.div>
      )}

      {/* Auto-play progress bar */}
      {!paused && !reduce && (
        <div className="mt-3 mx-auto w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            key={`prog-${current}`}
            className="h-full bg-gradient-to-r from-teal to-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: SCREEN_INTERVAL / 1000, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}
