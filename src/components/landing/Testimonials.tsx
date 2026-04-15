import { Quote, Star } from "lucide-react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { GlassCard } from "./GlassCard";

const testimonials = [
  { stars: 5, quote: "Encontrei um espaço onde posso ser eu mesma sem julgamento. O acolhimento e a escuta fazem toda a diferença no meu processo.", author: "Carolina P.", since: "Paciente há 1 ano" },
  { stars: 5, quote: "A terapia transformou meu filho. Ele era muito ansioso e agora está mais seguro e feliz. Profissional incrível com crianças.", author: "Renata M.", since: "Mãe de paciente" },
  { stars: 5, quote: "A jornada de autoconhecimento mudou minha vida. Encontrei acolhimento, aprendi a colocar limites e hoje me respeito muito mais.", author: "Sandra L.", since: "Paciente há 6 meses" },
];

export function Testimonials() {
  return (
    <section className="py-20 px-4 md:px-8 bg-bg-warm">
      <div className="max-w-[1100px] mx-auto">
        <AnimatedSection direction="up">
          <div className="section-label">Depoimentos</div>
          <h2 className="section-title">Histórias de Transformação</h2>
        </AnimatedSection>
        <AnimatedSection direction="up" delay={0.15} staggerChildren={0.12} staggerType="premium" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {testimonials.map((t, i) => (
            <AnimatedItem key={i} direction="up" staggerType="premium">
              <GlassCard variant="strong" className="border-l-[3px] border-l-accent relative">
                <Quote className="w-6 h-6 text-accent/30 absolute top-4 right-4" />
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-txt-light leading-relaxed italic mb-3">&ldquo;{t.quote}&rdquo;</p>
                <div className="text-sm font-bold text-teal-dark">{t.author}</div>
                <div className="text-[0.68rem] text-txt-muted">{t.since}</div>
              </GlassCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
