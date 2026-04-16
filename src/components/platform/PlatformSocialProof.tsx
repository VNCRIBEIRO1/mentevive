"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/landing";

const stats = [
  { value: 50, suffix: "+", label: "Profissionais ativos" },
  { value: 1200, suffix: "+", label: "Sessões realizadas" },
  { value: 99, suffix: "%", label: "Uptime garantido" },
  { value: 4.9, suffix: "/5", label: "Satisfação média", decimals: 1 },
];

function AnimatedNumber({
  value,
  suffix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      current += increment;
      if (frame >= steps) {
        setDisplay(decimals > 0 ? value.toFixed(decimals) : String(value));
        clearInterval(interval);
      } else {
        setDisplay(
          decimals > 0 ? current.toFixed(decimals) : String(Math.floor(current))
        );
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isInView, value, decimals]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function PlatformSocialProof() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection
          direction="up"
          staggerChildren={0.1}
          className="glass-strong rounded-2xl p-8 sm:p-10 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat) => (
            <AnimatedItem key={stat.label}>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-heading font-bold text-teal">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </p>
                <p className="mt-2 text-sm text-foreground/60">{stat.label}</p>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
