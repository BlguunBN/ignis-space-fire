"use client";

import React from "react";
import { Representation } from "@/types/visualization";
import { Camera, FileText, BarChart3, Eye, Compass, Lightbulb } from "lucide-react";

interface RepresentationBadgeProps {
  type: Representation;
  intervalSeconds?: number | null;
}

export function RepresentationBadge({ type, intervalSeconds }: RepresentationBadgeProps) {
  switch (type) {
    case "original_media":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#5CB59B]/15 text-[#5CB59B] border border-[#5CB59B]/40 font-mono">
          <Camera className="w-3.5 h-3.5" />
          <span>Original NASA Flight Footage</span>
          {intervalSeconds != null && (
            <span className="text-[#A1AAB5] text-[10px] pl-1 font-normal">
              (~{intervalSeconds}s interval)
            </span>
          )}
        </span>
      );
    case "source_figure":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#78A9D8]/15 text-[#78A9D8] border border-[#78A9D8]/40 font-mono">
          <FileText className="w-3.5 h-3.5" />
          <span>Paper Source Figure</span>
        </span>
      );
    case "derived_plot":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E99847]/15 text-[#E99847] border border-[#E99847]/40 font-mono">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Derived Measurement Plot</span>
        </span>
      );
    case "annotated_media":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/40 font-mono">
          <Eye className="w-3.5 h-3.5" />
          <span>Annotated NASA Imagery</span>
        </span>
      );
    case "schematic":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1B2027] text-[#A1AAB5] border border-[#303741] font-mono">
          <Compass className="w-3.5 h-3.5 text-[#E99847]" />
          <span>Apparatus Layout Schematic</span>
        </span>
      );
    case "concept_animation":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 font-mono">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Explanatory Concept Illustration</span>
        </span>
      );
  }
}
