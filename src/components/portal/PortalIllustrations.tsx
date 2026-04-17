"use client";
import { motion, useReducedMotion } from "framer-motion";

/* ── Warm abstract shapes used as decorative backgrounds ── */

/** Floating botanical leaf cluster — used in portal hero banner */
export function LeafCluster({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="leaf-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="leaf-g2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5B9BD5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E8A0BF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <motion.path
        d="M100 20 C120 50, 170 60, 160 100 C150 140, 110 160, 100 180 C90 160, 50 140, 40 100 C30 60, 80 50, 100 20Z"
        fill="url(#leaf-g1)"
        animate={reduce ? {} : { rotate: [0, 3, -2, 0], scale: [1, 1.02, 0.99, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M60 80 C80 60, 130 70, 140 90 C150 110, 120 140, 100 130 C80 120, 40 100, 60 80Z"
        fill="url(#leaf-g2)"
        animate={reduce ? {} : { rotate: [0, -2, 3, 0], y: [0, -3, 2, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="130" cy="50" r="12"
        fill="#E8A0BF" fillOpacity="0.18"
        animate={reduce ? {} : { scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="60" cy="140" r="8"
        fill="#5B9BD5" fillOpacity="0.2"
        animate={reduce ? {} : { scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </svg>
  );
}

/** Soft wave background — used behind stats cards */
export function WaveBackground({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wave-portal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5B9BD5" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#0f766e" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#E8A0BF" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120Z" fill="url(#wave-portal)" />
      <path d="M0,80 C300,40 600,100 900,50 C1050,30 1150,70 1200,80 L1200,120 L0,120Z" fill="url(#wave-portal)" opacity="0.5" />
    </svg>
  );
}

/** Heartbeat/growth line — used in evolution page */
export function GrowthLine({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="growth-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#5B9BD5" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <motion.path
        d="M10,45 Q40,45 60,35 T110,25 T160,30 T210,15 T260,20 T290,10"
        stroke="url(#growth-g)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={reduce ? {} : { pathLength: 0 }}
        animate={reduce ? {} : { pathLength: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.circle
        cx="290" cy="10" r="4"
        fill="#0f766e"
        initial={reduce ? {} : { scale: 0, opacity: 0 }}
        animate={reduce ? {} : { scale: 1, opacity: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 200 }}
      />
    </svg>
  );
}

/** Abstract warm circle cluster — decorative portal background element */
export function WarmCircles({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <motion.circle
        cx="150" cy="150" r="120"
        fill="#5B9BD5" fillOpacity="0.06"
        animate={reduce ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="180" cy="120" r="80"
        fill="#E8A0BF" fillOpacity="0.06"
        animate={reduce ? {} : { scale: [1, 1.08, 1], x: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="120" cy="180" r="60"
        fill="#0f766e" fillOpacity="0.05"
        animate={reduce ? {} : { scale: [1, 1.1, 1], y: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
}

/** Portal mockup frame — a simple device frame for landing page showcase */
export function DeviceFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Browser chrome */}
      <div className="bg-card/80 backdrop-blur-sm rounded-t-2xl border border-white/40 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300/60" />
        </div>
        <div className="flex-1 mx-3">
          <div className="bg-gray-100/80 rounded-md px-3 py-1 text-[10px] text-txt-muted text-center font-mono">
            mentevive.vercel.app/portal
          </div>
        </div>
      </div>
      {/* Content area */}
      <div className="bg-bg/90 backdrop-blur-sm rounded-b-2xl border border-t-0 border-white/40 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
