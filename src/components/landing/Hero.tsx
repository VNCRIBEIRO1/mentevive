"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { FloatingOrbs } from "./FloatingOrbs";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-4 md:px-8 pt-28 pb-16 relative overflow-hidden">
      <FloatingOrbs className="z-0" />

      <motion.div
        className="relative z-10 max-w-[650px]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          className="glass inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-teal-dark mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 20 }}
        >
          <Leaf className="w-3.5 h-3.5 text-teal" /> Beatriz (Bea) · Psicóloga Clínica — +3500 atendimentos
        </motion.div>

        <motion.h1
          className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Especialista no{" "}
          <span className="text-teal-dark">emocional</span> de quem vive da{" "}
          <span className="text-accent">internet</span>
        </motion.h1>

        <motion.p
          className="text-base text-txt-light max-w-[500px] mx-auto mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          Terapia online acolhedora com escuta sensível. Sem pressa, sem moldes, sem máscaras. Cada história merece ser acolhida de verdade.
        </motion.p>

        <motion.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <a href="#agendamento" className="btn-brand-primary">
            <Leaf className="w-4 h-4" /> Agendar Sessão
          </a>
          <a href="#sobre" className="btn-brand-outline">Conheça a Profissional</a>
        </motion.div>

        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          {[
            { src: "/bia.png", alt: "Beatriz — Psicóloga Clínica Psicolobia", delay: 0.6, mt: "" },
            { src: "/bia2.png", alt: "Beatriz — Atendimento Online", delay: 0.7, mt: "mt-6" },
            { src: "/bia3.webp", alt: "Beatriz — Consultório Psicolobia", delay: 0.8, mt: "" },
          ].map((img) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: img.delay, type: "spring", stiffness: 80, damping: 20 }}
              className={img.mt}
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={140}
                height={180}
                className="rounded-[20px] shadow-warm-lg object-cover w-[140px] h-[180px] hover:shadow-warm-xl transition-shadow duration-300"
                priority={img.src === "/bia.png"}
                loading={img.src === "/bia.png" ? undefined : "lazy"}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
