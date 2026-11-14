"use client";

import { motion, useReducedMotion } from "motion/react";
import { ReactNode, useEffect, useState } from "react";

interface StatusPulseProps {
  label?: ReactNode;
  className?: string;
  /** Dot colour, e.g. "bg-amber-400" or "bg-emerald-500". */
  dotClassName?: string;
  /** Expanding ring colour. */
  ringClassName?: string;
}

/**
 * Small dot with a soft expanding ring for "work in progress" indicators (no gradients).
 *
 * Server and client must render the same DOM on first paint, so the ring is
 * only added after hydration; it is skipped entirely when the user prefers
 * reduced motion.
 */
export function StatusPulse({
  label,
  className,
  dotClassName = "bg-amber-400",
  ringClassName = "bg-amber-400/50",
}: StatusPulseProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
        {mounted && !reduced && (
          <motion.span
            className={`absolute inset-0 rounded-full ${ringClassName}`}
            animate={{ scale: [1, 1.8], opacity: [0.45, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className={`relative h-2 w-2 rounded-full ${dotClassName}`} />
      </span>
      {label}
    </span>
  );
}
