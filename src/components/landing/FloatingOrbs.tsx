"use client";
import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface FloatingOrbsProps {
  className?: string;
}

const orbs = [
  {
    color: "bg-primary/10",
    size: "w-72 h-72",
    blur: "blur-[120px]",
    radius: "rounded-[42%_58%_55%_45%]",
    speed: "animate-liquid-float",
    offset: { top: "-5%", left: "10%" },
  },
  {
    color: "bg-teal/8",
    size: "w-96 h-96",
    blur: "blur-[140px]",
    radius: "rounded-[55%_45%_48%_52%]",
    speed: "animate-float",
    offset: { top: "30%", right: "5%" },
  },
  {
    color: "bg-accent/8",
    size: "w-64 h-64",
    blur: "blur-[100px]",
    radius: "rounded-[48%_52%_60%_40%]",
    speed: "animate-liquid-float",
    offset: { bottom: "10%", left: "25%" },
  },
];

export function FloatingOrbs({ className = "" }: FloatingOrbsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 60, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 30 });

  useEffect(() => {
    if (shouldReduceMotion) return;

    function handleMouseMove(e: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set((e.clientX - cx) * 0.02);
      mouseY.set((e.clientY - cy) * 0.02);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [shouldReduceMotion, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={`absolute ${orb.size} ${orb.color} ${orb.blur} ${orb.radius} ${orb.speed} opacity-[0.12]`}
          style={{
            ...orb.offset,
            transform: shouldReduceMotion
              ? undefined
              : `translate(${springX.get()}px, ${springY.get()}px)`,
          }}
        />
      ))}
    </div>
  );
}
