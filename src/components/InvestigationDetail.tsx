"use client";

import React from "react";
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Flame,
  Wind,
  Gauge,
  Layers,
} from "lucide-react";
import { ExperimentRecord, SearchQuery } from "../types/evidence";
import { assessApplicability } from "../lib/applicability";

interface InvestigationDetailProps {
  record: ExperimentRecord | null;
  query: SearchQuery;
}

export function InvestigationDetail({ record, query }: InvestigationDetailProps) {
  if (!record) {
    return (
      <div className="h-full flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-center">
        <div className="max-w-xs space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-400">Select an investigation to inspect verified evidence and source locators.</p>
        </div>
      </div>
    );
  }

  const assess = assessApplicability(record, query);

  return (
    <div className="space-y-4 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
      {/* Title & Provenance Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {record.programme}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{record.platform}</span>
            <span className="text-[10px] font-mono text-slate-400">Record ID: {record.id}</span>
          </div>
          <h2 className="text-base font-bold text-slate-100 font-sans mt-1">
            {record.investigation}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>{record.verified_by || "Verified by NASA GRC"}</span>
        </div>
      </div>

      {/* Experimental Condition Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Flame className="w-3 h-3 text-amber-400" /> Oxygen Concentration
          </span>
          <span className="text-sm font-bold text-slate-100">
            {record.oxygen_pct != null ? `${record.oxygen_pct}%` : "Unknown"}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Gauge className="w-3 h-3 text-cyan-400" /> Chamber Pressure
          </span>
          <span className="text-sm font-bold text-slate-100">
            {record.pressure_kpa != null ? `${record.pressure_kpa} kPa` : "Unknown"}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Wind className="w-3 h-3 text-blue-400" /> Forced Flow Speed
          </span>
          <span className="text-sm font-bold text-slate-100">
            {record.airflow_cm_s != null ? `${record.airflow_cm_s} cm/s` : "Quiescent"}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Layers className="w-3 h-3 text-emerald-400" /> Fuel Material
          </span>
          <span className="text-xs font-bold text-slate-100 truncate block" title={record.material}>
            {record.material}
          </span>
        </div>
      </div>

      {/* Applicability Callout */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400">Query Applicability Status:</span>
          <span className="font-bold text-amber-300">{assess.verdictLabel}</span>
        </div>
        {assess.differences.length > 0 ? (
          <ul className="space-y-1 text-slate-400 text-[11px]">
            {assess.differences.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span> {d}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-[11px]">{assess.reasons[0]}</p>
        )}
      </div>

      {/* Verified Finding */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Observed NASA Finding
        </label>
        <blockquote className="text-xs text-slate-200 bg-slate-950/90 border-l-2 border-amber-400 p-3 rounded-r-lg leading-relaxed font-sans">
          "{record.finding}"
        </blockquote>
      </div>

      {/* Spacecraft Fire Safety Relevance */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Fire Safety Impact
        </label>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 font-sans">
          {record.fire_safety_relevance}
        </p>
      </div>

      {/* Scientific Limitations & Confounders */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Stated Scientific Limitations
        </label>
        <ul className="space-y-1 text-xs text-slate-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg font-sans">
          {record.limitations.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Primary Source Locator & Provenance Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Primary NASA Source Locator
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase">{record.source_type}</span>
        </div>

        <div className="text-xs font-mono text-slate-200 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
          {record.source_locator || "NASA PSI Archive Record"}
        </div>

        <div className="flex items-center justify-between pt-1 text-xs font-mono">
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
            <span className="text-slate-400">No DOI Registered</span>
          )}

          <a
            href={record.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            Open in NASA PSI <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
