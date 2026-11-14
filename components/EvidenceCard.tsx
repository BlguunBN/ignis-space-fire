"use client";

import React, { useState } from "react";
import { RankedEvidence } from "@/types/evidence";
import { ExternalLink, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Scale } from "lucide-react";

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
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : score >= 60
      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
      : "bg-slate-500/10 text-slate-400 border-slate-500/30";

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition shadow-lg">
      {/* Top Header: Rank, Title, Score */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-300 font-bold text-sm shrink-0">
            #{rank}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {experiment.programme}
              </span>
              <span className="text-xs text-slate-400">{experiment.platform}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {experiment.investigation}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleCompare(experiment.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isSelectedForCompare
                ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            {isSelectedForCompare ? "Selected for Compare" : "Compare"}
          </button>

          <div className={`px-3 py-1 rounded-lg border flex flex-col items-end ${scoreBadgeColor}`}>
            <span className="text-base font-extrabold">{score}%</span>
            <span className="text-[10px] uppercase tracking-wide font-medium">
              {confidenceLevel} RELEVANCE
            </span>
          </div>
        </div>
      </div>

      {/* Why it ranks highly */}
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {breakdown.reasons.map((r, i) => (
          <span
            key={i}
            className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/30 flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {r}
          </span>
        ))}
      </div>

      {/* Experimental Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Material</span>
          <span className="font-semibold text-slate-200">{experiment.material}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Atmosphere (O₂ / Press)</span>
          <span className="font-semibold text-slate-200">
            {experiment.oxygen_pct}% O₂ {experiment.pressure_kpa ? `· ${experiment.pressure_kpa} kPa` : ""}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Ventilation Airflow</span>
          <span className="font-semibold text-slate-200">{experiment.airflow_cm_s} cm/s</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Gravity Regime</span>
          <span className="font-semibold text-cyan-400">{experiment.gravity}</span>
        </div>
      </div>

      {/* Study Finding */}
      <div className="mt-3 text-sm text-slate-300 leading-relaxed">
        <p className="line-clamp-3 font-normal">
          <strong className="text-slate-100 font-semibold">Finding: </strong>
          {experiment.finding}
        </p>
      </div>

      {/* Expandable Section: Safety Impact & Limitations */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 text-xs">
          <div>
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] mb-1">
              Spacecraft Fire Safety Significance
            </h4>
            <p className="text-slate-300 leading-relaxed bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
              {experiment.fire_safety_relevance}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Documented Limitations & Boundaries
            </h4>
            <ul className="list-disc pl-4 text-slate-400 space-y-1">
              {experiment.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {breakdown.missingParameters.length > 0 && (
            <div className="bg-slate-950 p-2 rounded text-[11px] text-slate-400 border border-slate-800">
              <span className="text-amber-400 font-semibold">Missing variables in source: </span>
              {breakdown.missingParameters.join(", ")} (scored with lower confidence, no false precision).
            </div>
          )}
        </div>
      )}

      {/* Footer Controls & Source DOI */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <a
          href={experiment.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition"
        >
          {experiment.psi_id ? `NASA PSI (${experiment.psi_id})` : "View NASA Source Publication"}
          {experiment.doi ? ` · DOI: ${experiment.doi}` : ""}
          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
        </a>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-800 transition"
        >
          {expanded ? "Less detail" : "Full scientific card"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
