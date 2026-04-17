"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/utils";
import { PortalHeroBanner } from "@/components/portal/PortalHeroBanner";
import { PortalStatCard, QuickAction } from "@/components/portal/PortalCards";
import {
  CalendarCheck, CheckCircle, CalendarClock, Wallet,
  CalendarPlus, Leaf, ClipboardList, CreditCard, FileText, MessageCircle,
  Video, Clock, ChevronRight,
} from "lucide-react";

type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: string;
  status: string;
};

type PaymentRow = {
  payment: { id: string; amount: string; status: string };
};

type PortalDocument = {
  id: string;
  title: string;
  type: string;
  content: string | null;
  createdAt: string;
};

const statusLabel: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmada", cancelled: "Cancelada",
  completed: "Realizada", no_show: "Não compareceu",
};
const statusColor: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
  cancelled: "bg-red-50 text-red-400 ring-1 ring-red-200",
  completed: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  no_show: "bg-gray-50 text-gray-400 ring-1 ring-gray-200",
};

export default function PortalPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Paciente";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/appointments").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/portal/payments").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/portal/documents").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([apts, pays, docs]) => {
        const aptList = Array.isArray(apts)
          ? apts.map((a: Record<string, unknown>) => (a.appointment ?? a) as Appointment)
          : [];
        setAppointments(aptList);
        setPayments(Array.isArray(pays) ? pays : []);
        setDocuments(Array.isArray(docs) ? docs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .sort((a, b) => a.date.localeCompare(b.date));
  const completed = appointments.filter((a) => a.status === "completed");
  const pendingPay = payments.filter((p) => p.payment.status === "pending" || p.payment.status === "overdue");
  const totalPending = pendingPay.reduce((s, p) => s + Number(p.payment.amount), 0);
  const recentNotes = documents.filter((doc) => doc.type === "session_note").slice(0, 3);

  const nextSession = upcoming[0];

  const fmtDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  // Greeting based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero banner */}
      <PortalHeroBanner
        greeting={`${timeGreeting}, ${firstName} 🌿`}
        subtitle="Seu espaço seguro. Acompanhe sessões, evolução e tudo sobre seu processo terapêutico."
        highlight={
          nextSession ? (
            <div className="text-center">
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-teal-dark/70 mb-1">Próxima Sessão</p>
              <p className="text-lg font-bold text-txt">{fmtDate(nextSession.date)}</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-txt-muted" />
                <span className="text-xs text-txt-light">{nextSession.startTime}</span>
                <span className="text-txt-muted">·</span>
                <Video className="w-3 h-3 text-teal" /><span className="text-xs text-teal-dark">Online</span>
              </div>
            </div>
          ) : undefined
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <PortalStatCard
          icon={<CalendarCheck className="w-5 h-5" />}
          label="Próximas"
          value={loading ? "…" : upcoming.length}
          subtitle="sessões agendadas"
          color="green"
          delay={0.1}
        />
        <PortalStatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Realizadas"
          value={loading ? "…" : completed.length}
          subtitle="sessões completas"
          color="teal"
          delay={0.15}
        />
        <PortalStatCard
          icon={<CalendarClock className="w-5 h-5" />}
          label="Próxima"
          value={nextSession ? fmtDate(nextSession.date) : "—"}
          subtitle={nextSession ? `${nextSession.startTime}` : "nenhuma agendada"}
          color="primary"
          delay={0.2}
        />
        <PortalStatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Pendente"
          value={loading ? "…" : `R$ ${totalPending.toFixed(2).replace(".", ",")}`}
          subtitle={`${pendingPay.length} pagamento(s)`}
          color="yellow"
          delay={0.25}
        />
      </div>

      {/* Main grid: Sessions + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Upcoming sessions — 3 cols */}
        <div className="lg:col-span-3 bg-card rounded-2xl p-6 shadow-warm-sm border border-primary/5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-base font-semibold text-txt flex items-center gap-2">
              <CalendarCheck className="w-4.5 h-4.5 text-teal" />
              Próximas Sessões
            </h3>
            <Link href="/portal/sessoes" className="text-xs text-teal-dark font-semibold hover:underline flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal/8 flex items-center justify-center mb-3">
                <CalendarPlus className="w-6 h-6 text-teal" />
              </div>
              <p className="text-sm text-txt-muted">Nenhuma sessão agendada</p>
              <Link href="/portal/agendar" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-teal-dark hover:underline">
                <CalendarPlus className="w-3.5 h-3.5" /> Agendar agora
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-bg/60 hover:bg-bg transition-colors group">
                  {/* Date badge */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-lg font-bold text-teal-dark leading-none">
                      {new Date(a.date + "T00:00:00").getDate()}
                    </p>
                    <p className="text-[0.6rem] uppercase tracking-wide text-txt-muted font-semibold">
                      {new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR", { month: "short" })}
                    </p>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Clock className="w-3 h-3 text-txt-muted" />
                      <p className="text-sm font-medium text-txt">{a.startTime} – {a.endTime}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Video className="w-3 h-3 text-teal" /><span className="text-xs text-txt-muted">Online</span>
                    </div>
                  </div>
                  {/* Status + actions */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[0.6rem] font-bold ${statusColor[a.status] || ""}`}>
                      {statusLabel[a.status] || a.status}
                    </span>
                    <div className="flex gap-1.5">
                      <Link href={`/portal/sala-espera/${a.id}`} className="text-[0.6rem] text-teal-dark font-bold hover:underline">Sala de Espera</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions — 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-heading text-base font-semibold text-txt mb-2 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            Ações Rápidas
          </h3>
          <QuickAction href="/portal/agendar" icon={<CalendarPlus className="w-5 h-5" />} title="Agendar Sessão" description="Escolha data e horário" color="teal" delay={0.1} />
          <QuickAction href="/portal/processo" icon={<Leaf className="w-5 h-5" />} title="Processo Terapêutico" description="Horário fixo semanal" color="teal" delay={0.15} />
          <QuickAction href="/portal/sessoes" icon={<ClipboardList className="w-5 h-5" />} title="Minhas Sessões" description="Histórico completo" color="primary" delay={0.2} />
          <QuickAction href="/portal/pagamentos" icon={<CreditCard className="w-5 h-5" />} title="Pagamentos" description="Faturas e recibos" color="primary" delay={0.25} />
          <QuickAction href="/portal/documentos" icon={<FileText className="w-5 h-5" />} title="Notas da Sessão" description="Tarefas e lembretes" color="accent" delay={0.3} />
          {WHATSAPP_LINK && <QuickAction href={WHATSAPP_LINK} icon={<MessageCircle className="w-5 h-5" />} title="Enviar WhatsApp" description="Contato direto" color="accent" delay={0.35} />}
        </div>
      </div>

      {/* Recent notes */}
      <div className="bg-card rounded-2xl p-6 shadow-warm-sm border border-primary/5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-heading text-base font-semibold text-txt flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-accent" />
              Últimas Notas da Terapia
            </h3>
            <p className="text-xs text-txt-muted mt-1">
              Exercícios, lembretes e combinados dejados após as sessões
            </p>
          </div>
          <Link href="/portal/documentos" className="text-xs text-teal-dark font-semibold hover:underline flex items-center gap-0.5">
            Ver tudo <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-bg/80 h-28" />
            ))}
          </div>
        ) : recentNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-xl bg-accent/8 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-txt-muted">
              Suas notas pós-sessão aparecerão aqui assim que forem adicionadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-xl border border-primary/8 bg-gradient-to-br from-bg/80 to-card p-4 hover:shadow-warm-sm transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-txt leading-snug line-clamp-2">{note.title}</p>
                  <span className="text-[0.6rem] text-txt-muted whitespace-nowrap">{fmtDateTime(note.createdAt)}</span>
                </div>
                <p className="text-xs text-txt-light leading-relaxed whitespace-pre-line line-clamp-4">
                  {note.content || "Sem conteúdo textual."}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
