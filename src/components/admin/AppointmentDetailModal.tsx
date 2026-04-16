"use client";
import type { Appointment } from "./agenda-types";
import { statusLabel, statusColor, inputCls } from "./agenda-types";
import { sendWhatsAppMessage } from "./agenda-messages";
import { formatDate, buildWhatsAppUrl } from "@/lib/utils";
import { buildWaitingRoomPath, getAppointmentTiming } from "./appointment-timing";

interface Props {
  apt: Appointment;
  onClose: () => void;
  onStatus: (apt: Appointment, status: string) => void;
  onDelete: (apt: Appointment) => void;
  onUpdate: () => void;
  flash: (msg: string) => void;
}

export function AppointmentDetailModal({ apt, onClose, onStatus, onDelete, onUpdate, flash }: Props) {
  const btnCls = (color: string) =>
    `text-xs px-3 py-1.5 border rounded-brand-sm font-bold transition-colors ${color}`;
  const waitingRoomPath = buildWaitingRoomPath(apt.id, "admin");
  const waitingRoomUrl = typeof window !== "undefined" ? `${window.location.origin}${waitingRoomPath}` : waitingRoomPath;
  const timing = getAppointmentTiming(apt.date, apt.startTime);

  const statusActions = () => {
    const btns: React.ReactNode[] = [];
    if (apt.status === "pending") {
      btns.push(
        <button key="confirm" onClick={() => onStatus(apt, "confirmed")}
          className={btnCls("border-green-200 text-green-700 bg-green-50 hover:bg-green-100")}>
          Confirmar
        </button>,
        <button key="cancel" onClick={() => onStatus(apt, "cancelled")}
          className={btnCls("border-red-200 text-red-500 hover:bg-red-50")}>
          Cancelar
        </button>,
      );
    }
    if (apt.status === "confirmed") {
      btns.push(
        <button key="complete" onClick={() => onStatus(apt, "completed")}
          className={btnCls("border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100")}>
          Realizada
        </button>,
        <button key="noshow" onClick={() => onStatus(apt, "no_show")}
          className={btnCls("border-gray-200 text-gray-500 hover:bg-gray-100")}>
          Não Compareceu
        </button>,
        <button key="cancel2" onClick={() => onStatus(apt, "cancelled")}
          className={btnCls("border-red-200 text-red-500 hover:bg-red-50")}>
          Cancelar
        </button>,
      );
    }
    if (apt.status === "cancelled" || apt.status === "no_show") {
      btns.push(
        <button key="reopen" onClick={() => onStatus(apt, "pending")}
          className={btnCls("border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100")}>
          Reabrir
        </button>,
        <button key="delete" onClick={() => onDelete(apt)}
          className={btnCls("border-red-200 text-red-500 hover:bg-red-50")}>
          🗑️ Excluir
        </button>,
      );
    }
    if (apt.status === "completed") {
      btns.push(
        <button key="reopen2" onClick={() => onStatus(apt, "pending")}
          className={btnCls("border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100")}>
          Reabrir
        </button>,
        <button key="delete2" onClick={() => onDelete(apt)}
          className={btnCls("border-red-200 text-red-500 hover:bg-red-50")}>
          🗑️ Excluir
        </button>,
      );
    }
    return btns;
  };

  const handleSave = async () => {
    const date = (document.getElementById("edit-date") as HTMLInputElement).value;
    const startTime = (document.getElementById("edit-startTime") as HTMLInputElement).value;
    const endTime = (document.getElementById("edit-endTime") as HTMLInputElement).value;
    const notesVal = (document.getElementById("edit-notes") as HTMLTextAreaElement).value;
    const feedbackEl = document.getElementById("edit-therapistFeedback") as HTMLTextAreaElement | null;
    const therapistFeedbackVal = feedbackEl?.value ?? null;
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime, notes: notesVal, therapistFeedback: therapistFeedbackVal }),
      });
      if (res.ok) { flash("Sessão atualizada!"); onClose(); onUpdate(); }
      else {
        const b = await res.json().catch(() => ({}));
        flash((b as Record<string, string>).error || "Erro ao atualizar sessão.");
      }
    } catch { flash("Erro de conexão."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-brand p-8 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg font-semibold text-txt">Detalhes da Sessão</h3>
          <button onClick={onClose} className="text-txt-muted hover:text-txt text-lg">X</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-1.5 border-b border-primary/5">
            <span className="text-txt-muted">Paciente</span>
            <span className="text-txt font-medium">{apt.patientName || "--"}</span>
          </div>
          {apt.patientPhone && (
            <div className="flex justify-between py-1.5 border-b border-primary/5">
              <span className="text-txt-muted">Telefone</span>
              <span className="text-txt">{apt.patientPhone}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-primary/5">
            <span className="text-txt-muted">Data</span>
            <span className="text-txt">{formatDate(apt.date)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-primary/5">
            <span className="text-txt-muted">Horário</span>
            <span className="text-txt">{apt.startTime} - {apt.endTime}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-primary/5">
            <span className="text-txt-muted">Modalidade</span>
            <span className="text-txt">Online (videochamada)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-primary/5">
            <span className="text-txt-muted">Status</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${statusColor[apt.status] || ""}`}>
              {statusLabel[apt.status] || apt.status}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-primary/5">
            <span className="text-txt-muted">Janela de acesso</span>
            <span className="text-right text-xs font-bold text-primary-dark">{timing.relativeLabel}</span>
          </div>
          {apt.notes && (
            <div className="py-1.5">
              <span className="text-txt-muted text-xs">Notas:</span>
              <p className="text-txt mt-1">{apt.notes}</p>
            </div>
          )}
          {apt.patientNotes && (
            <div className="py-1.5 bg-blue-50 border border-blue-100 rounded-brand-sm p-3 mt-2">
              <span className="text-blue-600 text-xs font-bold">📝 Anotação do paciente:</span>
              <p className="text-txt mt-1 text-sm">{apt.patientNotes}</p>
            </div>
          )}
          {apt.therapistFeedback && (
            <div className="py-1.5 bg-purple-50 border border-purple-100 rounded-brand-sm p-3 mt-2">
              <span className="text-purple-600 text-xs font-bold">💬 Feedback da terapeuta:</span>
              <p className="text-txt mt-1 text-sm">{apt.therapistFeedback}</p>
            </div>
          )}
        </div>

        {apt.patientPhone && (apt.status === "confirmed" || apt.status === "pending") && (
          <div className="mt-4 pt-4 border-t border-primary/10 space-y-2">
            <p className="text-xs font-bold text-txt-muted mb-2">Enviar via WhatsApp</p>
            <button
              onClick={() => sendWhatsAppMessage(apt, "confirm", flash)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 text-sm font-bold rounded-brand-sm hover:bg-green-100 transition-colors"
            >
              ✅ Enviar Confirmação da Consulta
            </button>
            <button
              onClick={() => sendWhatsAppMessage(apt, "presession", flash)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-bold rounded-brand-sm hover:bg-[#1da855] transition-colors"
            >
              📱 Enviar Lembrete Pré-consulta + Link da Sala
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-primary/10">
            <h4 className="text-xs font-bold text-txt-muted mb-3">📹 Videochamada e sala de espera</h4>
            <div className="mb-3 rounded-brand-sm border border-primary/10 bg-bg/60 p-3">
              <p className="text-xs font-bold text-txt">Sala do paciente</p>
              <p className="mt-1 text-[0.7rem] text-txt-muted">{timing.waitingRoomLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={waitingRoomPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-green-700 hover:underline"
                >
                  Abrir sala de espera
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(waitingRoomUrl);
                    flash("Link da sala copiado!");
                  }}
                  className="text-xs font-bold text-primary-dark hover:underline"
                >
                  Copiar link da sala
                </button>
              </div>
            </div>
            {apt.meetingUrl ? (
              <div className="bg-green-50 border border-green-200 rounded-brand-sm p-3">
                <a
                  href={apt.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-brand-sm hover:bg-primary-dark transition-colors mb-2"
                >
                  📹 Entrar na Sessão
                </a>
                <p className="text-xs text-green-800 font-mono break-all mb-2">{apt.meetingUrl}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apt.meetingUrl!);
                      flash("Link copiado!");
                    }}
                    className="text-xs text-green-700 font-bold hover:underline"
                  >
                    Copiar link
                  </button>
                  {apt.patientPhone && (
                    <button
                      onClick={() => {
                        const msg = `Link da sua sessão\n\nOlá, ${apt.patientName}! Aqui está o link da sua videochamada:\n\n${apt.meetingUrl}\n\nTe espero! 🌿`;
                        const url = buildWhatsAppUrl(apt.patientPhone!, msg);
                        window.open(url, "_blank");
                      }}
                      className="text-xs text-[#25D366] font-bold hover:underline"
                    >
                      Enviar via WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-brand-sm p-3">
                <p className="text-xs text-blue-700 mb-1">📋 O link será gerado automaticamente ao confirmar a sessão.</p>
                <p className="text-xs text-blue-500">Você e o paciente entrarão na mesma sala.</p>
              </div>
            )}
          </div>

        <div className="mt-6 pt-4 border-t border-primary/10">
          <h4 className="text-xs font-bold text-txt-muted mb-3">Editar Sessão</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Data</label>
                <input type="date" defaultValue={apt.date} id="edit-date" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Inicio</label>
                <input type="time" step="60" defaultValue={apt.startTime} id="edit-startTime" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Fim</label>
                <input type="time" step="60" defaultValue={apt.endTime} id="edit-endTime" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Notas</label>
              <textarea defaultValue={apt.notes || ""} id="edit-notes" rows={2} className={inputCls} />
            </div>
            {(apt.status === "completed" || apt.status === "no_show") && (
              <div>
                <label className="block text-xs font-bold mb-1">💬 Feedback pós-sessão (visível ao paciente)</label>
                <textarea defaultValue={apt.therapistFeedback || ""} id="edit-therapistFeedback" rows={3} className={inputCls} placeholder="Ex: Boa sessão! Praticar a técnica de respiração esta semana..." />
              </div>
            )}
            <button onClick={handleSave} className="btn-brand-primary text-xs w-full">
              Salvar Alterações
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-primary/10">
          {statusActions()}
          <button onClick={onClose} className="text-xs px-3 py-1.5 border border-primary/15 text-txt-muted rounded-brand-sm hover:bg-bg transition-colors ml-auto">Fechar</button>
        </div>
      </div>
    </div>
  );
}
