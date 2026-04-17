"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { buildWaitingRoomPath, getAppointmentTiming } from "@/components/admin/appointment-timing";
import {
  Users, CalendarDays, DollarSign, ClipboardList,
  UserX, XCircle, BarChart3, TrendingUp, Calendar,
  Clock, ArrowRight, Video, ExternalLink,
} from "lucide-react";

const MONTH_LABELS: Record<string, string> = { "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
function formatMonth(ym: string) {
  const [, m] = ym.split("-");
  return MONTH_LABELS[m] ?? m;
}

function MiniBarChart({ title, icon: Icon, data, color, isCurrency }: { title: string; icon: React.ElementType; data: Array<{ label: string; value: number }>; color: string; isCurrency?: boolean }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-card rounded-brand p-6 shadow-warm-sm border border-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4.5 h-4.5 text-primary-dark" />
        <h3 className="font-heading text-base font-semibold text-txt">{title}</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-txt-muted text-center py-8">Sem dados</p>
      ) : (
        <div className="flex items-end gap-2 h-32">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[0.65rem] font-bold text-txt-muted">{isCurrency ? formatCurrency(d.value) : d.value}</span>
              <div className={`w-full rounded-t ${color} transition-all`} style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }} />
              <span className="text-[0.6rem] text-txt-muted">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type DashboardData = {
  stats: { activePatients: number; monthSessions: number; monthRevenue: string; noShowRate: number; cancelledThisMonth: number };
  upcoming: Array<{ appointment: { id: string; patientId: string; date: string; startTime: string; modality: string; status: string; meetingUrl: string | null }; patientName: string }>;
  pendingPayments: Array<{ payment: { id: string; amount: string; dueDate: string | null }; patientName: string }>;
  charts: { sessionsPerMonth: Array<{ month: string; total: number }>; revenuePerMonth: Array<{ month: string; total: string | null }> };
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: Users, label: "Pacientes Ativos", value: data?.stats.activePatients ?? 0, color: "bg-blue-50 text-blue-600" },
    { icon: CalendarDays, label: "Sessões este mês", value: data?.stats.monthSessions ?? 0, color: "bg-green-50 text-green-600" },
    { icon: DollarSign, label: "Receita do mês", value: formatCurrency(Number(data?.stats.monthRevenue ?? 0)), color: "bg-yellow-50 text-yellow-600" },
    { icon: ClipboardList, label: "Próximas sessões", value: data?.upcoming.length ?? 0, color: "bg-purple-50 text-purple-600" },
    { icon: UserX, label: "No-show rate", value: `${data?.stats.noShowRate ?? 0}%`, color: "bg-red-50 text-red-600" },
    { icon: XCircle, label: "Canceladas (mês)", value: data?.stats.cancelledThisMonth ?? 0, color: "bg-orange-50 text-orange-600" },
  ];
  const nextSession = data?.upcoming?.[0] ?? null;
  const nextTiming = nextSession
    ? getAppointmentTiming(nextSession.appointment.date, nextSession.appointment.startTime)
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-txt">Dashboard</h1>
        <p className="text-sm text-txt-light mt-1">Visão geral da sua prática clínica</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card rounded-brand p-6 shadow-warm-sm border border-primary/5 hover:shadow-warm-md transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-txt-muted font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-txt mt-1">{loading ? "..." : s.value}</p>
            </div>
          );
        })}
      </div>

      {nextSession && nextTiming && (
        <div className="mb-8 rounded-brand border border-primary/10 bg-gradient-to-r from-primary/10 via-card to-accent/10 p-6 shadow-warm-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-dark">Sessao do dia</p>
              <h2 className="mt-2 font-heading text-xl font-bold text-txt">{nextSession.patientName}</h2>
              <p className="mt-1 text-sm text-txt-light">
                {nextSession.appointment.date} as {nextSession.appointment.startTime} • Online
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className={`rounded-full px-3 py-1 ${nextTiming.startingSoon || nextTiming.inProgress ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {nextTiming.relativeLabel}
                </span>
                <span className={`rounded-full px-3 py-1 ${nextTiming.waitingRoomOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                  {nextTiming.waitingRoomLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/pacientes/${nextSession.appointment.patientId}`} className="rounded-brand-sm border border-primary/15 px-4 py-2 text-sm font-bold text-txt hover:bg-card">
                Ver paciente
              </Link>
              <Link href="/admin/agenda" className="rounded-brand-sm border border-primary/15 px-4 py-2 text-sm font-bold text-txt hover:bg-card">
                Abrir agenda
              </Link>
              <Link href={buildWaitingRoomPath(nextSession.appointment.id, "admin")} target="_blank" className="rounded-brand-sm border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100">
                Abrir sala de espera
              </Link>
              {nextSession.appointment.meetingUrl && (
                <a href={nextSession.appointment.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-brand-primary text-sm">
                  Entrar na videochamada
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mini Charts — Sessions & Revenue last 6 months */}
      {data?.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <MiniBarChart title="Sessões por mês" icon={BarChart3} data={data.charts.sessionsPerMonth.map(r => ({ label: formatMonth(r.month), value: r.total }))} color="bg-primary" />
          <MiniBarChart title="Receita por mês" icon={TrendingUp} data={data.charts.revenuePerMonth.map(r => ({ label: formatMonth(r.month), value: Number(r.total ?? 0) }))} color="bg-accent" isCurrency />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="bg-card rounded-brand p-6 shadow-warm-sm border border-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4.5 h-4.5 text-primary-dark" />
            <h3 className="font-heading text-base font-semibold text-txt">Próximas Sessões</h3>
          </div>
          {!data?.upcoming.length ? (
            <p className="text-sm text-txt-muted text-center py-8">Nenhuma sessão agendada</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming.map((u) => {
                const timing = getAppointmentTiming(u.appointment.date, u.appointment.startTime);

                return (
                  <div key={u.appointment.id} className="border-b border-primary/5 py-3 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-txt">{u.patientName}</p>
                        <p className="text-xs text-txt-muted">{u.appointment.date} às {u.appointment.startTime}</p>
                        <p className="mt-1 text-[0.7rem] font-bold text-primary-dark">{timing.relativeLabel}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark font-bold">
                        Online
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={`/admin/pacientes/${u.appointment.patientId}`} className="text-[0.7rem] font-bold text-primary-dark hover:underline">
                        Paciente
                      </Link>
                      <Link href={buildWaitingRoomPath(u.appointment.id, "admin")} target="_blank" className="text-[0.7rem] font-bold text-green-700 hover:underline">
                        Sala de espera
                      </Link>
                      {u.appointment.meetingUrl && (
                        <a href={u.appointment.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] font-bold text-blue-700 hover:underline">
                          Videochamada
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-brand p-6 shadow-warm-sm border border-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4.5 h-4.5 text-yellow-600" />
            <h3 className="font-heading text-base font-semibold text-txt">Pagamentos Pendentes</h3>
          </div>
          {!data?.pendingPayments.length ? (
            <p className="text-sm text-txt-muted text-center py-8">Nenhum pagamento pendente</p>
          ) : (
            <div className="space-y-3">
              {data.pendingPayments.map((p) => (
                <div key={p.payment.id} className="flex items-center justify-between py-2 border-b border-primary/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-txt">{p.patientName}</p>
                    <p className="text-xs text-txt-muted">Venc.: {p.payment.dueDate || "—"}</p>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">{formatCurrency(Number(p.payment.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
