"use client";

import { motion } from "framer-motion";
import { FloatingOrbs } from "@/components/landing";
import { Globe, LayoutDashboard, HeadphonesIcon } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/utils";
import { WhatsAppIcon } from "./WhatsAppIcon";

const pills = [
  { icon: Globe, label: "Site profissional" },
  { icon: LayoutDashboard, label: "Plataforma completa" },
  { icon: HeadphonesIcon, label: "Suporte dedicado" },
];

const PLATFORM_WA = WHATSAPP_LINK || "https://wa.me/5511988840525";
const whatsappHref = `${PLATFORM_WA}?text=${encodeURIComponent("Olá! Quero criar meu consultório online com a MenteVive.")}`;

export function PlatformHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24 pb-16">
      <FloatingOrbs className="absolute inset-0 pointer-events-none" />

      {/* noise overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20baseFrequency%3D%220.65%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20, staggerChildren: 0.15 }}
        >
          <span className="section-label inline-block mb-4">
            Plataforma para psicólogos
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight max-w-4xl mx-auto">
            Criamos seu consultório online.{" "}
            <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
              Profissional. Integrado. Seguro.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Nós cuidamos da tecnologia — site, agenda, prontuários, pagamentos e
            videochamada. Você cuida dos seus pacientes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand-primary text-base px-8 py-3.5 shadow-warm-lg inline-flex items-center gap-2.5"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Quero meu consultório
            </a>
            <a
              href="#planos"
              className="btn-brand-outline text-base px-8 py-3.5"
            >
              Ver planos
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
        </motion.div>
      </div>
    </section>
  );
}
