import { AnimatedSection, AnimatedItem } from "@/components/landing";
import { MessageCircle, PenTool, Sparkles } from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    number: "01",
    title: "Fale conosco",
    description:
      "Envie uma mensagem pelo WhatsApp e conte sobre seu consultório. Vamos entender suas necessidades.",
  },
  {
    icon: PenTool,
    number: "02",
    title: "Criamos seu site",
    description:
      "Desenvolvemos sua landing page profissional e integramos com a plataforma completa.",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "Comece a atender",
    description:
      "Seu consultório online fica pronto para receber pacientes. Simples assim.",
  },
];

export function PlatformHowItWorks() {
  return (
    <section id="como-funciona" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection direction="up" className="text-center mb-14">
          <span className="section-label">Como Funciona</span>
          <h2 className="section-title mt-3">Pronto em 3 passos</h2>
        </AnimatedSection>

        <AnimatedSection
          direction="up"
          staggerChildren={0.15}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, i) => (
            <AnimatedItem key={step.number}>
              <div className="relative text-center">
                {/* connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-teal/30" />
                )}

                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-strong mb-5">
                  <step.icon size={32} className="text-teal" />
                </div>

                <span className="block text-xs font-bold text-primary/50 tracking-widest uppercase mb-2">
                  Passo {step.number}
                </span>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
