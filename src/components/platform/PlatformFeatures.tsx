"use client";

import { AnimatedSection, AnimatedItem, GlassCard } from "@/components/landing";
import {
  CalendarDays,
  ClipboardList,
  Users,
  CreditCard,
  Video,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda Inteligente",
    bullets: [
      "Agendamento online pelo portal do paciente",
      "Bloqueio de horários e disponibilidade customizada",
      "Sessões recorrentes com recorrência automática",
      "Sala de espera virtual com countdown",
    ],
  },
  {
    icon: ClipboardList,
    title: "Prontuário Digital",
    bullets: [
      "Registro por sessão com notas clínicas",
      "Queixa principal e evolução documentadas",
      "Dados criptografados e confidenciais",
      "Acesso rápido ao histórico completo",
    ],
  },
  {
    icon: Users,
    title: "Portal do Paciente",
    bullets: [
      "Triagem pré-sessão automatizada",
      "Visualização de sessões e pagamentos",
      "Sala de espera com timer e orientações",
      "Acesso a documentos e recibos",
    ],
  },
  {
    icon: CreditCard,
    title: "Pagamentos Integrados",
    bullets: [
      "Stripe com cartão de crédito e PIX",
      "Recebimento direto na sua conta",
      "Controle de inadimplência automático",
      "Relatórios financeiros detalhados",
    ],
  },
  {
    icon: Video,
    title: "Videochamada Segura",
    bullets: [
      "Jitsi Meet integrado — sem instalar nada",
      "Sala de espera antes da sessão",
      "Funciona em qualquer dispositivo",
      "Conexão direta e criptografada",
    ],
  },
];

export function PlatformFeatures() {
  return (
    <section id="recursos" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-14">
          <span className="section-label">Recursos</span>
          <h2 className="section-title mt-3">
            Tudo que você precisa para atender online
          </h2>
          <p className="mt-4 text-foreground/60 max-w-xl mx-auto">
            Ferramentas pensadas por profissionais de saúde mental, para
            profissionais de saúde mental.
          </p>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.1}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat) => (
            <AnimatedItem key={feat.title}>
              <GlassCard className="h-full">
                <feat.icon size={32} className="text-teal mb-4" />
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                  {feat.title}
                </h3>
                <ul className="space-y-2.5">
                  {feat.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-sm text-foreground/70"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
