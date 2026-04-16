import { AnimatedSection, AnimatedItem, GlassCard } from "@/components/landing";
import { MessageSquareWarning, FileX, HandCoins } from "lucide-react";

const problems = [
  {
    icon: MessageSquareWarning,
    before: "Agenda pelo WhatsApp",
    after: "Agenda inteligente",
    description:
      "Chega de perder mensagens. Seus pacientes agendam online e você recebe tudo organizado.",
  },
  {
    icon: FileX,
    before: "Prontuários em papel",
    after: "Prontuário digital",
    description:
      "Registre sessões, notas clínicas e evolução — tudo criptografado e acessível de qualquer lugar.",
  },
  {
    icon: HandCoins,
    before: "Cobrança manual",
    after: "Pagamento integrado",
    description:
      "Stripe com cartão e PIX. O pagamento cai direto na sua conta, sem intermediários.",
  },
];

export function PlatformProblem() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-14">
          <span className="section-label">Por que MenteVive?</span>
          <h2 className="section-title mt-3">
            Chega de gerenciar seu consultório pelo WhatsApp
          </h2>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.12}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {problems.map((item) => (
            <AnimatedItem key={item.after}>
              <GlassCard variant="strong" className="h-full text-center">
                <item.icon size={36} className="mx-auto text-primary mb-4" />
                <p className="text-sm text-foreground/50 line-through mb-1">
                  {item.before}
                </p>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                  {item.after}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {item.description}
                </p>
              </GlassCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
