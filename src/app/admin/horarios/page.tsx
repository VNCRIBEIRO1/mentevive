"use client";
import { useState, useEffect, useCallback } from "react";
import { generateTimeSlots } from "@/lib/time-utils";
import { getAvailabilityForDate, getTimeOptionsForDate } from "@/lib/availability-slots";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type AvailSlot = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

type CustomAvailSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type BlockedDate = {
  id: string;
  date: string;
  reason: string | null;
};

type BookedSlot = {
  date: string;
  startTime: string;
};

type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  patientName?: string;
};

type PatientOption = { id: string; name: string };

export default function HorariosPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [customAvailability, setCustomAvailability] = useState<CustomAvailSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [showAvailEditor, setShowAvailEditor] = useState(false);

  // Quick-book modal
  const [quickBookSlot, setQuickBookSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [quickBookPatient, setQuickBookPatient] = useState("");
  // modality is always online
  const [quickBookNotes, setQuickBookNotes] = useState("");
  const [customStartTime, setCustomStartTime] = useState("09:00");
  const [customEndTime, setCustomEndTime] = useState("10:00");

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [availRes, blockedRes, apptsRes, customRes] = await Promise.all([
        fetch("/api/availability"),
        fetch("/api/blocked-dates"),
        fetch("/api/appointments"),
        fetch("/api/custom-availability"),
      ]);

      if (availRes.ok) {
        const data = await availRes.json();
        setAvailability(Array.isArray(data) ? data : []);
      }

      if (blockedRes.ok) {
        const data = await blockedRes.json();
        setBlockedDates(Array.isArray(data) ? data : []);
      }

      if (customRes.ok) {
        const data = await customRes.json();
        setCustomAvailability(Array.isArray(data) ? data : []);
      }

      if (apptsRes.ok) {
        const data = await apptsRes.json();
        const list = Array.isArray(data)
          ? data.map((a: Record<string, unknown>) => ({
              ...(a.appointment ?? a),
              patientName: a.patientName,
            }) as Appointment)
          : [];
        setAppointments(list);
        // Build booked slots
        setBookedSlots(
          list
            .filter((a: Appointment) => a.status !== "cancelled")
            .map((a: Appointment) => ({ date: a.date, startTime: a.startTime }))
        );
      }
    } catch { /* network */ }
    setLoading(false);
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const d = await res.json();
        setPatients(Array.isArray(d) ? d.map((p: Record<string, unknown>) => ({ id: p.id as string, name: p.name as string })) : []);
      }
    } catch { /* network */ }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
      void fetchPatients();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData, fetchPatients]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const getDefaultEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = (hours * 60) + minutes + 60;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  };

  const handleQuickBook = async () => {
    if (!quickBookSlot || !quickBookPatient) return;
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: quickBookPatient,
          date: quickBookSlot.date,
          startTime: quickBookSlot.startTime,
          endTime: quickBookSlot.endTime,
          modality: "online",
          status: "confirmed",
          notes: quickBookNotes || null,
        }),
      });
      if (res.ok) {
        flash(`Sessão agendada às ${quickBookSlot.startTime}. Fluxo completo criado.`);
        setQuickBookSlot(null);
        setQuickBookPatient("");
        setQuickBookNotes("");
        await fetchData();
      } else {
        const b = await res.json().catch(() => ({}));
        flash((b as Record<string, string>).error || "Erro ao agendar.");
      }
    } catch { flash("Erro de conexão."); }
    setSaving(false);
  };

  const handleAddCustomAvailability = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/custom-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          startTime: customStartTime,
          endTime: customEndTime,
        }),
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        flash((data as Record<string, string>).error || "Erro ao adicionar horário.");
      } else {
        setCustomAvailability(Array.isArray(data) ? data : []);
        flash("Horário personalizado liberado neste dia.");
      }
    } catch {
      flash("Erro de conexão.");
    }
    setSaving(false);
  };

  const handleRemoveCustomAvailability = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/custom-availability?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        flash((data as Record<string, string>).error || "Erro ao remover horário.");
      } else {
        setCustomAvailability(Array.isArray(data) ? data : []);
        flash("Horário personalizado removido.");
      }
    } catch {
      flash("Erro de conexão.");
    }
    setSaving(false);
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
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;
  const allAvailability = [...availability, ...customAvailability];

  // Check day status
  const getDayInfo = (d: number) => {
    const dateStr = fmtDate(d);
    const dt = new Date(year, month, d);
    const dow = dt.getDay();
    const isBlocked = blockedDates.some((b) => b.date === dateStr);
    const hasAvail = getAvailabilityForDate(dateStr, allAvailability).length > 0;
    const dayApts = appointments.filter((a) => a.date === dateStr && a.status !== "cancelled");
    const isPast = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const totalSlots = getTimeOptionsForDate(dateStr, allAvailability).length;
    const bookedCount = bookedSlots.filter((b) => b.date === dateStr).length;
    const freeSlots = totalSlots - bookedCount;

    return { dateStr, dow, isBlocked, hasAvail, dayApts, isPast, totalSlots, bookedCount, freeSlots };
  };

  // Selected date details
  const selectedInfo = selectedDate ? (() => {
    const dt = new Date(selectedDate + "T00:00:00");
    const dow = dt.getDay();
    const isBlocked = blockedDates.some((b) => b.date === selectedDate);
    const blocked = blockedDates.find((b) => b.date === selectedDate);
    const hasAvail = getAvailabilityForDate(selectedDate, allAvailability).length > 0;
    const dayApts = appointments.filter((a) => a.date === selectedDate && a.status !== "cancelled");
    const uniqueTimes = getTimeOptionsForDate(selectedDate, allAvailability);
    const bookedTimes = bookedSlots.filter((b) => b.date === selectedDate).map((b) => b.startTime);
    const customSlotsForDay = customAvailability.filter((slot) => slot.date === selectedDate);

    return { dow, isBlocked, blocked, hasAvail, dayApts, uniqueTimes, bookedTimes, customSlotsForDay };
  })() : null;

  // Toggle block/unblock date
  const toggleBlockDate = async (dateStr: string) => {
    const existing = blockedDates.find((b) => b.date === dateStr);
    setSaving(true);
    try {
      if (existing) {
        // Unblock
        await fetch(`/api/blocked-dates?id=${existing.id}`, { method: "DELETE" });
        flash(`📅 ${dateStr} desbloqueado!`);
      } else {
        // Block
        const reason = prompt("Motivo do bloqueio (opcional):");
        await fetch("/api/blocked-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateStr, reason: reason || null }),
        });
        flash(`🚫 ${dateStr} bloqueado!`);
      }
      await fetchData();
    } catch {
      flash("Erro ao atualizar bloqueio.");
    }
    setSaving(false);
  };

  // Save availability slots
  const saveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: availability }),
      });
      if (res.ok) {
        flash("✅ Horários salvos!");
        await fetchData();
      } else {
        flash("Erro ao salvar horários.");
      }
    } catch {
      flash("Erro de conexão.");
    }
    setSaving(false);
  };

  const updateSlot = (idx: number, field: keyof AvailSlot, value: string | boolean | number) => {
    setAvailability((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSlot = (idx: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSlot = (dow: number) => {
    setAvailability((prev) => [
      ...prev,
      { dayOfWeek: dow, startTime: "09:00", endTime: "18:00", active: true },
    ]);
  };

  const fmtDateBR = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const statusLabel: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmada", cancelled: "Cancelada",
    completed: "Realizada", no_show: "Não compareceu",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-600", confirmed: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-500", completed: "bg-blue-100 text-blue-600",
    no_show: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-primary/20 text-txt text-sm px-5 py-3 rounded-brand-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-txt">Gestão de Horários</h1>
          <p className="text-sm text-txt-light mt-1">Gerencie disponibilidades, bloqueios e horários vagos</p>
        </div>
        <button
          onClick={() => setShowAvailEditor(!showAvailEditor)}
          className="btn-brand-primary text-sm"
        >
          {showAvailEditor ? "📅 Ver Calendário" : "⚙️ Editar Disponibilidade"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-brand p-4 shadow-sm border border-primary/5 text-center">
          <p className="text-2xl font-heading font-bold text-primary-dark">
            {availability.filter((s) => s.active).length + customAvailability.length}
          </p>
          <p className="text-xs text-txt-muted mt-1">Janelas e Extras</p>
        </div>
        <div className="bg-white rounded-brand p-4 shadow-sm border border-primary/5 text-center">
          <p className="text-2xl font-heading font-bold text-red-500">
            {blockedDates.length}
          </p>
          <p className="text-xs text-txt-muted mt-1">Datas Bloqueadas</p>
        </div>
        <div className="bg-white rounded-brand p-4 shadow-sm border border-primary/5 text-center">
          <p className="text-2xl font-heading font-bold text-green-600">
            {appointments.filter((a) => a.status === "confirmed" || a.status === "pending").length}
          </p>
          <p className="text-xs text-txt-muted mt-1">Sessões Ativas</p>
        </div>
        <div className="bg-white rounded-brand p-4 shadow-sm border border-primary/5 text-center">
          <p className="text-2xl font-heading font-bold text-blue-600">
            {(() => {
              // Count free slots for next 7 days
              let free = 0;
              for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                if (blockedDates.some((b) => b.date === dateStr)) continue;
                const unique = getTimeOptionsForDate(dateStr, allAvailability);
                const booked = bookedSlots.filter((b) => b.date === dateStr).length;
                free += Math.max(0, unique.length - booked);
              }
              return free;
            })()}
          </p>
          <p className="text-xs text-txt-muted mt-1">Vagos (7 dias)</p>
        </div>
      </div>

      {/* Availability Editor */}
      {showAvailEditor && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 mb-6">
          <h3 className="font-heading text-base font-semibold text-txt mb-2">⚙️ Horários Semanais</h3>
          <p className="text-sm text-txt-muted mb-4">
            Configure as janelas de atendimento por dia da semana. Sessões de 1 hora, horários de hora em hora.
          </p>

          {/* Group by day */}
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
            const daySlots = availability
              .map((s, idx) => ({ ...s, originalIdx: idx }))
              .filter((s) => s.dayOfWeek === dow);

            return (
              <div key={dow} className="mb-4 pb-4 border-b border-primary/5 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-txt">{DAY_NAMES[dow]}</h4>
                  <button
                    onClick={() => addSlot(dow)}
                    className="text-xs text-primary-dark font-bold hover:underline"
                  >
                    + Adicionar janela
                  </button>
                </div>
                {daySlots.length === 0 ? (
                  <p className="text-xs text-txt-muted ml-2">Sem horários configurados</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.originalIdx} className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={slot.active}
                            onChange={(e) => updateSlot(slot.originalIdx, "active", e.target.checked)}
                            className="rounded border-primary/30 text-primary-dark focus:ring-primary/20"
                          />
                          <span className={`text-xs ${slot.active ? "text-green-600 font-bold" : "text-txt-muted"}`}>
                            {slot.active ? "Ativo" : "Inativo"}
                          </span>
                        </label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.originalIdx, "startTime", e.target.value)}
                          disabled={!slot.active}
                          step="3600"
                          className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm disabled:opacity-50"
                        />
                        <span className="text-xs text-txt-muted">até</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.originalIdx, "endTime", e.target.value)}
                          disabled={!slot.active}
                          step="3600"
                          className="py-1.5 px-2 border border-primary/15 rounded-brand-sm text-sm disabled:opacity-50"
                        />
                        {slot.active && (
                          <span className="text-[0.65rem] text-txt-muted">
                            ({generateTimeSlots(slot.startTime, slot.endTime).length} horários)
                          </span>
                        )}
                        <button
                          onClick={() => removeSlot(slot.originalIdx)}
                          className="text-red-400 hover:text-red-600 text-xs font-bold"
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={saveAvailability}
            disabled={saving}
            className="btn-brand-primary text-sm mt-4 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "💾 Salvar Horários"}
          </button>
        </div>
      )}

      {/* Calendar + Detail Panel */}
      {!showAvailEditor && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-brand p-6 shadow-sm border border-primary/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">{MONTHS[month]} {year}</h3>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full border-[1.5px] border-primary bg-transparent text-primary-dark flex items-center justify-center hover:bg-primary hover:text-white transition-colors">&lsaquo;</button>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full border-[1.5px] border-primary bg-transparent text-primary-dark flex items-center justify-center hover:bg-primary hover:text-white transition-colors">&rsaquo;</button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 text-[0.65rem]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span> Disponível</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span> Parcialmente ocupado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300"></span> Bloqueado/Lotado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></span> Sem atendimento</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-bold text-txt-muted py-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const info = getDayInfo(d);
                const isSel = selectedDate === info.dateStr;
                const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                let bgColor = "bg-gray-50/50"; // No availability
                if (!info.isPast && info.hasAvail && !info.isBlocked) {
                  if (info.freeSlots === 0) bgColor = "bg-red-50";
                  else if (info.bookedCount > 0) bgColor = "bg-yellow-50";
                  else bgColor = "bg-green-50";
                }
                if (info.isBlocked) bgColor = "bg-red-100";

                return (
                  <div
                    key={d}
                    onClick={() => !info.isPast && setSelectedDate(info.dateStr)}
                    className={`min-h-[72px] p-1.5 rounded-brand-sm border transition-colors cursor-pointer
                      ${isSel ? "border-primary ring-2 ring-primary/20" : isToday ? "border-primary" : "border-primary/5"}
                      ${info.isPast ? "opacity-40 cursor-default" : "hover:border-primary/30"}
                      ${bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isToday ? "text-primary-dark" : "text-txt-light"}`}>{d}</span>
                      {info.isBlocked && <span className="text-[0.55rem]">🚫</span>}
                    </div>
                    {!info.isPast && info.hasAvail && !info.isBlocked && (
                      <div className="mt-1">
                        <span className={`text-[0.55rem] font-bold ${
                          info.freeSlots === 0 ? "text-red-500" : info.bookedCount > 0 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {info.freeSlots > 0 ? `${info.freeSlots} vago${info.freeSlots > 1 ? "s" : ""}` : "Lotado"}
                        </span>
                        {info.dayApts.length > 0 && (
                          <span className="block text-[0.5rem] text-txt-muted">{info.dayApts.length} sessão</span>
                        )}
                      </div>
                    )}
                    {!info.isPast && info.isBlocked && (
                      <span className="text-[0.55rem] text-red-500 font-medium">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1 bg-white rounded-brand p-6 shadow-sm border border-primary/5">
            {loading ? (
              <p className="text-sm text-txt-muted text-center py-8">Carregando…</p>
            ) : !selectedDate ? (
              <div className="text-center py-8">
                <span className="text-3xl">📅</span>
                <p className="text-sm text-txt-muted mt-3">Selecione um dia no calendário</p>
                <p className="text-xs text-txt-muted mt-1">para ver detalhes e gerenciar</p>
              </div>
            ) : selectedInfo && (
              <>
                <h3 className="font-heading text-base font-semibold text-txt mb-1">
                  {fmtDateBR(selectedDate)}
                </h3>
                <p className="text-xs text-txt-muted mb-4">{DAY_NAMES[selectedInfo.dow]}</p>

                {/* Block/Unblock Button */}
                <button
                  onClick={() => toggleBlockDate(selectedDate)}
                  disabled={saving}
                  className={`w-full mb-4 py-2.5 px-4 rounded-brand-sm text-sm font-bold transition-colors disabled:opacity-50 ${
                    selectedInfo.isBlocked
                      ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                      : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  }`}
                >
                  {selectedInfo.isBlocked ? "✅ Desbloquear Este Dia" : "🚫 Bloquear Este Dia"}
                </button>

                {selectedInfo.isBlocked && selectedInfo.blocked?.reason && (
                  <div className="bg-red-50 border border-red-200 rounded-brand-sm p-3 mb-4">
                    <p className="text-xs text-red-700">
                      <strong>Motivo:</strong> {selectedInfo.blocked.reason}
                    </p>
                  </div>
                )}

                {/* Availability for this day */}
                {!selectedInfo.isBlocked && (
                  <>
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-txt-muted mb-2">Horários configurados</h4>
                      {!selectedInfo.hasAvail ? (
                        <p className="text-xs text-txt-muted">Sem horários para {DAY_NAMES[selectedInfo.dow]}.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedInfo.uniqueTimes.map((t) => {
                            const isBooked = selectedInfo.bookedTimes.includes(t);
                            const bookedApt = isBooked
                              ? appointments.find((a) => a.date === selectedDate && a.startTime === t && a.status !== "cancelled")
                              : null;
                            return (
                              <button
                                key={t}
                                onClick={() => {
                                  if (isBooked && bookedApt) {
                                    // Show patient info
                                    flash(`📋 ${bookedApt.patientName || "Paciente"} — ${bookedApt.startTime}-${bookedApt.endTime}`);
                                  } else if (selectedDate) {
                                    // Open quick-book modal
                                    setQuickBookSlot({ date: selectedDate, startTime: t, endTime: getDefaultEndTime(t) });
                                  }
                                }}
                                className={`text-center py-1.5 rounded-brand-sm text-xs font-medium border transition-all ${
                                  isBooked
                                    ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 cursor-pointer"
                                    : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-400 hover:shadow-sm cursor-pointer"
                                }`}
                                title={isBooked ? `Ocupado: ${bookedApt?.patientName || "Paciente"}` : "Clique para agendar"}
                              >
                                <span>{t}</span>
                                <span className="block text-[0.55rem] opacity-70">
                                  {isBooked ? (bookedApt?.patientName?.split(" ")[0] || "Ocupado") : "Vago"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mb-4 rounded-brand-sm border border-primary/10 bg-primary/5 p-3">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-txt">Horários personalizados deste dia</h4>
                          <p className="text-[0.65rem] text-txt-muted">
                            Libere exceções fora da grade semanal ou já abra uma sessão manual.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!selectedDate) return;
                            setQuickBookSlot({ date: selectedDate, startTime: customStartTime, endTime: customEndTime });
                          }}
                          className="text-[0.65rem] px-2.5 py-1.5 rounded-brand-sm border border-primary/20 bg-white text-primary-dark font-bold hover:bg-primary/5"
                        >
                          + Sessão livre
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input
                          type="time"
                          step="900"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="py-2 px-3 border border-primary/15 rounded-brand-sm text-sm"
                        />
                        <input
                          type="time"
                          step="900"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          className="py-2 px-3 border border-primary/15 rounded-brand-sm text-sm"
                        />
                      </div>

                      <button
                        onClick={handleAddCustomAvailability}
                        disabled={saving}
                        className="w-full py-2 rounded-brand-sm bg-primary text-white text-xs font-bold disabled:opacity-50"
                      >
                        {saving ? "Salvando..." : "Liberar horário personalizado"}
                      </button>

                      {selectedInfo.customSlotsForDay.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {selectedInfo.customSlotsForDay.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between gap-2 rounded-brand-sm border border-primary/10 bg-white px-3 py-2">
                              <div>
                                <p className="text-xs font-semibold text-txt">{slot.startTime} - {slot.endTime}</p>
                                <p className="text-[0.65rem] text-txt-muted">Disponibilidade extra deste dia</p>
                              </div>
                              <button
                                onClick={() => handleRemoveCustomAvailability(slot.id)}
                                className="text-[0.65rem] font-bold text-red-500 hover:underline"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Appointments for this day */}
                    {selectedInfo.dayApts.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-txt-muted mb-2">
                          Sessões ({selectedInfo.dayApts.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedInfo.dayApts.map((a) => (
                            <div key={a.id} className="p-2.5 rounded-brand-sm border border-primary/10 bg-bg/30">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-txt">{a.patientName || "Paciente"}</span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.55rem] font-bold ${statusColor[a.status] || ""}`}>
                                  {statusLabel[a.status] || a.status}
                                </span>
                              </div>
                              <p className="text-[0.65rem] text-txt-muted mt-0.5">
                                {a.startTime} - {a.endTime}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-4 pt-4 border-t border-primary/10">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-txt-muted">Total de horários</span>
                        <span className="text-txt font-bold">{selectedInfo.uniqueTimes.length}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-txt-muted">Ocupados</span>
                        <span className="text-red-500 font-bold">{selectedInfo.bookedTimes.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-txt-muted">Vagos</span>
                        <span className="text-green-600 font-bold">
                          {selectedInfo.uniqueTimes.length - selectedInfo.bookedTimes.length}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Blocked Dates Overview */}
      {!showAvailEditor && blockedDates.length > 0 && (
        <div className="bg-white rounded-brand p-6 shadow-sm border border-primary/5 mt-6">
          <h3 className="font-heading text-base font-semibold text-txt mb-4">🚫 Datas Bloqueadas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {blockedDates.map((bd) => (
              <div key={bd.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-brand-sm">
                <div>
                  <p className="text-sm font-medium text-txt">{fmtDateBR(bd.date)}</p>
                  {bd.reason && <p className="text-xs text-red-600">{bd.reason}</p>}
                </div>
                <button
                  onClick={() => toggleBlockDate(bd.date)}
                  className="text-xs text-green-600 font-bold hover:underline"
                >
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-Book Modal */}
      {quickBookSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-brand p-8 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">Agendar Sessão Rápida</h3>
              <button onClick={() => setQuickBookSlot(null)} className="text-txt-muted hover:text-txt text-lg">✕</button>
            </div>
            <div className="bg-primary/5 rounded-brand-sm p-3 mb-4">
              <p className="text-sm font-medium text-txt">
                📅 {new Date(quickBookSlot.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </p>
              <p className="text-xs text-txt-muted">
                ⏰ {quickBookSlot.startTime} â€“ {quickBookSlot.endTime}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-txt mb-1.5">Início</label>
                  <input
                    type="time"
                    step="900"
                    value={quickBookSlot.startTime}
                    onChange={(e) => setQuickBookSlot((prev) => prev ? { ...prev, startTime: e.target.value } : prev)}
                    className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-txt mb-1.5">Fim</label>
                  <input
                    type="time"
                    step="900"
                    value={quickBookSlot.endTime}
                    onChange={(e) => setQuickBookSlot((prev) => prev ? { ...prev, endTime: e.target.value } : prev)}
                    className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-txt mb-1.5">Paciente *</label>
                <select
                  value={quickBookPatient}
                  onChange={(e) => setQuickBookPatient(e.target.value)}
                  className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">Selecione o paciente</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-txt mb-1.5">Modalidade</label>
                <div className="flex gap-2">
                  <div className="flex-1 py-2 rounded-brand-sm text-sm font-medium border text-center border-primary bg-primary text-white">
                    📹 Online (videochamada)
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-txt mb-1.5">Observações</label>
                <textarea
                  value={quickBookNotes}
                  onChange={(e) => setQuickBookNotes(e.target.value)}
                  rows={3}
                  placeholder="Resumo interno, combinado ou observação para a sessão..."
                  className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y"
                />
              </div>
              <p className="text-[0.65rem] text-txt-muted">
                Ao salvar, a sessão já nasce confirmada com cobrança vinculada e aparece no portal do paciente.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleQuickBook}
                  disabled={saving || !quickBookPatient}
                  className="btn-brand-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "Agendando…" : "Agendar"}
                </button>
                <button
                  onClick={() => setQuickBookSlot(null)}
                  className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



