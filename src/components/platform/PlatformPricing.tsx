"use client";

import { AnimatedSection, AnimatedItem } from "@/components/landing";
import { Check, Sparkles, Star } from "lucide-react";
import { buildSaasWhatsAppUrl } from "./constants";
import { WhatsAppIcon } from "./WhatsAppIcon";

const baseFeatures = [
  "Site / landing page profissional",
  "Agenda inteligente",
  "Prontuário digital seguro",
  "Portal do paciente",
  "Videochamada integrada (Jitsi)",
  "Pagamentos via Stripe (cartão + PIX)",
  "Sala de espera virtual",
  "Sessões recorrentes",
  "Relatórios financeiros",
  "Suporte por e-mail e WhatsApp",
];

const proExtras = [
  "Suporte prioritário",
  "Domínio personalizado",
  "Relatórios avançados",
  "Badge Pro no diretório",
];

const plans = [
  {
    name: "Básico",
    setup: "399",
    trial: "30 dias grátis",
    trialNote: "Teste a plataforma por 30 dias sem custo adicional",
    popular: false,
    features: baseFeatures,
    whatsappMsg: "Olá! Tenho interesse no plano Básico da MenteVive.",
  },
  {
    name: "Pro",
    setup: "499",
    trial: "90 dias grátis",
    trialNote: "Teste a plataforma por 90 dias sem custo adicional",
    popular: true,
    features: [...baseFeatures, ...proExtras],
    whatsappMsg: "Olá! Tenho interesse no plano Pro da MenteVive.",
  },
];

export function PlatformPricing() {
  return (
    <section id="planos" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-12">
          <span className="section-label">Planos</span>
          <h2 className="section-title mt-3">
            Escolha o plano ideal para você
          </h2>
          <p className="mt-4 text-foreground/60 max-w-xl mx-auto">
            Criamos seu site profissional e integramos com toda a plataforma.
            Após o período de teste, a assinatura é de{" "}
            <strong className="text-foreground">R$&nbsp;59,90/mês</strong> ou{" "}
            <strong className="text-foreground">R$&nbsp;499,00/ano</strong>.
          </p>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.15}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
        >
          {plans.map((plan) => {
            const href = buildSaasWhatsAppUrl(plan.whatsappMsg);

            return (
              <AnimatedItem key={plan.name}>
                <div
                  className={`relative h-full rounded-2xl p-8 sm:p-10 flex flex-col transition-all duration-300 ${
                    plan.popular
                      ? "glass-glow border-2 border-teal/30 shadow-teal-glow scale-[1.02]"
                      : "glass-strong border border-white/10"
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-md">
                      <Sparkles size={12} />
                      Mais popular
                    </span>
                  )}

                  {/* Plan name */}
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                    Plano {plan.name}
                  </h3>

                  {/* Trial highlight */}
                  <span className="inline-block text-sm font-medium text-teal bg-teal/10 rounded-full px-3 py-1 w-fit mb-6">
                    {plan.trial}
                  </span>

                  {/* Setup price */}
                  <div className="mb-2">
                    <span className="text-sm text-foreground/50">Investimento único</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm text-foreground/60">R$</span>
                      <span className="text-5xl font-heading font-bold text-foreground">
                        {plan.setup}
                      </span>
                      <span className="text-sm text-foreground/60">,00</span>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/50 mb-6">
                    {plan.trialNote}
                  </p>

                  {/* Recurring info */}
                  <div className="glass rounded-xl px-4 py-3 mb-6 text-center">
                    <p className="text-xs text-foreground/50 mb-1">
                      Após o período grátis
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      R$ 59,90/mês{" "}
                      <span className="text-foreground/40">ou</span>{" "}
                      R$ 499,00/ano
                    </p>
                    <p className="text-xs text-teal mt-0.5">
                      Economize 30% no plano anual
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat) => {
                      const isPro = proExtras.includes(feat);
                      return (
                        <li
                          key={feat}
                          className={`flex items-center gap-2.5 text-sm ${
                            isPro ? "text-teal font-medium" : "text-foreground/80"
                          }`}
                        >
                          {isPro ? (
                            <Star size={16} className="text-teal shrink-0" />
                          ) : (
                            <Check size={16} className="text-teal shrink-0" />
                          )}
                          {feat}
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2.5 text-base font-semibold px-8 py-3.5 rounded-brand transition-all duration-300 ${
                      plan.popular
                        ? "btn-brand-primary shadow-warm-lg hover:shadow-warm-xl"
                        : "btn-brand-outline"
                    }`}
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    Quero o plano {plan.name}
                  </a>

                  <p className="mt-3 text-xs text-foreground/40 text-center">
                    Fale conosco pelo WhatsApp
                  </p>
                </div>
              </AnimatedItem>
            );
          })}
        </AnimatedSection>
      </div>
    </section>
  );
}
