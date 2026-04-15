"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { MONTHS, DAYS, statusColor, statusLabel, dotColor, pad } from "@/components/admin/agenda-types";
import type { Appointment, PatientOption } from "@/components/admin/agenda-types";
import { sendWhatsAppMessage } from "@/components/admin/agenda-messages";
import { PendingAppointments } from "@/components/admin/PendingAppointments";
import { NewSessionModal } from "@/components/admin/NewSessionModal";
import { AppointmentDetailModal } from "@/components/admin/AppointmentDetailModal";
import { buildWaitingRoomPath, getAppointmentTiming } from "@/components/admin/appointment-timing";

export default function AgendaPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Appointment | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(
          Array.isArray(data)
            ? data.map((a: Record<string, unknown>) => ({
                ...(a.appointment ?? a),
                patientName: a.patientName,
                patientPhone: a.patientPhone,
              }) as Appointment)
            : []
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
      void fetchAppointments();
      void fetchPatients();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAppointments, fetchPatients]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

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

  const fmtDate = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;
  const getApts = (d: number) => appointments.filter((a) => a.date === fmtDate(d));
  const selectedApts = selectedDate ? appointments.filter((a) => a.date === selectedDate) : [];
  const hotAppointments = appointments
    .filter((a) => a.status === "confirmed" || a.status === "pending")
    .map((a) => ({ apt: a, timing: getAppointmentTiming(a.date, a.startTime) }))
    .filter(({ timing }) => timing.sameDay && (timing.startingSoon || timing.inProgress || timing.waitingRoomOpen))
    .sort((a, b) => a.timing.start.getTime() - b.timing.start.getTime())
    .slice(0, 4);

  const handleStatus = async (apt: Appointment, s: string) => {
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (res.ok) {
        flash(`Status -> ${statusLabel[s] || s}`);
        const updated = await res.json();
        setShowDetail((prev) => prev ? { ...prev, status: s, ...(updated.meetingUrl ? { meetingUrl: updated.meetingUrl } : {}) } : null);
        fetchAppointments();
      }
      else flash("Erro ao atualizar status.");
    } catch { flash("Erro de conexão."); }
  };

  const handleDelete = async (apt: Appointment) => {
    if (!confirm(`Excluir sessão de ${apt.patientName}?\nIsso libera o horário para novo agendamento.`)) return;
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, { method: "DELETE" });
      if (res.ok) {
        flash("Sessão excluída com sucesso.");
        setShowDetail(null);
        fetchAppointments();
      } else flash("Erro ao excluir sessão.");
    } catch { flash("Erro de conexão."); }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: fd.get("patientId"),
          date: fd.get("date"),
          startTime: fd.get("startTime"),
          endTime: fd.get("endTime"),
          modality: fd.get("modality"),
          status: fd.get("status"),
          notes: fd.get("notes"),
        }),
      });
      if (res.ok) { flash("Sessão agendada!"); setShowModal(false); fetchAppointments(); }
      else { const b = await res.json().catch(() => ({})); flash((b as Record<string, string>).error || "Erro ao agendar."); }
    } catch { flash("Erro de conexão."); }
    setSaving(false);
  };

  const sendBulkReminders = (type: "confirm" | "presession") => {
    const toRemind = selectedApts.filter(
      (a) => (a.status === "confirmed" || a.status === "pending") && a.patientPhone
    );
    if (toRemind.length === 0) {
      flash("Nenhuma sessão com telefone para enviar.");
      return;
    }
    toRemind.forEach((apt, idx) => {
      setTimeout(() => {
        sendWhatsAppMessage(apt, type, flash);
      }, idx * 800);
    });
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
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold text-txt">Agenda</h1>
            {appointments.filter((a) => a.status === "pending").length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full text-xs font-bold animate-pulse">
                🔔 {appointments.filter((a) => a.status === "pending").length} pendente{appointments.filter((a) => a.status === "pending").length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-txt-light mt-1">Gerencie seus agendamentos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-brand-primary text-sm">+ Nova Sessão</button>
      </div>

      {hotAppointments.length > 0 && (
        <div className="mb-6 rounded-brand border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h2 className="font-heading text-base font-semibold text-amber-900">Consultas de hoje em destaque</h2>
          <p className="mt-1 text-sm text-amber-800">As próximas salas e links importantes ficam acessíveis aqui.</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {hotAppointments.map(({ apt, timing }) => (
              <div key={apt.id} className="rounded-brand-sm border border-amber-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-txt">{apt.patientName || "Paciente"}</p>
                    <p className="text-xs text-txt-muted">{formatDate(apt.date)} às {apt.startTime}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[0.65rem] font-bold ${timing.inProgress || timing.startingSoon ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {timing.relativeLabel}
                  </span>
                </div>
                <p className="mt-2 text-[0.7rem] font-bold text-primary-dark">{timing.waitingRoomLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`/admin/pacientes/${apt.patientId}`} className="text-[0.7rem] font-bold text-primary-dark hover:underline">
                    Abrir paciente
                  </a>
                  <a href={buildWaitingRoomPath(apt.id, "admin")} target="_blank" rel="noreferrer" className="text-[0.7rem] font-bold text-green-700 hover:underline">
                    Sala de espera
                  </a>
                  {apt.meetingUrl && (
                    <a href={apt.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] font-bold text-blue-700 hover:underline">
                      Videochamada
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-txt-muted py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dt = new Date(year, month, d);
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
              const dateStr = fmtDate(d);
              const dayApts = getApts(d);
              const isSel = selectedDate === dateStr;

              return (
                <div
                  key={d}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[80px] p-2 rounded-brand-sm border transition-colors cursor-pointer
                    ${isSel ? "border-primary bg-primary/10" : isToday ? "border-primary bg-primary/5" : "border-primary/5"}
                    ${isWeekend ? "bg-gray-50/50" : "hover:bg-bg/50"}`}
                >
                  <span className={`text-xs font-semibold ${isToday ? "text-primary-dark" : "text-txt-light"}`}>{d}</span>
                  {dayApts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayApts.slice(0, 3).map((a) => (
                        <span key={a.id} className={`w-2 h-2 rounded-full ${dotColor[a.status] || "bg-gray-300"}`} />
                      ))}
                      {dayApts.length > 3 && <span className="text-[0.6rem] text-txt-muted">+{dayApts.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day sidebar */}
        <div className="lg:col-span-1 bg-white rounded-brand p-6 shadow-sm border border-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base font-semibold text-txt">
              {selectedDate ? `📅 ${formatDate(selectedDate)}` : "📅 Selecione um dia"}
            </h3>
            {selectedDate && selectedApts.filter((a) => a.status === "confirmed" || a.status === "pending").length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={() => sendBulkReminders("confirm")}
                  className="text-[0.6rem] px-1.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-brand-sm font-bold hover:bg-green-100 transition-colors"
                  title="Enviar confirmação para todos do dia"
                >
                  ✅ Todos
                </button>
                <button
                  onClick={() => sendBulkReminders("presession")}
                  className="text-[0.6rem] px-1.5 py-1 bg-[#25D366] text-white rounded-brand-sm font-bold hover:bg-[#1da855] transition-colors"
                  title="Enviar lembrete pré-consulta com link da sala"
                >
                  📱 Lembrar
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-txt-muted text-center py-8">Carregando…</p>
          ) : !selectedDate ? (
            <p className="text-sm text-txt-muted text-center py-8">Clique em um dia do calendário para ver os agendamentos.</p>
          ) : selectedApts.length === 0 ? (
            <p className="text-sm text-txt-muted text-center py-8">Nenhum agendamento neste dia.</p>
          ) : (
            <div className="space-y-3">
              {selectedApts.map((a) => {
                const timing = getAppointmentTiming(a.date, a.startTime);

                return (
                  <div key={a.id} className="p-3 bg-bg/50 rounded-brand-sm border border-primary/5 hover:border-primary/20 transition-colors">
                    <div onClick={() => setShowDetail(a)} className="cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-txt">{a.patientName || "Paciente"}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${statusColor[a.status] || ""}`}>
                          {statusLabel[a.status] || a.status}
                        </span>
                      </div>
                      <p className="text-xs text-txt-muted">{a.startTime} - {a.endTime} | {a.modality}</p>
                      <p className="mt-1 text-[0.7rem] font-bold text-primary-dark">
                        {timing.relativeLabel} • {timing.waitingRoomLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-primary/5 flex-wrap">
                    {(a.status === "confirmed" || a.status === "pending") && a.patientPhone && (
                      <>
                        <button
                          onClick={() => sendWhatsAppMessage(a, "confirm", flash)}
                          className="text-[0.6rem] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-brand-sm font-bold hover:bg-green-100 transition-colors"
                          title="Enviar confirmação via WhatsApp"
                        >
                          ✅ Confirmar
                        </button>
                        <button
                          onClick={() => sendWhatsAppMessage(a, "presession", flash)}
                          className="text-[0.6rem] px-2 py-1 bg-[#25D366] text-white rounded-brand-sm font-bold hover:bg-[#1da855] transition-colors"
                          title="Enviar lembrete com link da sala de espera"
                        >
                          📱 Pré-consulta
                        </button>
                      </>
                    )}
                    {a.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatus(a, "confirmed")}
                          className="text-[0.6rem] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-brand-sm font-bold hover:bg-green-100 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleStatus(a, "cancelled")}
                          className="text-[0.6rem] px-2 py-1 bg-red-50 text-red-500 border border-red-200 rounded-brand-sm font-bold hover:bg-red-100 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {a.status === "confirmed" && (
                      <button
                        onClick={() => handleStatus(a, "completed")}
                        className="text-[0.6rem] px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-brand-sm font-bold hover:bg-blue-100 transition-colors"
                      >
                        Concluída
                      </button>
                    )}
                    <button
                      onClick={() => setShowDetail(a)}
                      className="text-[0.6rem] px-2 py-1 text-txt-muted border border-primary/10 rounded-brand-sm hover:bg-bg transition-colors ml-auto"
                    >
                      Detalhes
                    </button>
                    <a
                      href={buildWaitingRoomPath(a.id, "admin")}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.6rem] px-2 py-1 border border-green-200 bg-green-50 text-green-700 rounded-brand-sm font-bold hover:bg-green-100 transition-colors"
                    >
                      Sala
                    </a>
                    {a.meetingUrl && (
                      <a
                        href={a.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.6rem] px-2 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-brand-sm font-bold hover:bg-blue-100 transition-colors"
                      >
                        Video
                      </a>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PendingAppointments
        appointments={appointments}
        onStatus={handleStatus}
        onDetail={setShowDetail}
        flash={flash}
      />

      {showModal && (
        <NewSessionModal
          patients={patients}
          selectedDate={selectedDate}
          saving={saving}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {showDetail && (
        <AppointmentDetailModal
          apt={showDetail}
          onClose={() => setShowDetail(null)}
          onStatus={handleStatus}
          onDelete={handleDelete}
          onUpdate={fetchAppointments}
          flash={flash}
        />
      )}
    </div>
  );
}
