"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface PortalPageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Accent gradient direction */
  gradient?: "teal" | "primary" | "accent";
  action?: ReactNode;
}

const gradients = {
  teal: "from-teal/8 via-teal/4 to-transparent border-teal/10",
  primary: "from-primary/8 via-primary/4 to-transparent border-primary/10",
  accent: "from-accent/8 via-accent/4 to-transparent border-accent/10",
};

const iconBg = {
  teal: "bg-teal/12 text-teal-dark",
  primary: "bg-primary/12 text-primary-dark",
  accent: "bg-accent/12 text-accent",
};

export function PortalPageHeader({ icon, title, subtitle, gradient = "teal", action }: PortalPageHeaderProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-gradient-to-r ${gradients[gradient]} rounded-2xl border p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg[gradient]} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-txt">{title}</h1>
          {subtitle && <p className="text-sm text-txt-light mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </motion.div>
  );
}
