"use client";

import React from "react";
import { ExperimentRecord } from "@/types/evidence";
import { ExternalLink, AlertTriangle, ShieldCheck, CheckCircle2, FileText, Database } from "lucide-react";

interface ConditionInspectorProps {
  experiment: ExperimentRecord;
}

export function ConditionInspector({ experiment }: ConditionInspectorProps) {
  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 text-xs space-y-4 shadow-sm">
      {/* Header */}
      <div className="border-b border-[#303741] pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#15191F] text-[#78A9D8] border border-[#303741] font-mono">
            {experiment.programme}
          </span>
          {experiment.verification_status === "verified" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#5CB59B] font-mono">
              <CheckCircle2 className="w-3 h-3" /> verified NASA record
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-[#F3F5F7]">{experiment.investigation}</h3>
        <p className="text-[11px] text-[#A1AAB5]">{experiment.platform}</p>
      </div>

      {/* Reported Boundary Conditions */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#737F8C] block">
          Reported Experimental Conditions
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741]">
            <span className="text-[#737F8C] block text-[9px] uppercase font-mono font-semibold">Fuel Material</span>
            <span className="font-medium text-[#F3F5F7]">{experiment.material}</span>
          </div>

          <div className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741]">
            <span className="text-[#737F8C] block text-[9px] uppercase font-mono font-semibold">Atmosphere (O₂ / Press)</span>
            <span className="font-medium text-[#F3F5F7]">
              {experiment.oxygen_pct != null ? `${experiment.oxygen_pct}% O₂` : "Not reported"}
              {experiment.pressure_kpa != null ? ` · ${experiment.pressure_kpa} kPa` : ""}
            </span>
          </div>

          <div className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741]">
            <span className="text-[#737F8C] block text-[9px] uppercase font-mono font-semibold">Ventilation Velocity</span>
            <span className="font-medium text-[#78A9D8]">
              {experiment.airflow_cm_s != null ? `${experiment.airflow_cm_s} cm/s` : "Not reported"}
            </span>
          </div>

          <div className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741]">
            <span className="text-[#737F8C] block text-[9px] uppercase font-mono font-semibold">Gravity Regime</span>
            <span className="font-medium text-[#5CB59B]">{experiment.gravity}</span>
          </div>
        </div>
      </div>

      {/* Observed Scientific Finding */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#737F8C] block">
          Observed Scientific Finding
        </span>
        <p className="bg-[#15191F] p-3 rounded-lg border border-[#303741] text-[#F3F5F7] leading-relaxed">
          {experiment.finding}
        </p>
      </div>

      {/* Fire Safety Significance */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#E99847] block">
          Spacecraft Fire Safety Significance
        </span>
        <p className="bg-[#15191F] p-3 rounded-lg border border-[#303741] text-[#A1AAB5] leading-relaxed">
          {experiment.fire_safety_relevance}
        </p>
      </div>

      {/* Limitations & Boundary Warning */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#D97777] flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Documented Empirical Limitations
        </span>
        <ul className="list-disc pl-4 text-[#A1AAB5] space-y-1 text-[11px]">
          {experiment.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>

      {/* Source & Citation Links */}
      <div className="pt-3 border-t border-[#303741] space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#737F8C] block">
          Provenance & NASA Citations
        </span>

        {experiment.source_locator && (
          <div className="text-[11px] text-[#A1AAB5] bg-[#0C0F13] p-2 rounded border border-[#303741]">
            <strong className="text-[#F3F5F7]">Source Locator: </strong>
            <span className="font-mono text-[#78A9D8]">{experiment.source_locator}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] pt-1">
          <a
            href={experiment.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#78A9D8] hover:text-[#F3F5F7] inline-flex items-center gap-1 font-semibold transition"
          >
            <Database className="w-3.5 h-3.5" />
            {experiment.psi_id ? `NASA PSI ${experiment.psi_id}` : "Open NASA Primary Source"}
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>

          {experiment.doi && (
            <span className="font-mono text-[10px] text-[#737F8C]">DOI: {experiment.doi}</span>
          )}
        </div>
      </div>
    </div>
  );
}
