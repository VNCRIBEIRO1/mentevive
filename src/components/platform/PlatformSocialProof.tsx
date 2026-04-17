"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { AnimatedSection, AnimatedItem } from "@/components/landing";
import { Shield, Lock, Award } from "lucide-react";

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

const trustBadges = [
  { icon: Shield, label: "LGPD Compliant" },
  { icon: Lock, label: "Dados Criptografados" },
  { icon: Award, label: "CFP Regularizado" },
];

export function PlatformSocialProof() {
  const [stats, setStats] = useState([
    { value: 0, suffix: "+", label: "Profissionais ativos" },
    { value: 0, suffix: "+", label: "Sessões realizadas" },
    { value: 99, suffix: "%", label: "Uptime garantido", decimals: 0 },
    { value: 4.9, suffix: "/5", label: "Satisfação média", decimals: 1 },
  ]);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStats((prev) =>
            prev.map((s) => {
              if (s.label === "Profissionais ativos" && data.professionals > 0)
                return { ...s, value: data.professionals };
              if (s.label === "Sessões realizadas" && data.sessions > 0)
                return { ...s, value: data.sessions };
              return s;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Stats */}
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

        {/* Trust badges */}
        <AnimatedSection direction="up" className="flex flex-wrap items-center justify-center gap-6">
          {trustBadges.map(({ icon: Icon, label }) => (
            <AnimatedItem key={label}>
              <div className="flex items-center gap-2 text-sm text-foreground/50">
                <Icon size={16} className="text-teal/70" />
                {label}
              </div>
            </AnimatedItem>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
