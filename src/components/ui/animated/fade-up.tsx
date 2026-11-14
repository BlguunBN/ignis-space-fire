"use client";

import { motion, useReducedMotion } from "motion/react";
import { ReactNode, useEffect, useState } from "react";

interface FadeUpProps {
  children: ReactNode;
  /** Entrance delay in seconds. Ignored when the user prefers reduced motion. */
  delay?: number;
  className?: string;
}

/**
 * Subtle fade + 8px rise entrance (300ms ease-out).
 *
 * Server and client must render the same DOM on first paint, so the plain
 * div is used until after hydration; the animated motion.div mounts then.
 * The animation is skipped entirely when the user prefers reduced motion.
 */
export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || reduced) {
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
