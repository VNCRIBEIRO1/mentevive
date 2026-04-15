export function buildWaitingRoomPath(appointmentId: string, viewerArea: "portal" | "admin" = "portal") {
  return viewerArea === "admin"
    ? `/admin/sala-espera/${appointmentId}`
    : `/portal/sala-espera/${appointmentId}`;
}

export function getAppointmentStart(date: string, startTime: string) {
  const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;
  return new Date(`${date}T${normalizedTime}`);
}

export function getAppointmentTiming(date: string, startTime: string, now = new Date()) {
  const start = getAppointmentStart(date, startTime);
  const diffMs = start.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / 60000);
  const absMinutes = Math.max(0, Math.round(Math.abs(diffMs) / 60000));
  const sameDay = start.toDateString() === now.toDateString();
  const waitingRoomOpen = diffMs <= 10 * 60 * 1000 && diffMs >= -60 * 60 * 1000;
  const startingSoon = diffMs > 0 && diffMs <= 15 * 60 * 1000;
  const inProgress = diffMs <= 0 && diffMs >= -60 * 60 * 1000;

  let relativeLabel = "Agendada";
  if (diffMs > 0 && absMinutes < 60) {
    relativeLabel = `Comeca em ${Math.max(1, diffMinutes)} min`;
  } else if (diffMs > 0 && absMinutes >= 60) {
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    relativeLabel = minutes > 0 ? `Comeca em ${hours}h${String(minutes).padStart(2, "0")}` : `Comeca em ${hours}h`;
  } else if (inProgress) {
    relativeLabel = absMinutes <= 1 ? "Pode comecar agora" : `Iniciada ha ${absMinutes} min`;
  }

  const waitingRoomLabel = waitingRoomOpen
    ? "Sala do paciente liberada"
    : `Sala libera em ${Math.max(1, diffMinutes - 10)} min`;

  return {
    start,
    diffMs,
    diffMinutes,
    sameDay,
    waitingRoomOpen,
    startingSoon,
    inProgress,
    relativeLabel,
    waitingRoomLabel,
  };
}
