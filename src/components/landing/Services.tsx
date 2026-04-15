import { Leaf, Brain, HeartCrack, MonitorSmartphone, Heart, Sprout } from "lucide-react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { GlassCard } from "./GlassCard";
import type { ReactNode } from "react";

const services: { icon: ReactNode; title: string; time: string; desc: string }[] = [
  { icon: <Leaf className="w-7 h-7 text-teal" />, title: "Terapia Individual Online", time: "50 min", desc: "Sessões semanais por videochamada com escuta sensível e profunda. Abordagem baseada em ACT para autoconhecimento e acolhimento." },
  { icon: <Brain className="w-7 h-7 text-teal" />, title: "Ansiedade & Depressão", time: "50 min", desc: "Tratamento especializado com certificação Albert Einstein. Técnicas de ACT e mindfulness para manejo do sofrimento emocional." },
  { icon: <HeartCrack className="w-7 h-7 text-teal" />, title: "Tratamento de Traumas", time: "50 min", desc: "Reprocessamento de experiências traumáticas com abordagem segura e acolhedora. Resgate da sua narrativa de vida." },
  { icon: <MonitorSmartphone className="w-7 h-7 text-teal" />, title: "Criadores de Conteúdo", time: "50 min", desc: "Atendimento especializado para quem vive da internet. Burnout digital, exposição, ansiedade de performance." },
  { icon: <Heart className="w-7 h-7 text-teal" />, title: "Terapia de Casal", time: "60 min", desc: "Para casais que buscam fortalecer a comunicação, resolver conflitos e construir uma relação mais saudável." },
  { icon: <Sprout className="w-7 h-7 text-teal" />, title: "Autoconhecimento", time: "60 min", desc: "Jornada de autodescoberta guiada por ACT. Reconecte-se com seus valores, fortaleça limites e construa uma vida com mais sentido." },
];

export function Services() {
  return (
    <section className="py-20 px-4 md:px-8 bg-bg-warm" id="servicos">
      <div className="max-w-[1100px] mx-auto">
        <AnimatedSection direction="up">
          <div className="section-label">Serviços</div>
          <h2 className="section-title">Modalidades de Atendimento</h2>
        </AnimatedSection>
        <AnimatedSection direction="up" delay={0.15} staggerChildren={0.1} staggerType="premium" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {services.map((s, i) => (
            <AnimatedItem key={i} direction="up" staggerType="premium">
              <GlassCard className="border-t-[3px] border-t-transparent hover:border-t-teal transition-colors h-full">
                <div className="mb-3">{s.icon}</div>
                <h3 className="font-heading text-base font-semibold mb-1">{s.title}</h3>
                <div className="text-sm font-bold text-teal-dark mb-2">{s.time}</div>
                <p className="text-xs text-txt-light leading-relaxed">{s.desc}</p>
              </GlassCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
