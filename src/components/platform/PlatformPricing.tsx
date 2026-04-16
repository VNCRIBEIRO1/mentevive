"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/landing";
import { Check } from "lucide-react";

const allFeatures = [
  "Agenda inteligente",
  "Prontuário digital",
  "Portal do paciente",
  "Videochamada integrada",
  "Pagamentos via Stripe",
  "Sala de espera virtual",
  "Sessões recorrentes",
  "Relatórios financeiros",
  "Suporte por e-mail",
];

const plans = {
  monthly: {
    price: "59,90",
    period: "/mês",
    badge: null,
  },
  annual: {
    price: "499,00",
    period: "/ano",
    badge: "Economize 30%",
  },
};

export function PlatformPricing() {
  const [annual, setAnnual] = useState(true);
  const plan = annual ? plans.annual : plans.monthly;

  return (
    <section id="planos" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-10">
          <span className="section-label">Planos</span>
          <h2 className="section-title mt-3">
            Simples e transparente
          </h2>
          <p className="mt-4 text-foreground/60">
            Um plano completo. Todas as funcionalidades. Teste grátis por 14 dias.
          </p>
        </AnimatedSection>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span
            className={`text-sm font-medium transition-colors ${
              !annual ? "text-foreground" : "text-foreground/50"
            }`}
          >
            Mensal
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-14 h-7 rounded-full bg-foreground/10 transition-colors"
            aria-label="Alternar entre plano mensal e anual"
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-teal shadow-md"
              animate={{ left: annual ? "calc(100% - 1.625rem)" : "0.125rem" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors ${
              annual ? "text-foreground" : "text-foreground/50"
            }`}
          >
            Anual
          </span>
        </div>

        {/* Pricing card */}
        <AnimatedSection direction="scale">
          <div className="glass-strong rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden">
            {plan.badge && (
              <span className="absolute top-4 right-4 bg-teal text-white text-xs font-bold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}

            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              Plano Profissional
            </h3>

            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-sm text-foreground/60">R$</span>
              <motion.span
                key={plan.price}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-heading font-bold text-foreground"
              >
                {plan.price}
              </motion.span>
              <span className="text-sm text-foreground/60">{plan.period}</span>
            </div>

            {annual && (
              <p className="text-xs text-foreground/50 mb-6">
                equivale a R$41,58/mês
              </p>
            )}
            {!annual && <div className="mb-6" />}

            <ul className="text-left max-w-xs mx-auto space-y-3 mb-8">
              {allFeatures.map((feat) => (
                <li
                  key={feat}
                  className="flex items-center gap-2.5 text-sm text-foreground/80"
                >
                  <Check size={16} className="text-teal shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>

            <Link
              href="/registro"
              className="btn-brand-primary text-base px-8 py-3.5 inline-block shadow-warm-lg"
            >
              Começar grátis por 14 dias
            </Link>

            <p className="mt-3 text-xs text-foreground/40">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
