"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/landing";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. O trial de 14 dias é totalmente gratuito e não exige cartão de crédito. Você só insere dados de pagamento quando decidir assinar.",
  },
  {
    q: "Meus dados e dos pacientes estão seguros?",
    a: "Sim. Usamos criptografia em trânsito (HTTPS/TLS) e armazenamento seguro na nuvem. Prontuários são acessíveis apenas pelo profissional responsável, seguindo padrões de sigilo do CFP.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. A plataforma é 100% responsiva — funciona em computador, tablet e smartphone. Seus pacientes também acessam o portal pelo celular.",
  },
  {
    q: "Posso migrar meus dados de outro sistema?",
    a: "Ainda não temos importação automática, mas nossa equipe pode ajudar na migração manual durante o onboarding. Entre em contato pelo suporte.",
  },
  {
    q: "Como recebo os pagamentos dos pacientes?",
    a: "Via Stripe Connect. O valor das sessões vai direto para sua conta bancária, com cartão de crédito ou PIX. Você acompanha tudo pelo painel financeiro.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem multa, sem burocracia. Você pode cancelar direto pelo painel e continua com acesso até o fim do período pago.",
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
