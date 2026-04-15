"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarPlus } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: string;
  status: string;
  notes: string | null;
  patientNotes: string | null;
  therapistFeedback: string | null;
  meetingUrl: string | null;
};

const statusLabel: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmada", cancelled: "Cancelada",
  completed: "Realizada", no_show: "Não compareceu",
};
const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600", confirmed: "bg-green-100 text-green-600",
  cancelled: "bg-red-100 text-red-500", completed: "bg-blue-100 text-blue-600",
  no_show: "bg-gray-100 text-gray-500",
};

export default function PortalSessoesPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [now, setNow] = useState(() => Date.now());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta sessao?\n\nCancelamentos online ficam disponiveis ate 24h antes.\nSe houver pagamento confirmado, o sistema tentara cancelar ou solicitar o estorno automaticamente conforme o meio de pagamento.")) return;
    setCancellingId(appointmentId);
    try {
      const res = await fetch(`/api/portal/appointments/${appointmentId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAppointments((prev) => prev.map((a) => a.id === appointmentId ? { ...a, status: "cancelled" } : a));
        flash(data.message || "Sessao cancelada.");
      } else {
        flash(data.error || "Erro ao cancelar.");
      }
    } catch {
      flash("Erro de conexao.");
    } finally {
      setCancellingId(null);
    }
  };

  const savePatientNote = async (appointmentId: string) => {
    setSavingNote(appointmentId);
    try {
      const res = await fetch(`/api/portal/appointments/${appointmentId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientNotes: editingNotes[appointmentId] || "" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments((prev) =>
          prev.map((a) => a.id === appointmentId ? { ...a, patientNotes: updated.patientNotes } : a)
        );
        flash("✅ Anotação salva!");
      } else {
        flash("❌ Erro ao salvar anotação.");
      }
    } catch {
      flash("Erro de conexao.");
    } finally {
      setSavingNote(null);
    }
  };

  // Tick every 30s only when tab visible so the "Entrar na Sessão" button becomes reactive
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => { interval = setInterval(() => setNow(Date.now()), 30_000); };
    const handleVis = () => {
      if (document.hidden) { if (interval) { clearInterval(interval); interval = null; } }
      else { setNow(Date.now()); start(); }
    };
    start();
    document.addEventListener("visibilitychange", handleVis);
    return () => { if (interval) clearInterval(interval); document.removeEventListener("visibilitychange", handleVis); };
  }, []);

  useEffect(() => {
    fetch("/api/portal/appointments")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data)
          ? data.map((a: Record<string, unknown>) => (a.appointment ?? a) as Appointment)
          : [];
        setAppointments(list);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const isUpcoming = (a: Appointment) => {
    const sessionDate = new Date(`${a.date}T${a.startTime}`);
    return sessionDate > new Date() && (a.status === "pending" || a.status === "confirmed");
  };

  return (
    <div>
      {toast && (
        <div role="status" aria-live="polite" className="fixed top-4 right-4 z-50 bg-white border border-primary/20 text-txt text-sm px-5 py-3 rounded-brand-sm shadow-lg">
          {toast}
        </div>
      )}

      <PortalPageHeader
        icon={<CalendarCheck className="w-6 h-6" />}
        title="Minhas Sessões"
        subtitle="Histórico e próximas sessões agendadas"
        gradient="teal"
        action={
          <Link href="/portal/agendar" className="btn-brand-primary text-sm inline-flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" /> Agendar Nova Sessão
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "pending", label: "Pendentes" },
          { key: "confirmed", label: "Confirmadas" },
          { key: "completed", label: "Realizadas" },
          { key: "cancelled", label: "Canceladas" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === f.key
                ? "bg-primary text-white"
                : "bg-white border border-primary/15 text-txt-light hover:border-primary/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Upcoming Sessions Cards */}
      {filtered.filter(isUpcoming).length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading text-sm font-semibold text-txt mb-3">🔜 Próximas Sessões</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.filter(isUpcoming).map((a) => (
              <div key={`card-${a.id}`} className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-brand p-5 border border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-txt">📅 {fmtDate(a.date)} às {a.startTime}</p>
                    <p className="text-xs text-txt-muted mt-0.5">📹 Online • 1 hora</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold ${statusColor[a.status] || ""}`}>
                    {statusLabel[a.status] || a.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/portal/sala-espera/${a.id}`}
                    className="px-3 py-1.5 rounded-brand-sm text-xs font-bold bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
                  >
                    🏠 Sala de Espera
                  </Link>
                  <button
                    onClick={() => handleCancel(a.id)}
                    disabled={cancellingId === a.id}
                    className="px-3 py-1.5 rounded-brand-sm text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {cancellingId === a.id ? "Cancelando…" : "✕ Cancelar"}
                  </button>
                  {a.modality === "online" && a.meetingUrl && a.status === "confirmed" && (() => {
                    const sessionDate = new Date(`${a.date}T${a.startTime}`);
                    const diff = Math.floor((sessionDate.getTime() - now) / 1000);
                    return diff <= 600; // 10 min before
                  })() && (
                    <a
                      href={a.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-brand-sm text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors animate-pulse"
                    >
                      📹 Entrar na Sessão
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="bg-white rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Data</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Horário</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Modalidade</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-txt-muted">Carregando…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-txt-muted">
                    {filter === "all"
                      ? "Nenhuma sessão encontrada. Agende sua primeira sessão!"
                      : "Nenhuma sessão com este status."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-txt">{fmtDate(a.date)}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{a.startTime} – {a.endTime}</td>
                    <td className="px-6 py-4 text-sm text-txt-light capitalize">📹 Online</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold ${statusColor[a.status] || ""}`}>
                        {statusLabel[a.status] || a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {isUpcoming(a) && (
                          <>
                            <Link href={`/portal/sala-espera/${a.id}`}
                              className="text-xs text-green-600 font-bold hover:underline">Sala de Espera</Link>
                            <button onClick={() => handleCancel(a.id)} disabled={cancellingId === a.id}
                              className="text-xs text-red-500 font-bold hover:underline disabled:opacity-50">
                              {cancellingId === a.id ? "…" : "Cancelar"}
                            </button>
                          </>
                        )}
                        {!isUpcoming(a) && a.status === "completed" && (
                          <span className="text-xs text-blue-600 font-bold">✅ Realizada</span>
                        )}
                        {!isUpcoming(a) && a.status === "cancelled" && (
                          <span className="text-xs text-red-400">Cancelada</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Sessions — Patient Notes */}
      {filtered.filter((a) => a.status === "completed").length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading text-sm font-semibold text-txt mb-3">📝 Anotações Pós-Sessão</h3>
          <p className="text-xs text-txt-muted mb-4">
            Registre reflexões, insights ou observações após cada sessão finalizada.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered
              .filter((a) => a.status === "completed")
              .map((a) => (
                <div
                  key={`note-${a.id}`}
                  className="bg-white rounded-brand p-5 border border-blue-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-txt">
                        📅 {fmtDate(a.date)} às {a.startTime}
                      </p>
                      <p className="text-xs text-txt-muted mt-0.5">
                        📹 Online •{" "}
                        <span className="text-blue-600 font-bold">Realizada</span>
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Como você se sentiu após a sessão? Algum insight ou reflexão…"
                    value={
                      editingNotes[a.id] !== undefined
                        ? editingNotes[a.id]
                        : a.patientNotes || ""
                    }
                    onChange={(e) =>
                      setEditingNotes((prev) => ({
                        ...prev,
                        [a.id]: e.target.value,
                      }))
                    }
                    className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-bg text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => savePatientNote(a.id)}
                      disabled={savingNote === a.id}
                      className="px-4 py-1.5 rounded-brand-sm text-xs font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {savingNote === a.id ? "Salvando…" : "💾 Salvar Anotação"}
                    </button>
                  </div>
                  {a.patientNotes && editingNotes[a.id] === undefined && (
                    <p className="text-xs text-green-600 mt-1">✅ Anotação salva</p>
                  )}
                  {a.therapistFeedback && (
                    <div className="mt-3 bg-purple-50 border border-purple-100 rounded-brand-sm p-3">
                      <span className="text-purple-600 text-xs font-bold">💬 Feedback da Bea:</span>
                      <p className="text-sm text-txt mt-1">{a.therapistFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


