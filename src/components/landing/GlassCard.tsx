import { type ReactNode } from "react";

type GlassVariant = "default" | "strong" | "glow";

interface GlassCardProps {
  children: ReactNode;
  variant?: GlassVariant;
  className?: string;
  hover?: boolean;
}

const variantClasses: Record<GlassVariant, string> = {
  default: "glass",
  strong: "glass-strong",
  glow: "glass-glow",
};

export function GlassCard({
  children,
  variant = "default",
  className = "",
  hover = true,
}: GlassCardProps) {
  const hoverClass = hover
    ? "transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5"
    : "";

  return (
    <div
      className={`${variantClasses[variant]} rounded-2xl p-6 ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
