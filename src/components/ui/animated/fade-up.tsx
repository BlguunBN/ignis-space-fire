"use client";

import { motion, useReducedMotion } from "motion/react";
import { ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  /** Entrance delay in seconds. Ignored when the user prefers reduced motion. */
  delay?: number;
  className?: string;
}

/**
 * Subtle fade + 8px rise entrance (300ms ease-out).
 * Renders children immediately when the user prefers reduced motion.
 */
export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
