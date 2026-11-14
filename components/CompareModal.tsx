"use client";

import React from "react";
import { ExperimentRecord } from "@/types/evidence";
import { X, ExternalLink, AlertTriangle, ShieldCheck } from "lucide-react";

interface CompareModalProps {
  exp1: ExperimentRecord;
  exp2: ExperimentRecord;
  onClose: () => void;
}

export function CompareModal({ exp1, exp2, onClose }: CompareModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1B2027] border border-[#303741] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#303741] flex items-center justify-between bg-[#15191F]">
          <div>
            <h2 className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
              Side-by-Side NASA Flight Comparison
            </h2>
            <p className="text-xs text-[#A1AAB5] mt-0.5">
              Contrasting scale, experimental conditions, observed findings, and safety relevance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1B2027] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Table / Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#F3F5F7]">
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4 border-b border-[#303741] pb-4">
            <div className="bg-[#15191F] p-3.5 rounded-xl border border-[#303741]">
              <span className="text-[10px] uppercase font-bold text-[#78A9D8] block font-mono">
                {exp1.programme}
              </span>
              <h3 className="text-sm font-bold text-[#F3F5F7] mt-1">{exp1.investigation}</h3>
              <p className="text-[11px] text-[#A1AAB5]">{exp1.platform}</p>
            </div>
            <div className="bg-[#15191F] p-3.5 rounded-xl border border-[#303741]">
              <span className="text-[10px] uppercase font-bold text-[#E99847] block font-mono">
                {exp2.programme}
              </span>
              <h3 className="text-sm font-bold text-[#F3F5F7] mt-1">{exp2.investigation}</h3>
              <p className="text-[11px] text-[#A1AAB5]">{exp2.platform}</p>
            </div>
          </div>

          {/* Parameters Comparison */}
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#737F8C]">
              Reported Experimental Conditions
            </h4>

            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-2">
                <div className="bg-[#0C0F13] p-2.5 rounded border border-[#303741]">
                  <span className="text-[#737F8C] block text-[9px] uppercase font-semibold">Material</span>
                  <span className="font-medium text-[#F3F5F7]">{exp1.material}</span>
                </div>
                <div className="bg-[#0C0F13] p-2.5 rounded border border-[#303741]">
                  <span className="text-[#737F8C] block text-[9px] uppercase font-semibold">Atmosphere (O₂ / Press)</span>
                  <span className="font-medium text-[#F3F5F7]">
                    {exp1.oxygen_pct != null ? `${exp1.oxygen_pct}% O₂` : "Not reported"}
                    {exp1.pressure_kpa != null ? ` · ${exp1.pressure_kpa} kPa` : " · Pressure not reported"}
                  </span>
                </div>
                <div className="bg-[#0C0F13] p-2.5 rounded border border-[#303741]">
                  <span className="text-[#737F8C] block text-[9px] uppercase font-semibold">Airflow Velocity</span>
                  <span className="font-medium text-[#78A9D8]">
                    {exp1.airflow_cm_s != null ? `${exp1.airflow_cm_s} cm/s` : "Not reported"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-[#0C0F13] p-2.5 rounded border border-[#303741]">
                  <span className="text-[#737F8C] block text-[9px] uppercase font-semibold">Material</span>
                  <span className="font-medium text-[#F3F5F7]">{exp2.material}</span>
                </div>
                <div className="bg-[#0C0F13] p-2.5 rounded border border-[#303741]">
                  <span className="text-[#737F8C] block text-[9px] uppercase font-semibold">Atmosphere (O₂ / Press)</span>
                  <span className="font-medium text-[#F3F5F7]">
                    {exp2.oxygen_pct != null ? `${exp2.oxygen_pct}% O₂` : "Not reported"}
                    {exp2.pressure_kpa != null ? ` · ${exp2.pressure_kpa} kPa` : " · Pressure not reported"}
                  </span>
                </div>
                <div className="bg-[#0C0F13] p-2.5 rounded border border-[#303741]">
                  <span className="text-[#737F8C] block text-[9px] uppercase font-semibold">Airflow Velocity</span>
                  <span className="font-medium text-[#78A9D8]">
                    {exp2.airflow_cm_s != null ? `${exp2.airflow_cm_s} cm/s` : "Not reported"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Observed Findings */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#737F8C]">
              Observed Scientific Findings
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#15191F] rounded-lg border border-[#303741] text-[#A1AAB5] leading-relaxed">
                {exp1.finding}
              </div>
              <div className="p-3 bg-[#15191F] rounded-lg border border-[#303741] text-[#A1AAB5] leading-relaxed">
                {exp2.finding}
              </div>
            </div>
          </div>

          {/* Fire Safety Relevance */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#E99847]">
              Fire Safety Design Significance
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#15191F] border border-[#303741] rounded-lg text-[#F3F5F7] leading-relaxed">
                {exp1.fire_safety_relevance}
              </div>
              <div className="p-3 bg-[#15191F] border border-[#303741] rounded-lg text-[#F3F5F7] leading-relaxed">
                {exp2.fire_safety_relevance}
              </div>
            </div>
          </div>

          {/* Limitations */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#D97777] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Documented Limitations
            </h4>
            <div className="grid grid-cols-2 gap-4 text-[11px] text-[#A1AAB5]">
              <ul className="list-disc pl-4 space-y-1">
                {exp1.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
              <ul className="list-disc pl-4 space-y-1">
                {exp2.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Provenance links */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#303741] text-[11px]">
            <a
              href={exp1.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#78A9D8] hover:text-[#F3F5F7] flex items-center gap-1 font-medium"
            >
              Source: {exp1.psi_id || exp1.doi || "View Record"}
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={exp2.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#78A9D8] hover:text-[#F3F5F7] flex items-center gap-1 font-medium"
            >
              Source: {exp2.psi_id || exp2.doi || "View Record"}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
