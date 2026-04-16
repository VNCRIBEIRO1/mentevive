"use client";

import Link from "next/link";
import { AnimatedSection } from "@/components/landing";
import { FloatingOrbs } from "@/components/landing";
import { Shield, CalendarCheck, Video } from "lucide-react";

const pills = [
  { icon: CalendarCheck, label: "Agenda online" },
  { icon: Shield, label: "Dados protegidos" },
  { icon: Video, label: "Videochamada integrada" },
];

export function PlatformHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24 pb-16">
      <FloatingOrbs className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <AnimatedSection direction="up" staggerType="premium" staggerChildren={0.15}>
          <span className="section-label inline-block mb-4">
            Plataforma para psicólogos
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight max-w-4xl mx-auto">
            Seu consultório online.{" "}
            <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
              Completo. Seguro. Profissional.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Agenda, prontuários, pagamentos e videochamadas — tudo em um só lugar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="btn-brand-primary text-base px-8 py-3.5 shadow-warm-lg"
            >
              Começar grátis
            </Link>
            <a
              href="#recursos"
              className="btn-brand-outline text-base px-8 py-3.5"
            >
              Ver recursos
            </a>
          </div>

          {/* Feature pills */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            {pills.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass rounded-full px-5 py-2.5 flex items-center gap-2.5 text-sm font-medium text-foreground/80"
              >
                <Icon size={18} className="text-teal" />
                {label}
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
