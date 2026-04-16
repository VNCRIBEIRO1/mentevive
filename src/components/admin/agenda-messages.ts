import type { Appointment } from "./agenda-types";
import { buildWhatsAppUrl } from "@/lib/utils";

interface MessageContext {
  tenantName?: string;
  adminName?: string;
  baseUrl?: string;
}

export function buildConfirmationMessage(apt: Appointment, ctx: MessageContext = {}): string {
  const brand = ctx.tenantName || "MenteVive";
  const sender = ctx.adminName || "Equipe";
  const dateBR = new Date(apt.date + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    `*Consulta Confirmada - ${brand}*\n\n` +
    `Ola, ${apt.patientName || ""}!\n\n` +
    `Sua sessao esta confirmada:\n\n` +
    `Data: ${dateBR}\n` +
    `Horario: ${apt.startTime} as ${apt.endTime}\n` +
    `Modalidade: Online (videochamada)\n\n` +
    `Caso precise remarcar, me avise com antecedencia.\n` +
    `- ${sender} | ${brand}`
  );
}

export function buildPreSessionMessage(apt: Appointment, ctx: MessageContext = {}): string {
  const brand = ctx.tenantName || "MenteVive";
  const sender = ctx.adminName || "Equipe";
  const baseUrl = ctx.baseUrl || "";
  const salaUrl = `${baseUrl}/portal/sala-espera/${apt.id}`;

  let msg =
    `Sua sessao comeca em breve - ${brand}\n\n` +
    `Ola, ${apt.patientName || ""}!\n\n` +
    `Sua sessao das ${apt.startTime} esta quase comecando!\n\n` +
    `Entre na Sala de Espera pelo link abaixo:\n\n` +
    `${salaUrl}\n`;

  if (apt.meetingUrl) {
    msg += `\nOu entre direto na videochamada:\n${apt.meetingUrl}\n`;
  }

  msg += `\n- ${sender} | ${brand}`;
  return msg;
}

export function sendWhatsAppMessage(
  apt: Appointment,
  type: "confirm" | "presession",
  flash: (msg: string) => void,
  ctx: MessageContext = {},
) {
  if (!apt.patientPhone) {
    flash("Paciente sem telefone cadastrado.");
    return;
  }
  const msg = type === "confirm" ? buildConfirmationMessage(apt, ctx) : buildPreSessionMessage(apt, ctx);
  const url = buildWhatsAppUrl(apt.patientPhone, msg);
  window.open(url, "_blank");
  flash(type === "confirm" ? "WhatsApp aberto com confirmacao!" : "WhatsApp aberto com lembrete pre-consulta!");
}
