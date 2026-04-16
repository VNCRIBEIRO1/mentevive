"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/landing";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Quanto tempo leva para criar meu site?",
    a: "Em geral, seu site profissional fica pronto em até 5 dias úteis após a aprovação do layout. Trabalhamos junto com você para garantir que tudo reflita sua identidade.",
  },
  {
    q: "O que está incluído no serviço?",
    a: "Você recebe uma landing page profissional com sua identidade, integrada à plataforma completa: agenda, prontuários, portal do paciente, pagamentos via Stripe e videochamada. Tudo pronto para usar.",
  },
  {
    q: "Qual a diferença entre o plano Basic e Pro?",
    a: "A principal diferença é o período de teste gratuito. No Basic você tem 30 dias grátis e no Pro, 90 dias grátis para testar a plataforma sem custo adicional além do investimento inicial. Todas as funcionalidades são idênticas.",
  },
  {
    q: "Meus dados e dos pacientes estão seguros?",
    a: "Sim. Usamos criptografia em trânsito (HTTPS/TLS) e armazenamento seguro na nuvem. Prontuários são acessíveis apenas pelo profissional responsável, seguindo padrões de sigilo do CFP.",
  },
  {
    q: "Como recebo os pagamentos dos pacientes?",
    a: "Via Stripe Connect. O valor das sessões vai direto para sua conta bancária, com cartão de crédito ou PIX. Você acompanha tudo pelo painel financeiro.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. A plataforma e o site são 100% responsivos — funcionam em computador, tablet e smartphone. Seus pacientes também acessam o portal pelo celular.",
  },
  {
    q: "Posso cancelar a assinatura a qualquer momento?",
    a: "Sim. Sem multa, sem burocracia. Você pode cancelar pelo painel e continua com acesso até o fim do período pago.",
  },
];

export function PlatformFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-12">
          <span className="section-label">FAQ</span>
          <h2 className="section-title mt-3">Perguntas frequentes</h2>
        </AnimatedSection>

        <AnimatedSection direction="up" staggerChildren={0.08}>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <AnimatedItem key={i}>
                <div className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                    aria-expanded={openIndex === i}
                  >
                    <span className="text-sm font-medium text-foreground pr-4">
                      {faq.q}
                    </span>
                    <motion.span
                      animate={{ rotate: openIndex === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-foreground/40"
                    >
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-4 text-sm text-foreground/60 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
