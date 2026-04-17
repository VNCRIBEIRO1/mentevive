"use client";
import type { Appointment } from "./agenda-types";
import { statusColor, statusLabel, pad } from "./agenda-types";
import { sendWhatsAppMessage } from "./agenda-messages";

interface Props {
  appointments: Appointment[];
  onStatus: (apt: Appointment, status: string) => void;
  onDetail: (apt: Appointment) => void;
  flash: (msg: string) => void;
}

export function PendingAppointments({ appointments, onStatus, onDetail, flash }: Props) {
  const now = new Date();
  const pendingApts = appointments
    .filter((a) => a.status === "pending")
    .sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      return dateComp !== 0 ? dateComp : a.startTime.localeCompare(b.startTime);
    });

  if (pendingApts.length === 0) return null;

  return (
    <div className="mt-6 bg-card rounded-brand p-6 shadow-sm border border-yellow-200">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">
            {pendingApts.length}
          </span>
          <h3 className="font-heading text-lg font-semibold text-txt">
            Solicitações Pendentes
          </h3>
        </div>
        <p className="text-xs text-txt-muted">
          Agendamentos aguardando sua confirmação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pendingApts.map((apt) => {
          const dateBR = new Date(apt.date + "T00:00:00").toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          });
          const isToday = apt.date === `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
          const aptDate = new Date(apt.date + "T00:00:00");
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = aptDate.toDateString() === tomorrow.toDateString();

          return (
            <div
              key={apt.id}
              className={`relative p-4 rounded-brand-sm border-l-4 bg-gradient-to-r transition-shadow hover:shadow-md ${
                isToday
                  ? "border-l-red-400 from-red-50 to-card"
                  : isTomorrow
                    ? "border-l-orange-400 from-orange-50 to-card"
                    : "border-l-yellow-400 from-yellow-50 to-card"
              }`}
            >
              {isToday && (
                <span className="absolute top-2 right-2 text-[0.6rem] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold animate-pulse">
                  HOJE
                </span>
              )}
              {isTomorrow && !isToday && (
                <span className="absolute top-2 right-2 text-[0.6rem] px-2 py-0.5 bg-orange-500 text-white rounded-full font-bold">
                  AMANHÃ
                </span>
              )}

              <div className="mb-3">
                <p className="text-sm font-bold text-txt truncate pr-16">
                  {apt.patientName || "Paciente sem nome"}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-txt-muted">
                  <span>📅 {dateBR}</span>
                  <span>⏰ {apt.startTime} - {apt.endTime}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-txt-muted">
                  <span>💻 Online</span>
                  {apt.patientPhone && <span>📱 {apt.patientPhone}</span>}
                </div>
                {apt.notes && (
                  <p className="text-xs text-txt-muted mt-1.5 italic line-clamp-2">
                    💬 {apt.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-primary/5">
                <button
                  onClick={() => onStatus(apt, "confirmed")}
                  className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-brand-sm font-bold hover:bg-green-600 transition-colors"
                >
                  ✅ Confirmar
                </button>
                <button
                  onClick={() => onStatus(apt, "cancelled")}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-brand-sm font-bold hover:bg-red-100 transition-colors"
                >
                  ✕ Recusar
                </button>
                {apt.patientPhone && (
                  <button
                    onClick={() => sendWhatsAppMessage(apt, "confirm", flash)}
                    className="text-xs px-2.5 py-1.5 bg-[#25D366] text-white rounded-brand-sm font-bold hover:bg-[#1da855] transition-colors"
                    title="Enviar confirmação via WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </button>
                )}
                <button
                  onClick={() => onDetail(apt)}
                  className="text-xs px-2.5 py-1.5 text-txt-muted border border-primary/10 rounded-brand-sm hover:bg-bg transition-colors ml-auto"
                >
                  Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
