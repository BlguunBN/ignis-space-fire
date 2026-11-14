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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Side-by-Side Experiment Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Comparing experimental parameters, scale, observed findings, and safety relevance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table / Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40">
              <span className="text-xs uppercase font-bold text-blue-400 block">{exp1.programme}</span>
              <h3 className="text-base font-bold text-white mt-1">{exp1.investigation}</h3>
              <p className="text-xs text-slate-400">{exp1.platform}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40">
              <span className="text-xs uppercase font-bold text-purple-400 block">{exp2.programme}</span>
              <h3 className="text-base font-bold text-white mt-1">{exp2.investigation}</h3>
              <p className="text-xs text-slate-400">{exp2.platform}</p>
            </div>
          </div>

          {/* Parameters Comparison */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Experimental Boundary Conditions
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Material & Fuel Type</span>
                  <span className="font-semibold text-slate-200">{exp1.material}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Atmosphere (O₂ / Pressure)</span>
                  <span className="font-semibold text-slate-200">
                    {exp1.oxygen_pct}% O₂ {exp1.pressure_kpa ? `· ${exp1.pressure_kpa} kPa` : "· Pressure Unreported"}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Ventilation Airflow</span>
                  <span className="font-semibold text-slate-200">{exp1.airflow_cm_s} cm/s</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Measured Variables</span>
                  <span className="text-slate-300">{exp1.measurements.join(", ")}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Material & Fuel Type</span>
                  <span className="font-semibold text-slate-200">{exp2.material}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Atmosphere (O₂ / Pressure)</span>
                  <span className="font-semibold text-slate-200">
                    {exp2.oxygen_pct}% O₂ {exp2.pressure_kpa ? `· ${exp2.pressure_kpa} kPa` : "· Pressure Unreported"}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Ventilation Airflow</span>
                  <span className="font-semibold text-slate-200">{exp2.airflow_cm_s} cm/s</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Measured Variables</span>
                  <span className="text-slate-300">{exp2.measurements.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Experimental Findings
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                {exp1.finding}
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                {exp2.finding}
              </div>
            </div>
          </div>

          {/* Fire Safety Relevance */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400">
              Fire Safety Design Relevance
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-slate-300 leading-relaxed">
                {exp1.fire_safety_relevance}
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-slate-300 leading-relaxed">
                {exp2.fire_safety_relevance}
              </div>
            </div>
          </div>

          {/* Limitations */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Documented Limitations
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
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
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
            <a
              href={exp1.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Source: {exp1.psi_id || exp1.doi || "View Record"}
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={exp2.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
