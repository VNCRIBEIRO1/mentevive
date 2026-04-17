"use client";
import { useState } from "react";
import { AnimatedSection, AnimatedItem } from "@/components/landing";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Sprout, CreditCard, ShieldCheck, Clock,
  MessageSquare, LayoutDashboard, FileText, Lock, Video, Users,
  Zap, Globe, Shield, Heart, ArrowRight, User, Settings,
} from "lucide-react";
import { PortalScreenCarousel } from "./PortalScreenCarousel";
import { AdminScreenCarousel } from "./AdminScreenCarousel";
import Link from "next/link";

/* ── Role types ── */
type Role = "patient" | "admin";

/* ── Features per role ── */
const patientFeatures = [
  { icon: CalendarCheck, title: "Agendamento Online", desc: "Agende sessões direto pelo portal, com confirmação automática." },
  { icon: Sprout, title: "Evolução Terapêutica", desc: "Acompanhe feedbacks, anotações e seu progresso sessão a sessão." },
  { icon: CreditCard, title: "Pagamentos", desc: "Visualize faturas, histórico e status de pagamentos." },
  { icon: ShieldCheck, title: "Triagem Pré-Sessão", desc: "Preencha triagens antes da sessão para otimizar o atendimento." },
  { icon: Clock, title: "Sala de Espera", desc: "Acesse a sala de espera virtual e entre na sessão com um clique." },
  { icon: MessageSquare, title: "Feedback", desc: "Registre como você se sentiu após cada sessão." },
];

const adminFeatures = [
  { icon: LayoutDashboard, title: "Dashboard Completo", desc: "Visão geral de pacientes, sessões, receita e presença." },
  { icon: CalendarCheck, title: "Agenda Inteligente", desc: "Gerencie horários, confirmações e recorrências." },
  { icon: FileText, title: "Prontuários", desc: "Registros clínicos completos com controle de visibilidade." },
  { icon: Lock, title: "Notas Privadas", desc: "Anotações sigilosas visíveis apenas para você." },
  { icon: Users, title: "Gestão de Pacientes", desc: "Cadastro, histórico e acompanhamento de cada paciente." },
  { icon: Video, title: "Videochamada", desc: "Sessões por vídeo integradas, sem apps externos." },
];

/* ── Steps per role ── */
const patientSteps = [
  { num: "01", title: "Crie sua conta", desc: "Cadastre-se pelo link da sua terapeuta." },
  { num: "02", title: "Agende sua sessão", desc: "Escolha dia e horário disponíveis." },
  { num: "03", title: "Preencha a triagem", desc: "Responda perguntas rápidas sobre como está." },
  { num: "04", title: "Sala de espera", desc: "Aguarde na sala virtual até ser chamado(a)." },
  { num: "05", title: "Sessão online", desc: "Participe da sessão por videochamada." },
  { num: "06", title: "Acompanhe evolução", desc: "Veja feedbacks e registros a cada sessão." },
];

const adminSteps = [
  { num: "01", title: "Configure seu espaço", desc: "Personalize horários, valores e página." },
  { num: "02", title: "Receba agendamentos", desc: "Pacientes agendam direto pelo portal." },
  { num: "03", title: "Revise triagens", desc: "Veja como o paciente está antes da sessão." },
  { num: "04", title: "Realize a sessão", desc: "Videochamada integrada na plataforma." },
  { num: "05", title: "Registre notas", desc: "Crie notas privadas e feedbacks." },
  { num: "06", title: "Gerencie prontuários", desc: "Evolução completa de cada paciente." },
];

/* ── Highlights ── */
const highlights = [
  { icon: Zap, title: "Rápido e Intuitivo", desc: "Interface pensada para facilitar o dia a dia." },
  { icon: Globe, title: "100% Online", desc: "Acesse de qualquer lugar, a qualquer hora." },
  { icon: Shield, title: "Seguro e Privado", desc: "Dados protegidos com criptografia e conformidade LGPD." },
  { icon: Heart, title: "Foco no Cuidado", desc: "Tecnologia a serviço do vínculo terapêutico." },
  { icon: Video, title: "Videochamada Integrada", desc: "Sem precisar baixar apps — tudo dentro da plataforma." },
  { icon: Lock, title: "Prontuário Sigiloso", desc: "Notas privadas e controle total de visibilidade." },
];

export function PlatformHowItWorks() {
  const [role, setRole] = useState<Role>("patient");
  const features = role === "patient" ? patientFeatures : adminFeatures;
  const steps = role === "patient" ? patientSteps : adminSteps;

  return (
    <section id="como-funciona" className="py-20 px-6">
      <div className="max-w-6xl mx-auto space-y-24">
        {/* ── Hero + Role Switcher ── */}
        <AnimatedSection direction="up" className="text-center">
          <span className="section-label">Como Funciona</span>
          <h2 className="section-title mt-3 mb-4">
            Conheça a plataforma por dentro
          </h2>
          <p className="text-txt-light max-w-2xl mx-auto mb-8">
            Veja como funciona o portal do paciente e o painel administrativo
            da terapeuta. Tudo pensado para simplificar o processo terapêutico.
          </p>

          {/* Role toggle */}
          <div className="inline-flex bg-card rounded-full p-1 ring-1 ring-border">
            {([
              { key: "patient" as Role, label: "Sou Paciente", icon: User },
              { key: "admin" as Role, label: "Sou Terapeuta", icon: Settings },
            ]).map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                  role === r.key ? "text-white" : "text-txt-muted hover:text-txt-light"
                }`}
              >
                {role === r.key && (
                  <motion.div
                    layoutId="role-pill"
                    className="absolute inset-0 bg-gradient-to-r from-teal to-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <r.icon className="w-4 h-4" />
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* ── Step-by-step grid ── */}
        <AnimatedSection direction="up" staggerChildren={0.1}>
          <h3 className="text-xl font-heading font-semibold text-foreground text-center mb-10">
            {role === "patient" ? "Sua jornada como paciente" : "Sua jornada como terapeuta"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="wait">
              {steps.map((step) => (
                <AnimatedItem key={`${role}-${step.num}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="relative bg-card rounded-2xl p-5 ring-1 ring-border hover:ring-teal/30 transition-all group"
                  >
                    <span className="text-3xl font-bold bg-gradient-to-br from-teal/20 to-primary/10 bg-clip-text text-transparent select-none">
                      {step.num}
                    </span>
                    <h4 className="text-base font-heading font-semibold text-foreground mt-2 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-txt-light leading-relaxed">
                      {step.desc}
                    </p>
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-teal" />
                    </div>
                  </motion.div>
                </AnimatedItem>
              ))}
            </AnimatePresence>
          </div>
        </AnimatedSection>

        {/* ── Interactive Demo — Carousel ── */}
        <div className="space-y-10">
          <AnimatedSection direction="up" className="text-center">
            <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
              {role === "patient" ? "Portal do Paciente" : "Painel da Terapeuta"}
            </h3>
            <p className="text-txt-light max-w-xl mx-auto">
              Navegue pelas telas e veja como a plataforma funciona na prática.
            </p>
          </AnimatedSection>

          <AnimatedSection direction="up">
            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                {role === "patient" ? (
                  <motion.div key="portal" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.35 }}>
                    <PortalScreenCarousel />
                  </motion.div>
                ) : (
                  <motion.div key="admin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                    <AdminScreenCarousel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnimatedSection>

          {/* Feature cards below carousel */}
          <AnimatedSection direction="up" staggerChildren={0.08} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="wait">
              {features.map((f) => (
                <AnimatedItem key={`${role}-${f.title}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 bg-card rounded-xl p-4 ring-1 ring-border hover:ring-teal/30 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-teal/15 to-primary/10 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-teal" />
                    </div>
                    <div>
                      <h4 className="text-sm font-heading font-semibold text-foreground mb-0.5">{f.title}</h4>
                      <p className="text-xs text-txt-light leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                </AnimatedItem>
              ))}
            </AnimatePresence>
          </AnimatedSection>
        </div>

        {/* ── Highlights / Diferenciais ── */}
        <AnimatedSection direction="up" staggerChildren={0.1}>
          <h3 className="text-xl font-heading font-semibold text-foreground text-center mb-10">
            Diferenciais da Plataforma
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlights.map((h) => (
              <AnimatedItem key={h.title}>
                <div className="text-center bg-card rounded-2xl p-6 ring-1 ring-border hover:ring-primary/30 transition-all">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass-strong mb-4">
                    <h.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-base font-heading font-semibold text-foreground mb-1">{h.title}</h4>
                  <p className="text-sm text-txt-light leading-relaxed">{h.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>

        {/* ── CTA ── */}
        <AnimatedSection direction="up" className="text-center">
          <div className="bg-gradient-to-r from-teal/8 to-primary/8 rounded-3xl p-10 ring-1 ring-border">
            <h3 className="text-2xl font-heading font-bold text-foreground mb-3">
              Pronto para começar?
            </h3>
            <p className="text-txt-light max-w-lg mx-auto mb-6">
              Crie sua conta e comece a usar a plataforma hoje mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/registro"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-primary text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Criar conta grátis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card ring-1 ring-border text-foreground rounded-full font-medium hover:ring-teal/30 transition-all"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
