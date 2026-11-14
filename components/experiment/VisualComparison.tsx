"use client";

import React, { useState } from "react";
import { ExperimentRecord } from "@/types/evidence";
import { VisualExperimentPackage } from "@/types/visualization";
import { FrameSequencePlayer } from "@/components/experiment/FrameSequencePlayer";
import { ExperimentApparatusDiagram } from "@/components/experiment/ExperimentApparatusDiagram";
import { AlertTriangle, CheckCircle2, XCircle, Info, ExternalLink } from "lucide-react";

interface VisualComparisonProps {
  exp1: ExperimentRecord;
  exp2: ExperimentRecord;
  visualPkg1?: VisualExperimentPackage;
}

export function VisualComparison({ exp1, exp2, visualPkg1 }: VisualComparisonProps) {
  const [viewMode1, setViewMode1] = useState<"footage" | "schematic">("footage");

  const sequenceAsset = visualPkg1?.assets.find((a) => a.id === "sofie-rtdfs-sequence");

  // Scientific Compatibility Evaluation
  const isScaleComparable = exp1.platform === exp2.platform;
  const isFuelComparable = exp1.material_class === exp2.material_class;
  const isFlowComparable = exp1.airflow_cm_s != null && exp2.airflow_cm_s != null;

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 space-y-6 text-xs shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#303741]">
        <div>
          <h3 className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
            Visual Comparison Lab & Compatibility Assessment
          </h3>
          <p className="text-xs text-[#A1AAB5] mt-0.5">
            Side-by-side scientific comparison distinguishing comparable physical parameters from unvalidated extrapolations.
          </p>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#15191F] text-[#E99847] border border-[#303741]">
          Dual Investigation View
        </span>
      </div>

      {/* Side-by-side Visual Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: SoFIE-GEL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#303741]">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[#78A9D8]">
                {exp1.programme} · {exp1.platform}
              </span>
              <h4 className="text-sm font-bold text-[#F3F5F7]">{exp1.investigation}</h4>
            </div>
            <div className="flex gap-1 text-[11px]">
              <button
                onClick={() => setViewMode1("footage")}
                className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                  viewMode1 === "footage"
                    ? "bg-[#0C0F13] text-[#5CB59B] border-[#5CB59B]"
                    : "bg-[#15191F] text-[#A1AAB5] border-[#303741]"
                }`}
              >
                Flight Footage
              </button>
              <button
                onClick={() => setViewMode1("schematic")}
                className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                  viewMode1 === "schematic"
                    ? "bg-[#0C0F13] text-[#E99847] border-[#E99847]"
                    : "bg-[#15191F] text-[#A1AAB5] border-[#303741]"
                }`}
              >
                Schematic
              </button>
            </div>
          </div>

          {viewMode1 === "footage" && sequenceAsset ? (
            <FrameSequencePlayer asset={sequenceAsset} />
          ) : (
            <ExperimentApparatusDiagram />
          )}

          <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#737F8C]">Fuel Material:</span>
              <span className="font-semibold text-[#F3F5F7]">{exp1.material}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737F8C]">Ventilation Airflow:</span>
              <span className="font-mono text-[#78A9D8]">{exp1.airflow_cm_s ?? "Not reported"} cm/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737F8C]">Atmosphere:</span>
              <span className="font-mono text-[#E99847]">{exp1.oxygen_pct}% O₂ ({exp1.pressure_kpa} kPa)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Saffire-I or second experiment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#303741]">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[#E99847]">
                {exp2.programme} · {exp2.platform}
              </span>
              <h4 className="text-sm font-bold text-[#F3F5F7]">{exp2.investigation}</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#15191F] text-[#A1AAB5] border border-[#303741]">
              Flight Investigation
            </span>
          </div>

          <div className="aspect-video w-full bg-[#0C0F13] rounded-xl border border-[#303741] p-4 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#737F8C] block">
              Vehicle-Scale Flow Duct Geometry
            </span>
            <div className="w-48 h-20 bg-[#15191F] rounded-lg border border-[#303741] flex items-center justify-center text-xs font-mono text-[#E99847] px-2">
              0.4 m x 1.0 m Fabric Sheet in Forced Airflow (20 cm/s)
            </div>
            <p className="text-[11px] text-[#A1AAB5] max-w-sm pt-1">
              {exp2.finding}
            </p>
          </div>

          <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#737F8C]">Fuel Material:</span>
              <span className="font-semibold text-[#F3F5F7]">{exp2.material}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737F8C]">Ventilation Airflow:</span>
              <span className="font-mono text-[#78A9D8]">{exp2.airflow_cm_s ?? "Not reported"} cm/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737F8C]">Atmosphere:</span>
              <span className="font-mono text-[#E99847]">{exp2.oxygen_pct}% O₂ ({exp2.pressure_kpa} kPa)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensional Comparability Matrix */}
      <div className="bg-[#15191F] p-4 rounded-xl border border-[#303741] space-y-3">
        <span className="text-[10px] uppercase font-mono font-bold text-[#F3F5F7] tracking-wider block">
          Dimensional Comparability Assessment
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#737F8C] font-semibold">Scale & Geometry:</span>
              {isScaleComparable ? (
                <span className="text-[#5CB59B] flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Compatible
                </span>
              ) : (
                <span className="text-[#D97777] flex items-center gap-1 font-mono text-[10px]">
                  <XCircle className="w-3 h-3" /> Scale Mismatch
                </span>
              )}
            </div>
            <p className="text-[#A1AAB5] text-[10px]">
              {isScaleComparable
                ? "Both investigations share identical chamber dimensions."
                : `Scale mismatch: CIR Glovebox (small slab) vs Cygnus tunnel (0.4m x 1m). Cannot transfer flame spread speed directly.`}
            </p>
          </div>

          <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#737F8C] font-semibold">Fuel Material:</span>
              {isFuelComparable ? (
                <span className="text-[#5CB59B] flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Matched Class
                </span>
              ) : (
                <span className="text-[#E99847] flex items-center gap-1 font-mono text-[10px]">
                  <AlertTriangle className="w-3 h-3" /> Cross-Material
                </span>
              )}
            </div>
            <p className="text-[#A1AAB5] text-[10px]">
              {isFuelComparable
                ? "Both fuels share polymer/textile pyrolysis kinetics."
                : `Comparing ${exp1.material_class.replace("_", " ")} to ${exp2.material_class.replace("_", " ")}. Burning mechanisms differ.`}
            </p>
          </div>

          <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#737F8C] font-semibold">Forced Ventilation:</span>
              {isFlowComparable ? (
                <span className="text-[#5CB59B] flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Quantified
                </span>
              ) : (
                <span className="text-[#D97777] flex items-center gap-1 font-mono text-[10px]">
                  <XCircle className="w-3 h-3" /> Unreported
                </span>
              )}
            </div>
            <p className="text-[#A1AAB5] text-[10px]">
              Flow velocities ({exp1.airflow_cm_s} vs {exp2.airflow_cm_s} cm/s) provide direct convective oxidizer comparison.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
