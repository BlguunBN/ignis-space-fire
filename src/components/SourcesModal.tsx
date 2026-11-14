"use client";

import React from "react";
import { X, BookOpen, ShieldCheck, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExperimentRecord[];
}

export function SourcesModal({ isOpen, onClose, records }: SourcesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  DESTINATION 3: SOURCES & METHODS
                </span>
                <span className="text-xs font-mono text-slate-400">
                  NASA Physical Sciences Informatics (PSI) Archival Inventory
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 font-sans mt-0.5">
                Curation Standards & Provenance Ledger
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs font-sans">
          {/* Methodology Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Primary Source Provenance</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Every claim links directly to a reviewed NASA technical memorandum or peer-reviewed publication with exact page, section, and table locators.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Strict Non-Aggregation</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Apparatus scale disparities (e.g. Saffire 0.4m flight ducts vs BASS 2cm glovebox samples) forbid statistical averaging or uncalibrated numeric interpolation.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Scientific Abstention</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Queries in untested physical domains receive an explicit abstention report rather than synthetic approximations to protect mission safety.
              </p>
            </div>
          </div>

          {/* Complete Indexed Inventory */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Complete Indexed NASA Investigations ({records.length})
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40 font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="p-2.5">Investigation</th>
                    <th className="p-2.5">Platform</th>
                    <th className="p-2.5">Fuel Material</th>
                    <th className="p-2.5">Conditions</th>
                    <th className="p-2.5">Verified Locator</th>
                    <th className="p-2.5 text-right">Repository</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/60">
                      <td className="p-2.5 font-bold text-slate-100">{r.investigation}</td>
                      <td className="p-2.5 text-slate-300">{r.platform}</td>
                      <td className="p-2.5 text-cyan-300">{r.material}</td>
                      <td className="p-2.5 text-slate-300">
                        {r.oxygen_pct}% O₂ • {r.airflow_cm_s} cm/s
                      </td>
                      <td className="p-2.5 text-emerald-400 text-[11px]">
                        {r.source_locator || "NASA PSI Record"}
                      </td>
                      <td className="p-2.5 text-right">
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Standards: NASA-STD-6001B • Space Apps 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
