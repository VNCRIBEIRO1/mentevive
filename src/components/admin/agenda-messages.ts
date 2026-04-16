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
  let msg = `✅ *Consulta Confirmada — ${brand}*\n\n` +
    `Olá, ${apt.patientName || ""}! \n\n` +
    `Sua sessão está *confirmada*:\n\n` +
    `📅 *Data:* ${dateBR}\n` +
    `⏰ *Horário:* ${apt.startTime} às ${apt.endTime}\n` +
    `📍 *Modalidade:* ${apt.modality === "presencial" ? "Presencial" : "Online (videochamada)"}\n`;
  msg += `\nCaso precise remarcar, me avise com antecedência. ` +
    `Te espero! 🌿\n\n— ${sender} | ${brand}`;
  return msg;
}

export function buildPreSessionMessage(apt: Appointment, ctx: MessageContext = {}): string {
  const brand = ctx.tenantName || "MenteVive";
  const sender = ctx.adminName || "Equipe";
  const baseUrl = ctx.baseUrl || "";
  const salaUrl = `${baseUrl}/portal/sala-espera/${apt.id}`;
  let msg = `🌿 *Sua sessão começa em breve — ${brand}*\n\n` +
    `Olá, ${apt.patientName || ""}! 😊\n\n` +
    `Sua sessão das *${apt.startTime}* está quase começando!\n\n`;

  if (apt.modality === "presencial") {
    msg += `📍 *Modalidade:* Presencial\n` +
      `Nos vemos no consultório! 🏠\n`;
  } else {
    msg += `💻 Entre na *Sala de Espera* pelo link abaixo. ` +
      `Quando eu estiver pronta, você será redirecionado(a) para a videochamada automaticamente:\n\n` +
      `🔗 ${salaUrl}\n`;
    if (apt.meetingUrl) {
      msg += `\nOu entre direto na videochamada:\n🎥 ${apt.meetingUrl}\n`;
    }
  }

  msg += `\nTe espero! 🌿\n— ${sender} | ${brand}`;
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
  flash(type === "confirm" ? "WhatsApp aberto com confirmação!" : "WhatsApp aberto com lembrete pré-consulta!");
}
