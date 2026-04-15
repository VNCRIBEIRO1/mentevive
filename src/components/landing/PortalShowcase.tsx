"use client";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { PortalScreenCarousel } from "./PortalScreenCarousel";
import {
  CalendarCheck,
  Leaf,
  CreditCard,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

const features: { icon: ReactNode; title: string; desc: string; color: string; iconBg: string }[] = [
  {
    icon: <CalendarCheck className="w-5 h-5" />,
    title: "Agendamento Online",
    desc: "Escolha seu horário ideal e agende diretamente, 24h por dia.",
    color: "text-teal",
    iconBg: "bg-teal/10 ring-teal/20",
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    title: "Evolução Terapêutica",
    desc: "Acompanhe sua jornada com linha do tempo e anotações pessoais.",
    color: "text-teal-dark",
    iconBg: "bg-teal/8 ring-teal/15",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Pagamentos Simples",
    desc: "PIX ou cartão pelo Stripe. Sem complicação, sem papelada.",
    color: "text-primary-dark",
    iconBg: "bg-primary/10 ring-primary/20",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Documentos & Notas",
    desc: "Acesse orientações pós-sessão e materiais terapêuticos.",
    color: "text-accent",
    iconBg: "bg-accent/10 ring-accent/25",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Triagem Pré-Sessão",
    desc: "Questionário rápido que ajuda a Bea a personalizar cada sessão.",
    color: "text-purple-600",
    iconBg: "bg-purple-50 ring-purple-100",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Sala de Espera Virtual",
    desc: "Ambiente acolhedor com meditação guiada antes da sua sessão.",
    color: "text-teal",
    iconBg: "bg-teal/10 ring-teal/20",
  },
];

/* Floating particle dots for background atmosphere */
function FloatingDots() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-teal/10"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function PortalShowcase() {
  const reduce = useReducedMotion();

  return (
    <section className="py-24 px-4 md:px-8 bg-bg relative overflow-hidden" id="portal">
      <FloatingDots />

      <div className="max-w-[1100px] mx-auto relative">
        {/* Section header with entrance animation */}
        <AnimatedSection direction="up">
          <div className="section-label">Portal do Paciente</div>
          <h2 className="section-title">Sua terapia, organizada e acolhedora</h2>
          <p className="text-center text-sm text-txt-light max-w-xl mx-auto mt-3 mb-4">
            Um espaço digital pensado com carinho para que você acompanhe cada etapa do seu processo terapêutico — com segurança, praticidade e acolhimento.
          </p>
          {/* Animated underline */}
          {!reduce && (
            <motion.div
              className="mx-auto h-0.5 bg-gradient-to-r from-transparent via-teal/40 to-transparent rounded-full mb-12"
              initial={{ width: 0 }}
              whileInView={{ width: 200 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            />
          )}
        </AnimatedSection>

        {/* Main content: Features + Screen carousel */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left: Feature cards — animated grid */}
          <div>
            <AnimatedSection direction="left" staggerChildren={0.1} staggerType="premium" className="grid sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <AnimatedItem key={i} direction="left" staggerType="premium">
                  <motion.div
                    className="group relative bg-white/70 backdrop-blur-sm rounded-xl p-4 ring-1 ring-primary/5 hover:ring-teal/20 transition-all duration-300 cursor-default"
                    whileHover={reduce ? {} : { y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <motion.div
                        className={`w-10 h-10 rounded-xl ${f.iconBg} ${f.color} ring-1 flex items-center justify-center mb-3`}
                        whileHover={reduce ? {} : { scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {f.icon}
                      </motion.div>
                      <h3 className="text-sm font-bold text-txt mb-1">{f.title}</h3>
                      <p className="text-xs text-txt-light leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                </AnimatedItem>
              ))}
            </AnimatedSection>
          </div>

          {/* Right: Realistic portal screen carousel */}
          <AnimatedSection direction="right" delay={0.2}>
            <PortalScreenCarousel />
          </AnimatedSection>
        </div>

        {/* CTA */}
        <AnimatedSection direction="up" delay={0.4}>
          <div className="text-center mt-16">
            <motion.div
              whileHover={reduce ? {} : { scale: 1.03 }}
              whileTap={reduce ? {} : { scale: 0.97 }}
            >
              <Link
                href="/registro"
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-teal to-teal-dark text-white font-bold text-sm px-8 py-4 rounded-full shadow-teal-glow hover:shadow-lg transition-all duration-300 group"
              >
                Criar minha conta
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <p className="text-xs text-txt-muted mt-3">
              Cadastro gratuito — acesse agendamento, evolução e pagamentos
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
