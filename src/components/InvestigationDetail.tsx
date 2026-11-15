"use client";

import React from "react";
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Layers,
} from "lucide-react";
import { ExperimentRecord, SearchQuery } from "../types/evidence";
import { assessApplicability } from "../lib/applicability";

interface InvestigationDetailProps {
  record: ExperimentRecord | null;
  query: SearchQuery;
  onInspectSource?: () => void;
}

export function InvestigationDetail({ record, query, onInspectSource }: InvestigationDetailProps) {
  if (!record) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center p-8 border border-white/[0.08] rounded-lg bg-[#13171e] text-center">
        <div className="max-w-xs space-y-2">
          <Layers className="w-6 h-6 text-slate-500 mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            Select an investigation to inspect verified evidence and source locators.
          </p>
        </div>
      </div>
    );
  }

  const assess = assessApplicability(record, query);

  return (
    <div className="space-y-3.5 bg-[#13171e] border border-white/[0.09] rounded-lg p-4">
      {/* Header: Title & Verification Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
              {record.programme}
            </span>
            <span>{record.platform}</span>
            <span className="text-white/20">•</span>
            <span>Record ID: {record.id}</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100 font-sans mt-1">
            {record.investigation}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{record.verified_by || "Not yet reviewed"}</span>
        </div>
      </div>

      {/* Experimental Condition Telemetry Strip (Unified 4-Segment Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] rounded-md border border-white/[0.06] bg-[#13171e] text-xs font-mono">
        {/* Oxygen */}
        <div className="p-2.5">
          <div className="text-[11px] text-slate-400 mb-0.5">
            Oxygen
          </div>
          <div className="text-sm font-semibold text-cyan-400 tabular-nums">
            {record.oxygen_pct != null ? `${record.oxygen_pct}%` : "—"}
          </div>
        </div>

        {/* Pressure */}
        <div className="p-2.5">
          <div className="text-[11px] text-slate-400 mb-0.5">
            Pressure
          </div>
          <div className="text-sm font-semibold text-slate-200 tabular-nums">
            {record.pressure_kpa != null ? `${record.pressure_kpa} kPa` : "Not stated"}
          </div>
        </div>

        {/* Forced Flow */}
        <div className="p-2.5">
          <div className="text-[11px] text-slate-400 mb-0.5">
            Airflow Speed
          </div>
          <div className="text-sm font-semibold text-cyan-400 tabular-nums">
            {record.airflow_cm_s != null ? `${record.airflow_cm_s} cm/s` : "Not stated"}
          </div>
        </div>

        {/* Fuel Material */}
        <div className="p-2.5">
          <div className="text-[11px] text-slate-400 mb-0.5">
            Fuel Material
          </div>
          <div className="text-xs font-medium text-slate-200 truncate" title={record.material}>
            {record.material}
          </div>
        </div>
      </div>

      {/* Query Applicability Status Callout */}
      <div className="bg-[#13171e]/70 border border-white/[0.06] rounded-md p-2.5 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Query applicability status:</span>
          <span className="font-medium text-amber-300 text-[11px]">{assess.verdictLabel}</span>
        </div>
        {assess.differences.length > 0 ? (
          <ul className="mt-1.5 space-y-0.5 text-slate-400 text-[11px]">
            {assess.differences.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span> {d}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-slate-400 text-[11px]">{assess.reasons[0]}</p>
        )}
      </div>

      {/* Observed NASA Finding */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono text-slate-400 font-medium">
          Observed finding
        </div>
        <blockquote className="text-xs text-slate-200 bg-[#13171e] border-l-2 border-amber-400 p-3 rounded-r-md leading-relaxed font-sans">
          "{record.finding}"
        </blockquote>
      </div>

      {/* Spacecraft Fire Safety Relevance */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono text-slate-400 font-medium">
          Spacecraft fire safety relevance
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-[#13171e]/50 p-2.5 rounded-md border border-white/[0.06] font-sans">
          {record.fire_safety_relevance}
        </p>
      </div>

      {/* Stated Scientific Limitations & Confounders */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono text-slate-400 font-medium flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/90" />
          <span>Scientific limitations & boundary conditions</span>
        </div>
        <ul className="space-y-1 text-xs text-slate-400 bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-md font-sans">
          {record.limitations.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-400/80">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Primary NASA Source Locator & Actions */}
      <div className="bg-[#13171e] border border-white/[0.06] rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Primary NASA Source Locator
          </span>
          <span className="text-slate-400 uppercase text-[11px]">{record.source_type}</span>
        </div>

        <div className="text-xs font-mono text-slate-200 bg-[#0c0f14] px-2.5 py-1.5 rounded border border-white/[0.06]">
          {record.source_locator || "NASA PSI Archive Record"}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
          <div>
            {record.doi ? (
              <a
                href={`https://doi.org/${record.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2"
              >
                DOI: {record.doi} <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-500">No DOI Registered</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onInspectSource && (
              <button
                onClick={onInspectSource}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded text-xs transition-colors font-medium"
              >
                <FileCheck className="w-3 h-3" />
                <span>Primary PDF Evidence</span>
              </button>
            )}

            <a
              href={record.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] rounded text-xs transition-colors"
            >
              <span>NASA PSI Archive</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
