"use client";

import { motion } from "framer-motion";
import { FloatingOrbs } from "@/components/landing";
import {
  Globe,
  LayoutDashboard,
  HeadphonesIcon,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Video,
  Shield,
  Users,
} from "lucide-react";
import { buildSaasWhatsAppUrl } from "./constants";
import { WhatsAppIcon } from "./WhatsAppIcon";

const pills = [
  { icon: Globe, label: "Site profissional" },
  { icon: LayoutDashboard, label: "Plataforma completa" },
  { icon: HeadphonesIcon, label: "Suporte dedicado" },
];

const dashboardItems = [
  { icon: CalendarDays, label: "Agenda", color: "text-teal" },
  { icon: ClipboardList, label: "Prontuário", color: "text-primary-dark" },
  { icon: Users, label: "Pacientes", color: "text-teal" },
  { icon: CreditCard, label: "Pagamentos", color: "text-primary-dark" },
  { icon: Video, label: "Videochamada", color: "text-teal" },
  { icon: Shield, label: "Segurança", color: "text-primary-dark" },
];

const whatsappHref = buildSaasWhatsAppUrl("Olá! Quero criar meu consultório online com a MenteVive.");

export function PlatformHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24 pb-16">
      <FloatingOrbs className="absolute inset-0 pointer-events-none" />

      {/* noise overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20baseFrequency%3D%220.65%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        >
          <span className="section-label inline-block mb-4">
            Plataforma para psicólogos
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-heading font-bold text-foreground leading-tight">
            Criamos seu consultório online.{" "}
            <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
              Profissional. Integrado. Seguro.
            </span>
          </h1>

          <p className="mt-6 text-lg text-foreground/70 leading-relaxed max-w-lg">
            Nós cuidamos da tecnologia — site, agenda, prontuários, pagamentos e
            videochamada. Você cuida dos seus pacientes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
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
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {pills.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground/80"
              >
                <Icon size={16} className="text-teal" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="glass-strong rounded-3xl p-8 relative">
            {/* Mock header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-foreground/40 font-mono">mentevive.vercel.app/admin</span>
            </div>

            {/* Mock dashboard grid */}
            <div className="grid grid-cols-3 gap-3">
              {dashboardItems.map(({ icon: Icon, label, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="glass rounded-xl p-4 flex flex-col items-center gap-2 group hover:scale-105 transition-transform"
                >
                  <div className="w-10 h-10 rounded-lg bg-card/60 flex items-center justify-center">
                    <Icon size={20} className={color} />
                  </div>
                  <span className="text-xs font-medium text-foreground/70">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Mock stats row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Sessões hoje", val: "8" },
                { label: "Pacientes", val: "45" },
                { label: "Receita/mês", val: "R$ 12k" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-lg p-3 text-center">
                  <p className="text-lg font-heading font-bold text-teal">{s.val}</p>
                  <p className="text-[10px] text-foreground/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
