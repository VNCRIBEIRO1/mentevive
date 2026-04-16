import { AnimatedSection, AnimatedItem, GlassCard } from "@/components/landing";
import { Globe, Puzzle, Clock } from "lucide-react";

const problems = [
  {
    icon: Globe,
    before: "Criar site sozinha",
    after: "Site profissional pronto",
    description:
      "Sem dor de cabeça com tecnologia. Nós criamos seu site completo com sua identidade e integrado à plataforma.",
  },
  {
    icon: Puzzle,
    before: "Juntar várias ferramentas",
    after: "Tudo integrado",
    description:
      "Agenda, prontuários, pagamentos e videochamada — num só lugar, sem precisar de 5 apps diferentes.",
  },
  {
    icon: Clock,
    before: "Perder tempo com burocracia",
    after: "Foco nos pacientes",
    description:
      "Automatize o operacional e dedique seu tempo ao que mais importa: o atendimento clínico.",
  },
];

export function PlatformProblem() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-14">
          <span className="section-label">Por que MenteVive?</span>
          <h2 className="section-title mt-3">
            Nós resolvemos a parte técnica para você
          </h2>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.12}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {problems.map((item) => (
            <AnimatedItem key={item.after}>
              <GlassCard
                variant="strong"
                className="h-full text-center group hover:border-primary/20 transition-colors duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon size={28} className="text-primary" />
                </div>
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
