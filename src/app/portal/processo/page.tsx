"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getAvailabilityForDate, getTimeOptionsForDate, type AvailabilitySlot } from "@/lib/availability-slots";
import { Leaf, ArrowLeft } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type BookedSlot = { date: string; startTime: string };
type BlockedDate = { date: string };
type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  recurrenceType?: string | null;
  recurrenceGroupId?: string | null;
};

type Step = "info" | "config" | "date" | "time" | "confirm" | "done";

export default function ProcessoPage() {
  const now = new Date();
  const [step, setStep] = useState<Step>("info");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [existingAppts, setExistingAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Config
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly">("weekly");
  const [weeks, setWeeks] = useState(8);
  const [modality, setModality] = useState("online");
  const [notes, setNotes] = useState("");

  // Date/time selection
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Result
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    skippedDates: { date: string; reason: string }[];
    recurrenceGroupId: string;
  } | null>(null);

  // Check if patient already has an active recurrence
  const activeRecurrence = existingAppts.find(
    (a) => a.recurrenceType && a.recurrenceGroupId && (a.status === "pending" || a.status === "confirmed")
  );

  useEffect(() => {
    const init = async () => {
      try {
        const [availRes, apptsRes, blockedRes, bookedRes] = await Promise.all([
          fetch("/api/portal/availability"),
          fetch("/api/portal/appointments"),
          fetch("/api/portal/blocked-dates").catch(() => null),
          fetch("/api/portal/booked-slots").catch(() => null),
        ]);

        if (availRes.ok) {
          const data = await availRes.json();
          setAvailability(Array.isArray(data) ? data : []);
        }

        if (apptsRes.ok) {
          const data = await apptsRes.json();
          const list = Array.isArray(data)
            ? data.map((row: Record<string, unknown>) => (row.appointment ?? row) as Appointment)
            : [];
          setExistingAppts(list);
        }

        if (bookedRes && bookedRes.ok) {
          const data = await bookedRes.json();
          if (Array.isArray(data)) setBookedSlots(data);
        }

        if (blockedRes && blockedRes.ok) {
          const data = await blockedRes.json();
          if (Array.isArray(data)) setBlockedDates(data);
        }
      } catch { /* network error */ }
      setLoading(false);
    };
    init();
  }, []);

  // Calendar helpers
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
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const isAvailableDay = (d: number) => {
    const dt = new Date(year, month, d);
    const dateStr = fmtDate(d);
    if (dt < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return false;
    if (blockedDates.some((b) => b.date === dateStr)) return false;
    return getAvailabilityForDate(dateStr, availability).length > 0;
  };

  const getTimeSlotsForDate = (dateStr: string) => {
    return getTimeOptionsForDate(dateStr, availability).filter(
      (t) => !bookedSlots.some((b) => b.date === dateStr && b.startTime === t)
    );
  };

  const fmtDateBR = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

  // Preview dates
  const getPreviewDates = () => {
    if (!selectedDate) return [];
    const stepDays = recurrenceType === "weekly" ? 7 : 14;
    const base = new Date(selectedDate + "T12:00:00");
    const dates: string[] = [];
    for (let i = 0; i < weeks; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i * stepDays);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setError("");

    const [h, m] = selectedTime.split(":").map(Number);
    const endTime = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/portal/appointments/recurrence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: selectedDate,
          startTime: selectedTime,
          endTime,
          modality,
          recurrenceType,
          weeks,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStep("done");
      } else {
        setError(data.error || "Erro ao criar agendamentos.");
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    }
    setSaving(false);
  };

  const selectedDow = selectedDate
    ? DAY_NAMES[new Date(selectedDate + "T00:00:00").getDay()]
    : "";

  return (
    <div>
      <PortalPageHeader
        icon={<Leaf className="w-6 h-6" />}
        title="Processo Terapêutico"
        subtitle="Garanta seu horário fixo semanal ou quinzenal 🌿"
        gradient="teal"
        action={
          <Link href="/portal" className="text-xs text-teal-dark font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao portal
          </Link>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm mb-6">{error}</div>
      )}

      {/* Active recurrence banner */}
      {activeRecurrence && step === "info" && (
        <div className="bg-green-50 border border-green-200 rounded-brand p-5 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Você já tem um processo terapêutico ativo!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Agendamento {activeRecurrence.recurrenceType === "weekly" ? "semanal" : "quinzenal"} configurado.
                Veja suas sessões no painel.
              </p>
            </div>
            <Link href="/portal/sessoes" className="text-xs text-green-800 font-bold hover:underline whitespace-nowrap ml-auto">
              Ver Sessões →
            </Link>
          </div>
        </div>
      )}

      {/* STEP: INFO */}
      {step === "info" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-brand p-6">
            <h2 className="font-heading text-lg font-semibold text-txt mb-3">
              Como funciona o Processo Terapêutico?
            </h2>
            <div className="space-y-3 text-sm text-txt-light">
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <p><strong>Escolha a frequência</strong> — Semanal (toda semana, mesmo dia e horário) ou quinzenal (a cada 15 dias).</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <p><strong>Selecione data e horário</strong> — Escolha o dia da primeira sessão. As demais serão geradas automaticamente.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <p><strong>Horário garantido</strong> — Seu horário fica reservado e ninguém mais pode agendar nele.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <p><strong>Flexibilidade</strong> — Se precisar cancelar alguma sessão específica, entre em contato pelo WhatsApp.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5">
            <h3 className="font-heading text-sm font-semibold text-txt mb-3">💡 Benefícios do horário fixo</h3>
            <ul className="space-y-2 text-sm text-txt-light">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Garantia de vaga no horário que funciona para você
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Continuidade do processo terapêutico
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Não precisa agendar manualmente toda semana
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Maior comprometimento com sua saúde mental
              </li>
            </ul>
          </div>

          <button
            onClick={() => setStep("config")}
            className="btn-brand-primary w-full text-base py-3"
          >
            Quero garantir meu horário →
          </button>
        </div>
      )}

      {/* STEP: CONFIG */}
      {step === "config" && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl">
          <h3 className="font-heading text-base font-semibold text-txt mb-6">Configure seu processo</h3>

          {/* Frequency */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-txt mb-2">Frequência das sessões</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRecurrenceType("weekly")}
                className={`p-4 rounded-brand-sm border-[2px] text-left transition-colors ${
                  recurrenceType === "weekly"
                    ? "border-primary bg-primary/5"
                    : "border-primary/15 hover:border-primary/30"
                }`}
              >
                <p className="text-sm font-bold text-txt">📅 Semanal</p>
                <p className="text-xs text-txt-muted mt-1">Toda semana, mesmo dia e horário</p>
              </button>
              <button
                onClick={() => setRecurrenceType("biweekly")}
                className={`p-4 rounded-brand-sm border-[2px] text-left transition-colors ${
                  recurrenceType === "biweekly"
                    ? "border-primary bg-primary/5"
                    : "border-primary/15 hover:border-primary/30"
                }`}
              >
                <p className="text-sm font-bold text-txt">🗓️ Quinzenal</p>
                <p className="text-xs text-txt-muted mt-1">A cada 15 dias, mesmo dia e horário</p>
              </button>
            </div>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-txt mb-2">
              Quantas semanas agendar?
            </label>
            <div className="flex gap-2">
              {[4, 8, 12].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeeks(w)}
                  className={`flex-1 py-2.5 rounded-brand-sm text-sm font-medium border transition-colors ${
                    weeks === w
                      ? "border-primary bg-primary text-white"
                      : "border-primary/15 text-txt hover:border-primary/30"
                  }`}
                >
                  {w} semanas
                  <span className="block text-[0.65rem] opacity-70">
                    ({recurrenceType === "weekly" ? w : Math.ceil(w / 2)} sessões)
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Modality */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-txt mb-2">Modalidade</label>
            <div className="flex gap-2">
              <div className="flex-1 py-2.5 rounded-brand-sm text-sm font-medium border text-center border-primary bg-primary text-white">
                📹 Online (videochamada)
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-txt mb-1.5">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Preferência de horário, observações…"
              className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("date")} className="btn-brand-primary flex-1">
              Escolher data e horário →
            </button>
            <button onClick={() => setStep("info")} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* STEP: DATE */}
      {step === "date" && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl">
          <p className="text-sm text-txt-muted mb-4">
            Escolha a data da <strong>primeira sessão</strong>. As próximas serão geradas automaticamente
            {recurrenceType === "weekly" ? " toda semana" : " a cada 15 dias"} no mesmo dia e horário.
          </p>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-semibold text-txt">{MONTHS[month]} {year}</h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full border-[1.5px] border-primary bg-transparent text-primary-dark flex items-center justify-center hover:bg-primary hover:text-white transition-colors">‹</button>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full border-[1.5px] border-primary bg-transparent text-primary-dark flex items-center justify-center hover:bg-primary hover:text-white transition-colors">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-txt-muted py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const avail = isAvailableDay(d);
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dateStr = fmtDate(d);
              const isBlocked = blockedDates.some((b) => b.date === dateStr);
              return (
                <button
                  key={d}
                  onClick={() => {
                    if (!avail) return;
                    setSelectedDate(dateStr);
                    setSelectedTime(null);
                    setStep("time");
                  }}
                  disabled={!avail}
                  className={`h-10 rounded-brand-sm text-sm font-medium transition-colors relative
                    ${avail ? "hover:bg-primary hover:text-white cursor-pointer text-txt" : "text-gray-300 cursor-not-allowed"}
                    ${isToday ? "border-2 border-primary text-primary-dark" : ""}
                    ${isBlocked ? "bg-red-50 line-through" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep("config")} className="text-xs text-primary-dark font-bold hover:underline mt-4">
            ← Alterar configuração
          </button>
        </div>
      )}

      {/* STEP: TIME */}
      {step === "time" && selectedDate && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">
            {fmtDateBR(selectedDate)}
          </h3>
          <p className="text-sm text-txt-muted mb-4">
            Este será o horário fixo de todas as suas sessões ({selectedDow}).
          </p>

          {getTimeSlotsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-txt-muted">Todos os horários deste dia estão ocupados.</p>
              <button onClick={() => { setStep("date"); setSelectedDate(null); }} className="mt-3 text-xs text-primary-dark font-bold hover:underline">
                ← Escolher outra data
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                {getTimeSlotsForDate(selectedDate).map((t) => {
                  const endH = Number(t.split(":")[0]) + 1;
                  const endStr = `${String(endH).padStart(2, "0")}:00`;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTime(t);
                        setStep("confirm");
                      }}
                      className="py-2.5 px-3 rounded-brand-sm text-sm font-medium border border-primary/15 text-txt hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <span>{t}</span>
                      <span className="block text-[0.65rem] opacity-70">até {endStr}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { setStep("date"); setSelectedDate(null); }} className="text-xs text-primary-dark font-bold hover:underline">
                ← Escolher outra data
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP: CONFIRM */}
      {step === "confirm" && selectedDate && selectedTime && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-2xl">
          <h3 className="font-heading text-base font-semibold text-txt mb-4">Confirme seu Processo Terapêutico</h3>

          {/* Summary */}
          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Frequência</span>
              <span className="text-txt font-medium">{recurrenceType === "weekly" ? "📅 Semanal" : "🗓️ Quinzenal"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Dia fixo</span>
              <span className="text-txt font-medium">{selectedDow}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Horário fixo</span>
              <span className="text-txt font-medium">{selectedTime} – {String(Number(selectedTime.split(":")[0]) + 1).padStart(2, "0")}:00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Modalidade</span>
              <span className="text-txt font-medium">📹 Online</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/5">
              <span className="text-txt-muted">Total de sessões</span>
              <span className="text-txt font-bold text-primary-dark">{weeks} sessões</span>
            </div>
          </div>

          {/* Preview dates */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-txt mb-2">📅 Datas das sessões:</h4>
            <div className="bg-bg rounded-brand-sm p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {getPreviewDates().map((d, i) => {
                  const isBlocked = blockedDates.some((b) => b.date === d);
                  const isBooked = bookedSlots.some((b) => b.date === d && b.startTime === selectedTime);
                  const conflict = isBlocked || isBooked;
                  return (
                    <div
                      key={d}
                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-brand-sm ${
                        conflict ? "bg-yellow-50 text-yellow-700" : "bg-white text-txt"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${
                        conflict ? "bg-yellow-200 text-yellow-800" : "bg-primary/10 text-primary-dark"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="font-medium">
                        {new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short", day: "2-digit", month: "short",
                        })}
                      </span>
                      {conflict && <span className="text-[0.6rem] text-yellow-600 ml-auto">⚠ pode ser pulada</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-[0.65rem] text-txt-muted mt-2">
              Datas com conflitos serão automaticamente puladas. Cada sessão será confirmada individualmente.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleConfirm} disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
              {saving ? "Agendando sessões…" : `Confirmar ${weeks} Sessões`}
            </button>
            <button onClick={() => setStep("time")} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* STEP: DONE */}
      {step === "done" && result && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 max-w-xl text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="font-heading text-lg font-semibold text-txt mt-4">
            Processo Terapêutico Ativado!
          </h3>
          <p className="text-sm text-txt-muted mt-2 mb-4">
            <strong className="text-primary-dark">{result.created} sessões</strong> foram agendadas com sucesso.
            {result.skipped > 0 && (
              <> ({result.skipped} {result.skipped === 1 ? "data foi pulada" : "datas foram puladas"} por conflitos)</>
            )}
          </p>

          <div className="bg-green-50 border border-green-200 rounded-brand-sm p-4 mb-4 text-left">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Seu horário fixo está garantido!</p>
            <p className="text-xs text-green-700">
              Todas as {recurrenceType === "weekly" ? "semanas" : "quinzenas"}, {selectedDow} às {selectedTime}.
              A profissional irá confirmar cada sessão e você receberá o link no portal.
            </p>
          </div>

          {result.skippedDates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-brand-sm p-3 mb-4 text-left">
              <p className="text-xs font-bold text-yellow-800 mb-1">Datas puladas:</p>
              {result.skippedDates.map((s) => (
                <p key={s.date} className="text-xs text-yellow-700">
                  {new Date(s.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — {s.reason}
                </p>
              ))}
            </div>
          )}

          <div className="bg-[#dcf8c6] border border-green-300 rounded-brand-sm p-3 mb-6 text-left">
            <p className="text-xs text-green-800 mb-2">
              <strong>Envie uma mensagem</strong> confirmando o início do seu processo:
            </p>
            <button
              onClick={() => {
                const msg = `*Processo Terapêutico*\n\nOlá! Acabei de ativar meu processo terapêutico ${recurrenceType === "weekly" ? "semanal" : "quinzenal"} pelo site.\n\n*Dia fixo:* ${selectedDow}\n*Horário:* ${selectedTime}\n*Sessões agendadas:* ${result.created}\n\nAguardo a confirmação! 💚`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-brand-sm hover:bg-[#1da855] transition-colors"
            >
              💬 Confirmar pelo WhatsApp
            </button>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/portal/sessoes" className="btn-brand-primary">Ver Minhas Sessões</Link>
            <Link href="/portal" className="btn-brand-outline">Voltar ao Portal</Link>
          </div>
        </div>
      )}
    </div>
  );
}
