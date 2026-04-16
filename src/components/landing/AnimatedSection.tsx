"use client";
import { motion, useReducedMotion, type Variant, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "scale";
type StaggerType = "gentle" | "premium";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  staggerType?: StaggerType;
  staggerChildren?: number;
  once?: boolean;
}

const directionVariants: Record<Direction, { hidden: Variant; visible: Variant }> = {
  up: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
};

const transitionPresets: Record<StaggerType, object> = {
  gentle: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  premium: { type: "spring", stiffness: 80, damping: 20 },
};

export function AnimatedSection({
  children,
  className = "",
  direction = "up",
  delay = 0,
  staggerType = "gentle",
  staggerChildren = 0.1,
  once = true,
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const { hidden, visible } = directionVariants[direction];
  const transition = transitionPresets[staggerType];

  const containerVariants = {
    hidden,
    visible: {
      ...(visible as Record<string, unknown>),
      transition: {
        ...transition,
        delay,
        staggerChildren,
      },
    },
  } satisfies Variants;

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.05 }}
    >
      {children}
    </motion.div>
  );
}

/* Child wrapper — use inside AnimatedSection for stagger effect */
export function AnimatedItem({
  children,
  className = "",
  direction = "up",
  staggerType = "gentle",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  staggerType?: StaggerType;
}) {
  const { hidden, visible } = directionVariants[direction];
  const transition = transitionPresets[staggerType];

  return (
    <motion.div
      className={className}
      variants={{
        hidden,
        visible: { ...(visible as Record<string, unknown>), transition },
      }}
    >
      {children}
    </motion.div>
  );
}
