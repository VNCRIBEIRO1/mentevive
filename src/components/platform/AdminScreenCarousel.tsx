"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard, CalendarCheck, FileText, Video, Users,
  ChevronLeft, ChevronRight, TrendingUp, Clock, Eye, EyeOff,
  MessageSquare, BarChart3,
} from "lucide-react";

/* ── Fake data ── */
const ADMIN = { name: "Dra. Bianca", initials: "DB" };

const TODAY_SESSIONS = [
  { time: "09:00", patient: "Camila R.", status: "Confirmada", statusColor: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-500/30" },
  { time: "10:00", patient: "João M.", status: "Confirmada", statusColor: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-500/30" },
  { time: "14:00", patient: "Ana L.", status: "Pendente", statusColor: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-500/30" },
];

const CHART_DATA = [65, 45, 72, 58, 80, 68, 75];
const CHART_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const PATIENTS = [
  { name: "Camila R.", sessions: 8, lastDate: "07 abr", status: "Ativa", color: "bg-emerald-900/40 text-emerald-400" },
  { name: "João M.", sessions: 12, lastDate: "05 abr", status: "Ativa", color: "bg-emerald-900/40 text-emerald-400" },
  { name: "Ana L.", sessions: 5, lastDate: "01 abr", status: "Nova", color: "bg-primary/25 text-primary-light" },
  { name: "Pedro S.", sessions: 15, lastDate: "28 mar", status: "Ativa", color: "bg-emerald-900/40 text-emerald-400" },
];

const RECORDS = [
  { patient: "Camila R.", session: 8, date: "07 abr", note: "Progresso com ACT. Defusão cognitiva aplicada.", hasPrivate: true },
  { patient: "João M.", session: 12, date: "05 abr", note: "Revisão de metas terapêuticas.", hasPrivate: true },
  { patient: "Ana L.", session: 5, date: "01 abr", note: "Exercício de exposição gradual.", hasPrivate: false },
];

const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  hasSessions: [2, 5, 7, 9, 12, 14, 16, 19, 21, 23, 26, 28, 30].includes(i + 1),
}));

/* ── Screen Components ── */

function ScreenAdminDashboard() {
  const maxVal = Math.max(...CHART_DATA);
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-primary/10 to-teal/8 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{ADMIN.initials}</div>
        <div>
          <p className="text-[11px] font-bold text-txt">Olá, {ADMIN.name} 🩺</p>
          <p className="text-[9px] text-txt-muted">Painel de gestão do consultório</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { val: "3", label: "Hoje", icon: <CalendarCheck className="w-3 h-3 text-teal" />, ring: "ring-teal/20 from-teal/12" },
          { val: "24", label: "Pacientes", icon: <Users className="w-3 h-3 text-primary-light" />, ring: "ring-primary/20 from-primary/12" },
          { val: "R$ 4.320", label: "Receita/mês", icon: <TrendingUp className="w-3 h-3 text-emerald-400" />, ring: "ring-emerald-500/20 from-emerald-900/30" },
          { val: "96%", label: "Presença", icon: <BarChart3 className="w-3 h-3 text-accent" />, ring: "ring-accent/20 from-accent/12" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.ring} to-transparent rounded-lg p-2 ring-1 text-center`}>
            <div className="flex justify-center mb-0.5">{s.icon}</div>
            <p className="text-[11px] font-bold text-txt leading-tight">{s.val}</p>
            <p className="text-[7px] text-txt-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-2.5">
        <p className="text-[9px] font-bold text-txt mb-2">📊 Sessões da Semana</p>
        <div className="flex items-end gap-1 h-16">
          {CHART_DATA.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full bg-gradient-to-t from-teal to-primary rounded-t-sm" style={{ height: `${(v / maxVal) * 100}%` }} />
              <span className="text-[6px] text-txt-muted">{CHART_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-2.5">
        <p className="text-[9px] font-bold text-txt mb-2 flex items-center gap-1"><Clock className="w-3 h-3 text-teal" /> Sessões de Hoje</p>
        {TODAY_SESSIONS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
            <span className="text-[10px] font-bold text-teal w-10 flex-shrink-0">{s.time}</span>
            <span className="text-[9px] text-txt flex-1">{s.patient}</span>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${s.statusColor}`}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenAgenda() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-teal/10 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center"><CalendarCheck className="w-4 h-4 text-teal" /></div>
        <div>
          <p className="text-[11px] font-bold text-txt">Agenda</p>
          <p className="text-[8px] text-txt-muted">Abril 2026</p>
        </div>
      </div>
      {/* Mini calendar */}
      <div className="bg-card rounded-xl border border-border p-2.5">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} className="text-[6px] text-center text-txt-muted font-bold">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* offset for April 2026 starting Wednesday */}
          {[null, null, null].map((_, i) => <div key={`pad-${i}`} />)}
          {CALENDAR_DAYS.map((d) => (
            <div key={d.day} className={`w-full aspect-square rounded-md flex items-center justify-center text-[7px] font-medium ${d.hasSessions ? "bg-teal/15 text-teal ring-1 ring-teal/25" : "text-txt-muted hover:bg-surface"} ${d.day === 14 ? "!bg-primary/25 !text-primary-light font-bold" : ""}`}>
              {d.day}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-2.5">
        <p className="text-[9px] font-bold text-txt mb-2">📋 Próximas Sessões</p>
        {TODAY_SESSIONS.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center text-[9px] font-bold text-teal flex-shrink-0">{s.time}</div>
            <div className="flex-1">
              <p className="text-[9px] font-medium text-txt">{s.patient}</p>
              <p className="text-[7px] text-txt-muted flex items-center gap-0.5"><Video className="w-2 h-2" /> Online</p>
            </div>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${s.statusColor}`}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenProntuarios() {
  const [showPrivate, setShowPrivate] = useState(false);
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-purple-900/20 to-transparent rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center"><FileText className="w-4 h-4 text-purple-400" /></div>
          <div>
            <p className="text-[11px] font-bold text-txt">Prontuários</p>
            <p className="text-[8px] text-txt-muted">Registros clínicos</p>
          </div>
        </div>
        <button onClick={() => setShowPrivate(!showPrivate)} className="flex items-center gap-1 text-[8px] px-2 py-1 rounded-md bg-surface border border-border text-txt-muted hover:text-txt-light transition-colors">
          {showPrivate ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {showPrivate ? "Visível" : "Oculto"}
        </button>
      </div>
      {RECORDS.map((r, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-[7px] font-bold">{r.patient[0]}</div>
              <p className="text-[9px] font-bold text-txt">{r.patient}</p>
            </div>
            <p className="text-[7px] text-txt-muted">Sessão #{r.session} · {r.date}</p>
          </div>
          <div className="bg-surface rounded-lg p-2 mb-1.5">
            <p className="text-[8px] text-txt leading-relaxed">{r.note}</p>
          </div>
          {r.hasPrivate && (
            <div className={`border rounded-lg p-2 ${showPrivate ? "bg-red-900/15 border-red-500/20" : "bg-surface border-border"}`}>
              {showPrivate ? (
                <>
                  <p className="text-[7px] font-bold text-red-400 mb-0.5">🔒 Nota Privada:</p>
                  <p className="text-[8px] text-txt leading-relaxed">Observação clínica confidencial…</p>
                </>
              ) : (
                <p className="text-[7px] text-txt-muted flex items-center gap-1"><EyeOff className="w-2.5 h-2.5" /> Nota privada oculta</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScreenSessionDetail() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-teal/10 to-primary/8 rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal/15 flex items-center justify-center"><Video className="w-4 h-4 text-teal" /></div>
        <div>
          <p className="text-[11px] font-bold text-txt">Sessão #8 — Camila R.</p>
          <p className="text-[8px] text-txt-muted">07 abr 2026 · 14:00–14:50</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-emerald-900/30 to-transparent rounded-lg p-2.5 ring-1 ring-emerald-500/20 text-center">
          <p className="text-[11px] font-bold text-emerald-400">Realizada</p>
          <p className="text-[8px] text-txt-muted">Status</p>
        </div>
        <div className="bg-gradient-to-br from-primary/12 to-transparent rounded-lg p-2.5 ring-1 ring-primary/20 text-center">
          <p className="text-[11px] font-bold text-txt">50 min</p>
          <p className="text-[8px] text-txt-muted">Duração</p>
        </div>
      </div>
      {/* Private note */}
      <div className="bg-red-900/15 border border-red-500/20 rounded-xl p-3">
        <p className="text-[8px] font-bold text-red-400 mb-1">🔒 Notas Privadas da Terapeuta</p>
        <p className="text-[8px] text-txt leading-relaxed">Paciente demonstrou avanço significativo. Sugiro aprofundar exercícios de defusão cognitiva na próxima sessão.</p>
      </div>
      {/* Patient note */}
      <div className="bg-blue-900/15 border border-blue-500/20 rounded-xl p-3">
        <p className="text-[8px] font-bold text-blue-400 mb-1">📝 Anotação da Paciente</p>
        <p className="text-[8px] text-txt leading-relaxed">Me senti mais leve essa semana. Consegui usar a respiração no trabalho. Quero continuar com os exercícios.</p>
      </div>
      {/* Feedback */}
      <div className="bg-purple-900/15 border border-purple-500/20 rounded-xl p-3">
        <p className="text-[8px] font-bold text-purple-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Feedback</p>
        <p className="text-[8px] text-txt leading-relaxed">Excelente progresso com exercícios de ACT. Continue praticando a defusão cognitiva.</p>
      </div>
    </div>
  );
}

function ScreenPatients() {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
        <div>
          <p className="text-[11px] font-bold text-txt">Meus Pacientes</p>
          <p className="text-[8px] text-txt-muted">Gestão e acompanhamento</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-gradient-to-br from-primary/12 to-transparent rounded-lg p-2 ring-1 ring-primary/20 text-center">
          <p className="text-sm font-bold text-txt">24</p>
          <p className="text-[7px] text-txt-muted">Total</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-900/30 to-transparent rounded-lg p-2 ring-1 ring-emerald-500/20 text-center">
          <p className="text-sm font-bold text-emerald-400">20</p>
          <p className="text-[7px] text-txt-muted">Ativos</p>
        </div>
        <div className="bg-gradient-to-br from-accent/12 to-transparent rounded-lg p-2 ring-1 ring-accent/20 text-center">
          <p className="text-sm font-bold text-accent">2</p>
          <p className="text-[7px] text-txt-muted">Novos</p>
        </div>
      </div>
      {PATIENTS.map((p, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-border hover:border-teal/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
            {p.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-bold text-txt">{p.name}</p>
            <p className="text-[7px] text-txt-muted">{p.sessions} sessões · Última: {p.lastDate}</p>
          </div>
          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${p.color}`}>{p.status}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Screen configuration ── */
const screens = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" />, component: ScreenAdminDashboard, url: "/admin" },
  { id: "agenda", label: "Agenda", icon: <CalendarCheck className="w-3.5 h-3.5" />, component: ScreenAgenda, url: "/admin/agenda" },
  { id: "prontuarios", label: "Prontuários", icon: <FileText className="w-3.5 h-3.5" />, component: ScreenProntuarios, url: "/admin/prontuarios" },
  { id: "session", label: "Sessão", icon: <Video className="w-3.5 h-3.5" />, component: ScreenSessionDetail, url: "/admin/sessao/8" },
  { id: "patients", label: "Pacientes", icon: <Users className="w-3.5 h-3.5" />, component: ScreenPatients, url: "/admin/pacientes" },
];

const SCREEN_INTERVAL = 3600;

function getDirection(from: number, to: number) {
  if (to === from) return 1;
  if ((from + 1) % screens.length === to) return 1;
  if ((from - 1 + screens.length) % screens.length === to) return -1;
  return to > from ? 1 : -1;
}

export function AdminScreenCarousel() {
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
      aria-label="Telas do painel administrativo"
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-[8px] font-bold mb-2">{ADMIN.initials}</div>
            {screens.map((s, i) => (
              <button key={s.id} onClick={() => goTo(i)} aria-label={`Abrir ${s.label}`} aria-current={i === current ? "page" : undefined}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${i === current ? "bg-primary/15 text-primary-light" : "text-txt-muted hover:bg-surface hover:text-txt-light"}`}>
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
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold transition-all duration-300 ${i === current ? "bg-primary/15 text-primary-light scale-105" : "text-txt-muted hover:text-txt-light"}`}>
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

      {!paused && !reduce && (
        <div className="mt-3 mx-auto w-48 h-1 bg-surface rounded-full overflow-hidden">
          <motion.div key={`prog-${current}`} className="h-full bg-gradient-to-r from-primary to-teal rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: SCREEN_INTERVAL / 1000, ease: "linear" }} />
        </div>
      )}
    </div>
  );
}
