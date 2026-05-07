"use client";

import type { Step } from "react-joyride";
import { TourRunner } from "./TourRunner";

export const PATIENT_TOUR_KEY = "mv:tour:patient:v1";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Bem-vindo ao seu portal",
    content:
      "Aqui você vê suas sessões, paga e acessa documentos do seu acompanhamento. Vamos te mostrar onde fica cada coisa.",
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-agendar"]',
    title: "Agendar sessões",
    content:
      "Aqui você marca novas sessões, escolhendo dia e horário entre os disponíveis do seu psicólogo.",
  },
  {
    target: '[data-tour="nav-sessoes"]',
    title: "Suas sessões",
    content:
      "Veja sessões já agendadas, histórico completo e o link da sala de espera virtual quando estiver perto da hora.",
  },
  {
    target: '[data-tour="nav-pagamentos"]',
    title: "Pagamentos",
    content:
      "Pague de forma segura por cartão ou Pix. O recibo fica disponível aqui mesmo para você baixar.",
  },
  {
    target: '[data-tour="nav-documentos"]',
    title: "Notas e documentos",
    content:
      "Termos de consentimento, devolutivas e materiais que seu psicólogo compartilhar ficam aqui.",
  },
  {
    target: "body",
    placement: "center",
    title: "Pronto para começar",
    content:
      "Você pode revisar este tour pelo botão de ajuda no rodapé da barra lateral.",
  },
];

export function PatientTour() {
  return <TourRunner storageKey={PATIENT_TOUR_KEY} steps={steps} />;
}
