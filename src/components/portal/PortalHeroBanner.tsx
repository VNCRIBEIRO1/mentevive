"use client";
import { motion, useReducedMotion } from "framer-motion";
import { LeafCluster } from "./PortalIllustrations";

interface PortalHeroBannerProps {
  greeting: string;
  subtitle: string;
  /** Optional right-side highlight (e.g. next session info) */
  highlight?: React.ReactNode;
}

export function PortalHeroBanner({ greeting, subtitle, highlight }: PortalHeroBannerProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/90 via-teal-dark/85 to-primary-dark/70" />

      {/* Decorative elements */}
      <LeafCluster className="absolute -right-6 -top-6 w-44 h-44 opacity-40 pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-accent/10 blur-2xl" />
      <div className="absolute right-20 bottom-0 w-28 h-28 rounded-full bg-primary/15 blur-xl" />

      {/* Floating dots pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" aria-hidden="true">
        <pattern id="portal-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#portal-dots)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.h1
            className="font-heading text-2xl md:text-3xl font-bold text-white leading-snug"
            initial={reduce ? {} : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {greeting}
          </motion.h1>
          <motion.p
            className="text-white/75 text-sm mt-2 max-w-md"
            initial={reduce ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {highlight && (
          <motion.div
            initial={reduce ? {} : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 120, damping: 20 }}
            className="glass-strong rounded-xl px-5 py-4 min-w-[200px]"
          >
            {highlight}
          </motion.div>
        )}
      </div>
    </div>
  );
}
