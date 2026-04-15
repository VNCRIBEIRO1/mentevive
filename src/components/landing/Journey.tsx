"use client";
import { CalendarPlus, UserCircle, CheckCircle, Video, TrendingUp } from "lucide-react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { PortalScreenCarousel } from "./PortalScreenCarousel";
import type { ReactNode } from "react";

const steps: { icon: ReactNode; label: string }[] = [
  { icon: <CalendarPlus className="w-5 h-5" />, label: "Agende" },
  { icon: <UserCircle className="w-5 h-5" />, label: "Portal" },
  { icon: <CheckCircle className="w-5 h-5" />, label: "Confirme" },
  { icon: <Video className="w-5 h-5" />, label: "Sessão" },
  { icon: <TrendingUp className="w-5 h-5" />, label: "Evolução" },
];

export function Journey() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white" id="jornada">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <AnimatedSection direction="up" className="text-center mb-10">
          <div className="section-label justify-center flex">Sua Jornada</div>
          <h2 className="section-title">Como Funciona o Processo Terapêutico</h2>
          <p className="text-txt-light max-w-[480px] mx-auto text-sm">
            Do cadastro ao acompanhamento contínuo — tudo pelo seu Portal do Paciente.
          </p>
        </AnimatedSection>

        {/* Icon steps — compact row */}
        <AnimatedSection direction="up" delay={0.15} staggerChildren={0.08} staggerType="premium" className="flex justify-center items-center gap-0 mb-12">
          {steps.map((s, i) => (
            <AnimatedItem key={i} direction="up" staggerType="premium" className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 group cursor-default">
                <div className="w-11 h-11 rounded-full bg-bg border-2 border-teal flex items-center justify-center text-teal transition-all duration-300 group-hover:bg-teal group-hover:text-white group-hover:shadow-teal-glow">
                  {s.icon}
                </div>
                <span className="text-[10px] font-bold text-txt-muted group-hover:text-teal transition-colors">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 sm:w-14 h-0.5 bg-gradient-to-r from-teal/30 to-primary/30 mx-1 sm:mx-2 mb-5" />
              )}
            </AnimatedItem>
          ))}
        </AnimatedSection>

        {/* Portal carousel — full-width hero */}
        <AnimatedSection direction="up" delay={0.3}>
          <div className="max-w-[540px] mx-auto">
            <PortalScreenCarousel />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
