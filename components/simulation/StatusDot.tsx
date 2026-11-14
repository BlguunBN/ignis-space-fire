"use client";

import React from "react";
import { ParameterStatus } from "@/types/simulation";

interface StatusDotProps {
  status: ParameterStatus;
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className = "" }: StatusDotProps) {
  const configs: Record<
    ParameterStatus,
    { dotColor: string; textColor: string; text: string; title: string }
  > = {
    measured: {
      dotColor: "bg-emerald-400",
      textColor: "text-emerald-400",
      text: "Measured",
      title: "Direct empirical measurement reported in NASA flight record.",
    },
    fitted: {
      dotColor: "bg-blue-400",
      textColor: "text-blue-400",
      text: "Fitted",
      title: "Statistically estimated parameter via regression over NASA measurements.",
    },
    user_assumption: {
      dotColor: "bg-amber-400",
      textColor: "text-amber-400",
      text: "Assumed",
      title: "User-adjustable assumption constrained within experimentally verified bounds.",
    },
    unsupported: {
      dotColor: "bg-zinc-500",
      textColor: "text-zinc-400",
      text: "Unsupported / Locked",
      title: "Condition unsupported by indexed evidence or physical laws. Locked to prevent ungrounded predictions.",
    },
  };

  const config = configs[status] || configs.unsupported;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${className}`}
      title={config.title}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} shrink-0`} />
      <span className={config.textColor}>{label || config.text}</span>
    </span>
  );
}
