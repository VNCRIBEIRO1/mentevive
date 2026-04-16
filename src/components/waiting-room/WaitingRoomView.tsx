"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { JitsiMeet } from "@/components/JitsiMeet";
import { WaitingRoomTriageCard, type WaitingRoomTriageData } from "@/components/waiting-room/WaitingRoomTriageCard";

type AppointmentData = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: string;
  status: string;
  meetingUrl: string | null;
};

type WaitingRoomViewProps = {
  viewerArea?: "portal" | "admin";
};

async function fetchAppointmentForViewer(appointmentId: string, viewerArea: "portal" | "admin") {
  if (viewerArea === "portal") {
    const portalDetailResponse = await fetch(`/api/portal/appointments/${appointmentId}`, {
      cache: "no-store",
    });
    if (portalDetailResponse.ok) {
      return portalDetailResponse.json() as Promise<AppointmentData>;
    }
  }
  const detailResponse = await fetch(`/api/appointments/${appointmentId}`);
  if (detailResponse.ok) {
    return detailResponse.json() as Promise<AppointmentData>;
  }

  if (viewerArea !== "portal") {
    return null;
  }

  const portalResponse = await fetch("/api/portal/appointments");
  if (!portalResponse.ok) {
    return null;
  }

  const payload = await portalResponse.json() as Array<Record<string, unknown>>;
  if (!Array.isArray(payload)) {
    return null;
  }

  return payload
    .map((row) => (row.appointment ?? row) as AppointmentData)
    .find((item) => item.id === appointmentId) || null;
}

export function WaitingRoomView({ viewerArea = "portal" }: WaitingRoomViewProps) {
  const { id: appointmentId } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [apt, setApt] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [showJitsi, setShowJitsi] = useState(false);
  const [triage, setTriage] = useState<WaitingRoomTriageData | null>(null);
  const [checklist, setChecklist] = useState({
    camera: false,
    mic: false,
    quiet: false,
    water: false,
    phone: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isAdminView = viewerArea === "admin";
  const backHref = isAdminView ? "/admin/agenda" : "/portal/sessoes";
  const backLabel = isAdminView ? "Voltar a agenda" : "Voltar as sessoes";
  const title = isAdminView ? "Sala de Espera do Paciente" : "Sala de Espera";
  const subtitle = isAdminView
    ? "Acompanhe a preparacao da consulta e entre na videochamada no momento certo."
    : "A triagem desta sessao fica aqui dentro, junto com a preparacao para o atendimento.";

  const shouldTick = seconds !== null && seconds > 0;
  const hasApt = !!apt;

  useEffect(() => {
    if (!appointmentId) return;

    setFetchError(false);
    Promise.all([
      fetchAppointmentForViewer(appointmentId, viewerArea),
      fetch(`/api/portal/triagem?appointmentId=${appointmentId}`).then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([appointmentData, triageData]) => {
        if (appointmentData) {
          setApt(appointmentData);
          const sessionDateTime = new Date(`${appointmentData.date}T${appointmentData.startTime}`);
          const now = new Date();
          const diff = Math.max(0, Math.floor((sessionDateTime.getTime() - now.getTime()) / 1000));
          setSeconds(diff);
        }

        if (triageData) {
          setTriage(triageData as WaitingRoomTriageData);
        }
      })
      .catch((err) => {
        console.error("WaitingRoomView fetch error:", err);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [appointmentId, viewerArea]);

  useEffect(() => {
    if (seconds === null || seconds <= 0) return;

    intervalRef.current = setInterval(() => {
      setSeconds((previous) => {
        if (previous === null || previous <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally restart only when shouldTick flips, not every second
  }, [shouldTick]);

  useEffect(() => {
    if (!appointmentId || !apt) return;

    let poll: ReturnType<typeof setInterval> | null = null;
    const refreshAppointment = () => {
      if (document.hidden) return;

      fetchAppointmentForViewer(appointmentId, viewerArea)
        .then((appointmentData) => {
          if (appointmentData) {
            setApt((previous) => previous
              ? { ...previous, meetingUrl: appointmentData.meetingUrl, status: appointmentData.status }
              : previous);
          }
        })
        .catch(() => {});
    };

    const startPolling = () => {
      poll = setInterval(refreshAppointment, 30_000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (poll) {
          clearInterval(poll);
          poll = null;
        }
        return;
      }

      refreshAppointment();
      startPolling();
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (poll) clearInterval(poll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- restart polling only when apt existence changes
  }, [appointmentId, hasApt, viewerArea]);

  const closeJitsi = useCallback(() => setShowJitsi(false), []);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);
  const hasMeetingUrl = !!apt?.meetingUrl;
  const canEnter = seconds !== null && seconds <= 600 && hasMeetingUrl;
  const roomName = apt?.meetingUrl ? apt.meetingUrl.split("/").pop() || "" : "";

  const formatCountdown = (value: number) => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-heading text-xl font-bold text-white">
            PSI
          </div>
          <p className="text-sm text-txt-muted">Carregando sala de espera...</p>
        </div>
      </div>
    );
  }

  if (!apt) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="mt-4 font-heading text-lg font-semibold text-txt">
          {fetchError ? "Erro ao carregar sessao" : "Sessao nao encontrada"}
        </h2>
        <p className="mt-2 text-sm text-txt-muted">
          {fetchError
            ? "Houve um problema de conexao. Tente novamente."
            : "Verifique se o link esta correto ou volte para suas sessoes."}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          {fetchError && (
            <button
              onClick={() => {
                setLoading(true);
                setFetchError(false);
                setApt(null);
                fetchAppointmentForViewer(appointmentId!, viewerArea)
                  .then((data) => { if (data) setApt(data); })
                  .catch((err) => { console.error("Retry error:", err); setFetchError(true); })
                  .finally(() => setLoading(false));
              }}
              className="btn-brand-primary inline-block"
            >
              Tentar novamente
            </button>
          )}
          <Link href={backHref} className="btn-brand-primary inline-block">
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  const isInactive = apt.status === "cancelled" || apt.status === "completed" || apt.status === "no_show";

  const statusBadge: Record<string, { cls: string; label: string }> = {
    confirmed: { cls: "bg-green-100 text-green-600", label: "Confirmada" },
    pending: { cls: "bg-yellow-100 text-yellow-600", label: "Pendente" },
    cancelled: { cls: "bg-red-100 text-red-500", label: "Cancelada" },
    completed: { cls: "bg-blue-100 text-blue-600", label: "Realizada" },
    no_show: { cls: "bg-gray-100 text-gray-500", label: "Nao compareceu" },
  };
  const badge = statusBadge[apt.status] || statusBadge.pending;

  if (isInactive) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mb-4 text-4xl">{apt.status === "completed" ? "OK" : apt.status === "cancelled" ? "X" : "!"}</div>
        <h2 className="font-heading text-lg font-semibold text-txt">
          {apt.status === "completed" ? "Sessao realizada" : apt.status === "cancelled" ? "Sessao cancelada" : "Sessao encerrada"}
        </h2>
        <p className="mt-2 text-sm text-txt-muted">
          {apt.status === "completed"
            ? "Esta sessao ja foi realizada. Voce pode ver o historico em Minhas Sessoes."
            : apt.status === "cancelled"
              ? "Esta sessao foi cancelada. Voce pode agendar uma nova sessao."
              : "Esta sessao nao esta mais disponivel."}
        </p>
        <p className="mt-1 text-xs text-txt-muted">
          {formatDate(apt.date)} | {apt.startTime} - {apt.endTime}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={backHref} className="btn-brand-primary">
            {backLabel}
          </Link>
          {apt.status !== "completed" && (
            <Link href="/portal/agendar" className="btn-brand-outline">
              Agendar nova sessao
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href={backHref} className="mb-2 inline-block text-xs font-bold text-primary-dark hover:underline">
          {`<- ${backLabel}`}
        </Link>
        <h1 className="font-heading text-2xl font-bold text-txt">{title}</h1>
        <p className="mt-1 text-sm text-txt-light">{subtitle}</p>
      </div>

      <div className="mb-6 rounded-brand bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold capitalize text-txt">{formatDate(apt.date)}</p>
            <p className="mt-1 text-sm text-txt-light">
              {apt.startTime} - {apt.endTime} | Online (videochamada)
            </p>
          </div>
          <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${badge.cls}`}>
            {badge.label}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-brand border border-primary/5 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-sm text-txt-muted">
          {seconds !== null && seconds > 0 ? "Sua sessao comeca em" : "Sua sessao ja pode comecar"}
        </p>
        <div className="my-3 font-heading text-5xl font-bold text-primary-dark">
          {seconds !== null && seconds > 0 ? formatCountdown(seconds) : "00:00"}
        </div>
        {seconds !== null && seconds > 0 && seconds <= 600 && (
          <p className="text-xs font-medium text-green-600">Voce ja pode entrar na sala.</p>
        )}
      </div>

      <WaitingRoomTriageCard
        appointmentId={appointmentId}
        initialTriage={triage}
        isAdminView={isAdminView}
        onSaved={setTriage}
      />

      {!isAdminView && (
        <div className="mb-6 rounded-brand border border-primary/5 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-sm font-semibold text-txt">Checklist de preparacao</h3>
          <div className="space-y-3">
            {[
              { key: "camera" as const, label: "Camera funcionando", hint: "Teste antes de entrar" },
              { key: "mic" as const, label: "Microfone funcionando", hint: "Verifique o audio" },
              { key: "quiet" as const, label: "Ambiente silencioso e privado", hint: "Sem interrupcoes" },
              { key: "water" as const, label: "Agua por perto", hint: "Mantenha-se hidratado(a)" },
              { key: "phone" as const, label: "Celular no silencioso", hint: "Evite distracoes" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className={`w-full rounded-brand-sm border-[1.5px] p-3 text-left transition-colors ${
                  checklist[item.key] ? "border-green-300 bg-green-50" : "border-primary/10 hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs transition-colors ${
                      checklist[item.key] ? "border-green-500 bg-green-500 text-white" : "border-gray-300"
                    }`}
                  >
                    {checklist[item.key] ? "OK" : ""}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${checklist[item.key] ? "text-green-700" : "text-txt"}`}>{item.label}</p>
                    <p className="text-xs text-txt-muted">{item.hint}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {allChecked && (
            <p className="mt-4 text-center text-sm font-medium text-green-600">Tudo pronto para a sessao.</p>
          )}
        </div>
      )}

      <div className="mb-6 rounded-brand border border-primary/5 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-heading text-sm font-semibold text-txt">
          Instrucoes para videochamada
        </h3>
          <div className="space-y-3 text-sm text-txt-light">
            <div className="flex items-start gap-2"><span className="mt-0.5 font-bold text-primary-dark">1.</span><p>A sessao acontece via <strong>Jitsi Meet</strong> e nao exige aplicativo.</p></div>
            <div className="flex items-start gap-2"><span className="mt-0.5 font-bold text-primary-dark">2.</span><p>Use de preferencia um computador ou notebook com fones de ouvido.</p></div>
            <div className="flex items-start gap-2"><span className="mt-0.5 font-bold text-primary-dark">3.</span><p>Escolha um ambiente privado e silencioso para a conversa.</p></div>
            <div className="flex items-start gap-2"><span className="mt-0.5 font-bold text-primary-dark">4.</span><p>Verifique sua conexao com a internet antes de entrar.</p></div>
            <div className="flex items-start gap-2"><span className="mt-0.5 font-bold text-primary-dark">5.</span><p>Ao clicar em <strong>Entrar na sessao</strong>, a videochamada abrira automaticamente.</p></div>
            <div className="flex items-start gap-2"><span className="mt-0.5 font-bold text-primary-dark">6.</span><p>Se tiver problemas tecnicos, fale pelo WhatsApp.</p></div>
          </div>
      </div>

      {!isAdminView && (
        <div className="mb-6 rounded-brand bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center">
          <h3 className="mb-3 font-heading text-sm font-semibold text-txt">Enquanto espera</h3>
          <div className="mx-auto max-w-md space-y-2 text-left text-sm text-txt-light">
            <p>Faca 3 respiracoes profundas: inspire em 4s e expire em 6s.</p>
            <p>Coloque seu celular no silencioso.</p>
            <p>Tenha um copo de agua por perto.</p>
            <p>Acomode-se em um lugar tranquilo e confortavel.</p>
            <p>Se quiser, anote o que gostaria de compartilhar hoje.</p>
          </div>
        </div>
      )}

      {!hasMeetingUrl && (
        <div className="mb-6 rounded-brand border border-yellow-200 bg-yellow-50 p-4 text-center">
          <p className="text-sm font-medium text-yellow-800">O link da videochamada sera gerado automaticamente quando a sessao for confirmada.</p>
          <p className="mt-1 text-xs text-yellow-600">Esta pagina atualiza sozinha.</p>
        </div>
      )}

      <div className="mb-8 text-center">
          <button
            onClick={() => setShowJitsi(true)}
            disabled={!canEnter}
            className={`btn-brand-accent px-8 py-3 text-base disabled:cursor-not-allowed disabled:opacity-40 ${canEnter ? "animate-pulse" : ""}`}
          >
            Entrar na sessao
          </button>
          {!canEnter && seconds !== null && !hasMeetingUrl && (
            <p className="mt-2 text-xs text-yellow-600">O link sera gerado automaticamente quando sua sessao for confirmada.</p>
          )}
          {!canEnter && seconds !== null && hasMeetingUrl && seconds > 600 && (
            <p className="mt-2 text-xs text-txt-muted">Disponivel 10 minutos antes do horario da sessao.</p>
          )}
          {apt.meetingUrl && (
            <p className="mt-3 text-xs text-txt-muted">
              Ou acesse diretamente:{" "}
              <a href={apt.meetingUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-dark hover:underline">
                {apt.meetingUrl}
              </a>
            </p>
          )}
      </div>

      {showJitsi && (
        <JitsiMeet
          roomName={roomName}
          displayName={session?.user?.name || (isAdminView ? "Terapeuta" : "Paciente")}
          onClose={closeJitsi}
        />
      )}
    </div>
  );
}
