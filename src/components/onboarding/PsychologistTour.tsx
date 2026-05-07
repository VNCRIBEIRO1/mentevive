"use client";

import type { Step } from "react-joyride";
import { TourRunner } from "./TourRunner";

export const PSYCHOLOGIST_TOUR_KEY = "mv:tour:psychologist:v1";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Bem-vindo ao seu consultório online",
    content:
      "Em 6 passos rápidos vamos te mostrar onde fica cada coisa. Você pode pular agora e rever depois pelo botão de ajuda.",
    skipBeacon: true,
  },
  {
    target: '[data-tour="brand-logo"]',
    title: "Sua marca",
    content:
      "Aqui é a identidade do seu consultório. Em 'Marca' você ajusta logo, cores e nome — paciente vê tudo personalizado no portal dele.",
  },
  {
    target: '[data-tour="nav-pacientes"]',
    title: "Seus pacientes",
    content:
      "Cadastre, edite prontuários e acompanhe a evolução de cada paciente. Você pode criar conta de portal para eles também.",
  },
  {
    target: '[data-tour="nav-agenda"]',
    title: "Sua agenda",
    content:
      "Veja sessões do dia, da semana e do mês. Cada agendamento tem link direto para a sala de espera virtual.",
  },
  {
    target: '[data-tour="nav-horarios"]',
    title: "Sua disponibilidade",
    content:
      "Defina os horários em que você atende. É o que aparece para o paciente quando ele vai marcar sessão pelo portal.",
  },
  {
    target: '[data-tour="nav-configuracoes"]',
    title: "Stripe e configurações",
    content:
      "Em Configurações você conecta seu Stripe (recebe direto na sua conta), edita perfil profissional e gerencia preços.",
  },
  {
    target: "body",
    placement: "center",
    title: "Pronto para atender",
    content:
      "Tour finalizado. Sempre que quiser revisar, clique no botão de ajuda no rodapé da barra lateral.",
  },
];

export function PsychologistTour() {
  return <TourRunner storageKey={PSYCHOLOGIST_TOUR_KEY} steps={steps} />;
}
