"use client";

import React, { useState } from "react";
import { RankedEvidence } from "@/types/evidence";
import { ExternalLink, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Scale, CheckCircle2 } from "lucide-react";

interface EvidenceCardProps {
  evidence: RankedEvidence;
  rank: number;
  isSelectedForCompare: boolean;
  onToggleCompare: (id: string) => void;
}

export function EvidenceCard({
  evidence,
  rank,
  isSelectedForCompare,
  onToggleCompare,
}: EvidenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { experiment, score, confidenceLevel, breakdown } = evidence;

  const scoreBadgeColor =
    score >= 80
      ? "bg-[#5CB59B]/10 text-[#5CB59B] border-[#5CB59B]/30"
      : score >= 60
      ? "bg-[#E99847]/10 text-[#E99847] border-[#E99847]/30"
      : "bg-[#737F8C]/10 text-[#A1AAB5] border-[#303741]";

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-4.5 hover:border-[#737F8C] transition text-xs space-y-3.5 shadow-sm">
      {/* Top Header: Rank, Programme, Investigation, Relevance Score */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded bg-[#15191F] border border-[#303741] text-[#E99847] font-bold text-xs shrink-0 font-mono">
            {rank}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#15191F] text-[#78A9D8] border border-[#303741] font-mono">
                {experiment.programme}
              </span>
              <span className="text-[11px] text-[#A1AAB5]">{experiment.platform}</span>
              {experiment.verification_status === "verified" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#5CB59B] font-mono">
                  <CheckCircle2 className="w-3 h-3" /> verified source
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-[#F3F5F7] mt-1">
              {experiment.investigation}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleCompare(experiment.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
              isSelectedForCompare
                ? "bg-[#E99847] text-[#0C0F13] border-[#E99847] font-semibold"
                : "bg-[#15191F] text-[#A1AAB5] border-[#303741] hover:text-[#F3F5F7]"
            }`}
          >
            <Scale className="w-3 h-3" />
            {isSelectedForCompare ? "Selected" : "Compare"}
          </button>

          <div className={`px-2.5 py-1 rounded-lg border flex flex-col items-end ${scoreBadgeColor}`}>
            <span className="text-sm font-extrabold font-mono tabular-nums">{score}%</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold font-mono">
              {confidenceLevel} RELEVANCE
            </span>
          </div>
        </div>
      </div>

      {/* Match Reasons */}
      {breakdown.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {breakdown.reasons.map((r, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded bg-[#15191F] text-[#5CB59B] border border-[#303741] flex items-center gap-1"
            >
              <ShieldCheck className="w-2.5 h-2.5 text-[#5CB59B]" />
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Observed Parameters Matrix (with Not reported handling) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741] text-[11px]">
        <div>
          <span className="text-[#737F8C] block text-[9px] uppercase font-semibold font-mono">Material</span>
          <span className="font-medium text-[#F3F5F7]">{experiment.material}</span>
        </div>
        <div>
          <span className="text-[#737F8C] block text-[9px] uppercase font-semibold font-mono">Atmosphere</span>
          <span className="font-medium text-[#F3F5F7]">
            {experiment.oxygen_pct != null ? `${experiment.oxygen_pct}% O₂` : "Not reported"}
            {experiment.pressure_kpa != null ? ` · ${experiment.pressure_kpa} kPa` : ""}
          </span>
        </div>
        <div>
          <span className="text-[#737F8C] block text-[9px] uppercase font-semibold font-mono">Airflow Velocity</span>
          <span className="font-medium text-[#78A9D8]">
            {experiment.airflow_cm_s != null ? `${experiment.airflow_cm_s} cm/s` : "Not reported"}
          </span>
        </div>
        <div>
          <span className="text-[#737F8C] block text-[9px] uppercase font-semibold font-mono">Gravity Regime</span>
          <span className="font-medium text-[#A1AAB5]">{experiment.gravity}</span>
        </div>
      </div>

      {/* Primary Finding */}
      <p className="text-[#A1AAB5] leading-relaxed">
        <strong className="text-[#F3F5F7] font-semibold">Observed Finding: </strong>
        {experiment.finding}
      </p>

      {/* Expandable Section: Safety Significance & Limitations */}
      {expanded && (
        <div className="pt-3 border-t border-[#303741] space-y-2.5 text-xs">
          <div>
            <span className="font-bold text-[#E99847] uppercase tracking-wider text-[10px] block mb-1">
              Spacecraft Fire Safety Significance
            </span>
            <p className="text-[#F3F5F7] bg-[#15191F] p-2.5 rounded-lg border border-[#303741] leading-relaxed">
              {experiment.fire_safety_relevance}
            </p>
          </div>

          <div>
            <span className="font-bold text-[#D97777] uppercase tracking-wider text-[10px] block mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Documented Empirical Limitations
            </span>
            <ul className="list-disc pl-4 text-[#A1AAB5] space-y-1 text-[11px]">
              {experiment.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {experiment.source_locator && (
            <div className="text-[11px] text-[#A1AAB5] bg-[#0C0F13] p-2 rounded border border-[#303741]">
              <strong className="text-[#F3F5F7]">Exact Source Locator: </strong>
              <span className="font-mono text-[#78A9D8]">{experiment.source_locator}</span>
            </div>
          )}

          {breakdown.missingParameters.length > 0 && (
            <div className="bg-[#0C0F13] p-2 rounded text-[10px] text-[#A1AAB5] border border-[#303741]">
              <span className="text-[#E99847] font-semibold">Missing conditions in primary source: </span>
              {breakdown.missingParameters.join(", ")} (confidence adjusted; values never defaulted).
            </div>
          )}
        </div>
      )}

      {/* Footer: Source Link & Expand toggle */}
      <div className="pt-2 border-t border-[#303741] flex items-center justify-between text-[11px]">
        <a
          href={experiment.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#78A9D8] hover:text-[#F3F5F7] font-medium transition"
        >
          {experiment.psi_id ? `NASA PSI ${experiment.psi_id}` : "View NASA Source"}
          {experiment.doi ? ` · DOI: ${experiment.doi}` : ""}
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#A1AAB5] hover:text-[#F3F5F7] flex items-center gap-1 py-1 px-2 rounded hover:bg-[#15191F] transition cursor-pointer"
        >
          {expanded ? "Less detail" : "Scientific details"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}
