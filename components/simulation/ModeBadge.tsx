"use client";

import React from "react";
import { SimulationMode } from "@/types/simulation";
import { Video, Cpu, Sparkles, Globe } from "lucide-react";

interface ModeBadgeProps {
  mode: SimulationMode;
  className?: string;
}

export function ModeBadge({ mode, className = "" }: ModeBadgeProps) {
  switch (mode) {
    case "observed":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 ${className}`}
          title="Direct time-stamped NASA flight or ground measurement record. No empirical parameters have been simulated."
        >
          <Video className="w-3.5 h-3.5 text-emerald-400" />
          <span>OBSERVED · NASA Recording</span>
        </span>
      );

    case "calibrated_model":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-950/70 text-blue-300 border border-blue-800/60 ${className}`}
          title="Bounded physics equation fitted to authentic NASA flight measurements with error metrics (RMSE/MAE)."
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>CALIBRATED MODEL · d² Law</span>
        </span>
      );

    case "conceptual":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60 ${className}`}
          title="Educational visualization illustrating physical tendencies (e.g. 0g vs 1g). Not a certified quantitative prediction."
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>CONCEPT MODEL · Educational</span>
        </span>
      );

    case "external_demo":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/70 text-purple-300 border border-purple-800/60 ${className}`}
          title="External simulation from MySimulator (CC BY 4.0). Independent educational model not calibrated with IGNIS NASA case data."
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>EXTERNAL DEMO · MySimulator</span>
        </span>
      );

    default:
      return null;
  }
}
