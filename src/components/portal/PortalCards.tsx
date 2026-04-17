"use client";
import { motion, useReducedMotion } from "framer-motion";

interface PortalStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: "teal" | "primary" | "accent" | "green" | "yellow";
  delay?: number;
}

const colorMap = {
  teal:    { bg: "bg-teal/8",    ring: "ring-teal/20",    icon: "bg-teal/15 text-teal",    value: "text-teal-dark" },
  primary: { bg: "bg-primary/8",  ring: "ring-primary/20",  icon: "bg-primary/15 text-primary-dark", value: "text-primary-dark" },
  accent:  { bg: "bg-accent/8",   ring: "ring-accent/20",   icon: "bg-accent/15 text-accent",  value: "text-accent" },
  green:   { bg: "bg-emerald-50", ring: "ring-emerald-100",  icon: "bg-emerald-100 text-emerald-600", value: "text-emerald-600" },
  yellow:  { bg: "bg-amber-50",   ring: "ring-amber-100",   icon: "bg-amber-100 text-amber-600", value: "text-amber-600" },
};

export function PortalStatCard({ icon, label, value, subtitle, color, delay = 0 }: PortalStatCardProps) {
  const reduce = useReducedMotion();
  const c = colorMap[color];

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`${c.bg} rounded-2xl p-5 ring-1 ${c.ring} relative overflow-hidden group transition-all duration-300 hover:shadow-warm-md hover:-translate-y-0.5`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-card/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${c.icon} mb-3`}>
          {icon}
        </div>
        <p className="text-xs text-txt-muted font-medium tracking-wide uppercase">{label}</p>
        <p className={`text-2xl font-bold ${c.value} mt-1`}>{value}</p>
        {subtitle && <p className="text-xs text-txt-muted mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

/* Quick action card — used in portal dashboard */
interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "teal" | "primary" | "accent";
  delay?: number;
}

const actionColors = {
  teal:    "border-teal/15 hover:border-teal/40 hover:bg-teal/5",
  primary: "border-primary/15 hover:border-primary/40 hover:bg-primary/5",
  accent:  "border-accent/15 hover:border-accent/40 hover:bg-accent/5",
};

const actionIconColors = {
  teal:    "bg-teal/10 text-teal-dark",
  primary: "bg-primary/10 text-primary-dark",
  accent:  "bg-accent/10 text-accent",
};

export function QuickAction({ href, icon, title, description, color, delay = 0 }: QuickActionProps) {
  const reduce = useReducedMotion();

  return (
    <motion.a
      href={href}
      initial={reduce ? {} : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 ${actionColors[color]} transition-all duration-300 group`}
    >
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${actionIconColors[color]} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-txt group-hover:text-txt truncate">{title}</p>
        <p className="text-xs text-txt-muted mt-0.5 truncate">{description}</p>
      </div>
      <svg className="w-4 h-4 text-txt-muted ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.a>
  );
}
