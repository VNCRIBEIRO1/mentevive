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
    span: "md:col-span-2",
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
    span: "",
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
    span: "",
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
    span: "",
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
    span: "md:col-span-2",
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
            Tudo incluído no seu consultório online
          </h2>
          <p className="mt-4 text-foreground/60 max-w-xl mx-auto">
            Ferramentas pensadas por profissionais de saúde mental, para
            profissionais de saúde mental.
          </p>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.1}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feat) => (
            <AnimatedItem key={feat.title} className={feat.span}>
              <GlassCard className="h-full group hover:border-teal/20 transition-colors duration-300">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal/10 shrink-0 group-hover:bg-teal/15 transition-colors">
                    <feat.icon size={24} className="text-teal" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
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
                  </div>
                </div>
              </GlassCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
