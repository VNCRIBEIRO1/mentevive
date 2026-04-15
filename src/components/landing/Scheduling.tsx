"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Video, CheckCircle, Leaf, User, Mail, Phone, FileText } from "lucide-react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { getAvailabilityForDate, getTimeOptionsForDate, type AvailabilitySlot } from "@/lib/availability-slots";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type PricingItem = { label: string; key: string; duration: string; value: string };

export function Scheduling() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selSlot, setSelSlot] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<{date: string; startTime: string}[]>([]);
  const [fetched, setFetched] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Form fields for anonymous user
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Defer data fetch until section is visible (IntersectionObserver)
  useEffect(() => {
    if (fetched) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setFetched(true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetched]);

  useEffect(() => {
    if (!fetched) return;
    // Fetch availability from public endpoint
    fetch("/api/portal/availability")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAvailability(Array.isArray(d) ? d : []))
      .catch(() => setAvailability([]))
      .finally(() => setLoadingAvail(false));

    // Fetch pricing from public endpoint
    fetch("/api/portal/settings?key=pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.value && Array.isArray(d.value)) setPricing(d.value as PricingItem[]);
      })
      .catch(() => {});

    // Fetch booked slots to filter conflicts
    fetch("/api/portal/booked-slots")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setBookedSlots(d); })
      .catch(() => {});
  }, [fetched]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  };

  const changeMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Check if a given day of month has availability configured
  const getDayAvailability = useCallback((d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return getAvailabilityForDate(dateStr, availability);
  }, [year, month, availability]);

  const selectDate = useCallback((d: number) => {
    setSelDate(new Date(year, month, d));
    setSelSlot(null);
  }, [year, month]);

  // Generate available time slots for selected date (filter booked)
  const availableSlots = selDate
    ? (() => {
        const dateStr = `${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, "0")}-${String(selDate.getDate()).padStart(2, "0")}`;
        return getTimeOptionsForDate(dateStr, availability).filter(
          (t) => !bookedSlots.some((b) => b.date === dateStr && b.startTime === t)
        );
      })()
    : [];

  // Get price label
  const currentPrice = pricing.find((p) => p.key === "individual_online");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selDate || !selSlot) {
      showToast("⚠️ Selecione data e horário.");
      return;
    }
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      showToast("⚠️ Preencha nome, e-mail e telefone.");
      return;
    }

    setSubmitting(true);

    // Store PII in sessionStorage (never in URL) for security
    const dateStr = `${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, "0")}-${String(selDate.getDate()).padStart(2, "0")}`;
    sessionStorage.setItem("booking", JSON.stringify({
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      notes: formNotes.trim() || "",
    }));

    // Only non-sensitive data in URL params
    const params = new URLSearchParams({
      booking: "1",
      redirect: "/portal/agendar",
      date: dateStr,
      time: selSlot,
    });

    // Redirect to registration page with booking data
    window.location.href = `/registro?${params.toString()}`;
  };

  const dateStr = selDate
    ? `${String(selDate.getDate()).padStart(2, "0")}/${String(selDate.getMonth() + 1).padStart(2, "0")}/${selDate.getFullYear()}`
    : "--";

  return (
    <section ref={sectionRef} className="py-20 px-4 md:px-8 bg-white" id="agendamento">
      <AnimatedSection className="max-w-[1100px] mx-auto text-center">
        <AnimatedItem>
          <div className="section-label justify-center flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-teal" />
            Agendamento
          </div>
          <h2 className="section-title">Agende sua Sessão</h2>
          <p className="text-txt-light max-w-[520px] mx-auto text-sm">
            Escolha a data e horário que melhor funciona para você. Após preencher, você será direcionado(a) para criar sua conta.
          </p>
        </AnimatedItem>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 max-w-[1100px] mx-auto">
        {/* Calendar */}
        <AnimatedSection direction="left">
          <AnimatedItem>
            <div className="glass rounded-brand p-6 shadow-warm-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-teal" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${month}-${year}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {MONTHS[month]} {year}
                    </motion.span>
                  </AnimatePresence>
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeMonth(-1)}
                    className="w-8 h-8 rounded-full border-[1.5px] border-teal/40 glass text-teal-dark flex items-center justify-center hover:bg-teal hover:text-white transition-colors"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeMonth(1)}
                    className="w-8 h-8 rounded-full border-[1.5px] border-teal/40 glass text-teal-dark flex items-center justify-center hover:bg-teal hover:text-white transition-colors"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS.map((d) => (
                  <div key={d} className="text-[0.65rem] font-bold text-teal-dark py-1">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const dt = new Date(year, month, d);
                  const past = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const hasAvail = getDayAvailability(d).length > 0;
                  const disabled = past || !hasAvail;
                  const selected = selDate && d === selDate.getDate() && month === selDate.getMonth() && year === selDate.getFullYear();
                  const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                  return (
                    <motion.button
                      key={d}
                      disabled={disabled}
                      onClick={() => selectDate(d)}
                      whileHover={!disabled ? { scale: 1.1 } : undefined}
                      whileTap={!disabled ? { scale: 0.95 } : undefined}
                      aria-label={`${d} de ${MONTHS[month]} de ${year}${disabled ? ', indisponível' : ''}${selected ? ', selecionado' : ''}${isToday ? ', hoje' : ''}`}
                      className={`text-xs p-2 rounded-lg transition-colors font-body relative
                        ${disabled ? "text-txt-muted opacity-40 cursor-default" : "hover:bg-teal/10 cursor-pointer"}
                        ${selected ? "!bg-teal !text-white font-bold shadow-glow-teal" : ""}
                        ${isToday && !selected ? "border-2 border-teal font-bold" : ""}
                      `}
                    >
                      {d}
                      {hasAvail && !past && (
                        <motion.span
                          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {loadingAvail && (
                <p className="text-center text-xs text-txt-muted mt-3">Carregando disponibilidade…</p>
              )}
              {!loadingAvail && availability.length === 0 && (
                <p className="text-center text-xs text-txt-muted mt-3">
                  Nenhum horário configurado ainda. Entre em contato pelo WhatsApp.
                </p>
              )}
            </div>
          </AnimatedItem>

          {/* Slots */}
          <AnimatedItem>
            <div className="mt-5">
              <h4 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal" />
                Horários Disponíveis — <span className="text-teal-dark">{selDate ? dateStr : "Selecione uma data"}</span>
              </h4>
              <AnimatePresence mode="wait">
                {!selDate ? (
                  <motion.p
                    key="no-date"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4 text-sm text-txt-muted"
                  >
                    Selecione uma data no calendário acima
                  </motion.p>
                ) : availableSlots.length === 0 ? (
                  <motion.p
                    key="no-slots"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4 text-sm text-txt-muted"
                  >
                    Nenhum horário disponível neste dia.
                  </motion.p>
                ) : (
                  <motion.div
                    key={selDate.toISOString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-5 gap-2"
                  >
                    {availableSlots.map((time, idx) => (
                      <motion.button
                        key={time}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelSlot(time)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`py-2 px-3 rounded-brand-sm border-[1.5px] text-xs font-semibold text-center transition-colors font-body
                          ${selSlot === time ? "bg-teal text-white border-teal shadow-glow-teal" : "border-teal/20 glass text-txt hover:border-teal hover:bg-teal/5"}
                        `}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnimatedItem>
        </AnimatedSection>

        {/* Form */}
        <AnimatedSection direction="right">
          <AnimatedItem>
            <div className="glass-strong rounded-brand p-6 shadow-warm-md">
              <h3 className="font-heading text-base font-semibold mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal" />
                Dados do Agendamento
              </h3>

              <div className="mb-5">
                <label className="block text-xs font-bold mb-2 text-teal-dark">Modalidade</label>
                <div className="flex gap-3">
                  <div className="flex-1 py-2.5 rounded-brand-sm border-[1.5px] text-sm font-semibold text-center bg-teal text-white border-teal shadow-glow-teal font-body flex items-center justify-center gap-2">
                    <Video className="w-4 h-4" />
                    Videochamada
                  </div>
                </div>
              </div>

              <motion.div
                layout
                className="glass rounded-brand-sm p-4 mb-5 text-sm text-txt-light leading-relaxed"
              >
                <strong className="text-teal-dark">Resumo:</strong> Videochamada • {dateStr} às {selSlot || "--"}
                {currentPrice && (
                  <span className="block text-xs text-teal-dark font-bold mt-1">
                    💰 Valor: R$ {Number(currentPrice.value).toFixed(2)} ({currentPrice.duration})
                  </span>
                )}
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-teal" /> Nome completo *
                  </label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full py-2.5 px-3 border-[1.5px] border-teal/15 rounded-brand-sm font-body text-sm bg-white/70 text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-teal" /> E-mail *
                  </label>
                  <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full py-2.5 px-3 border-[1.5px] border-teal/15 rounded-brand-sm font-body text-sm bg-white/70 text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-teal" /> Telefone / WhatsApp *
                  </label>
                  <input type="tel" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full py-2.5 px-3 border-[1.5px] border-teal/15 rounded-brand-sm font-body text-sm bg-white/70 text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-teal" /> Observações
                  </label>
                  <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Algo que gostaria de compartilhar antes da sessão?" rows={3}
                    className="w-full py-2.5 px-3 border-[1.5px] border-teal/15 rounded-brand-sm font-body text-sm bg-white/70 text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-all resize-y" />
                </div>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-brand-primary w-full justify-center disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    "Redirecionando…"
                  ) : (
                    <>
                      Criar Conta e Agendar
                      <Leaf className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
                <p className="text-center text-[0.7rem] text-txt-muted">
                  Você será direcionado(a) para criar sua conta antes de finalizar o agendamento.
                </p>
                <p className="text-center text-xs text-txt-light mt-2">
                  Já tem conta?{" "}
                  <a href="/login" className="text-teal font-bold hover:underline">
                    Entre aqui
                  </a>
                </p>
              </form>
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-teal text-white px-8 py-4 rounded-brand-sm font-bold z-[300] shadow-glow-teal text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
