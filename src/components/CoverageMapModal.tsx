"use client";

import React from "react";
import { X, Grid3X3, Info, Sparkles, Filter } from "lucide-react";
import { ExperimentRecord, SearchQuery } from "../types/evidence";

interface CoverageMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExperimentRecord[];
  onApplyCellFilter: (query: SearchQuery) => void;
}

export function CoverageMapModal({
  isOpen,
  onClose,
  records,
  onApplyCellFilter,
}: CoverageMapModalProps) {
  if (!isOpen) return null;

  // Oxygen bins: 15-20%, 21-25%, 26-30%, 31-38%
  const o2Bins = [
    { label: "15% - 20% O₂", min: 15, max: 20 },
    { label: "21% - 25% O₂", min: 21, max: 25 },
    { label: "26% - 30% O₂", min: 26, max: 30 },
    { label: "31% - 38% O₂", min: 31, max: 38 },
  ];

  // Flow velocity bins: 0 cm/s (Quiescent), 1-5 cm/s, 6-15 cm/s, 16-25 cm/s
  const flowBins = [
    { label: "Quiescent (0 cm/s)", min: 0, max: 0 },
    { label: "Low Flow (1-5 cm/s)", min: 1, max: 5 },
    { label: "Moderate (6-15 cm/s)", min: 6, max: 15 },
    { label: "High Flow (16-25 cm/s)", min: 16, max: 25 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  DESTINATION 2: COVERAGE & GAP MATRIX
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Physical Parameter Space (Oxygen vs. Flow)
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 font-sans mt-0.5">
                Microgravity Empirical Boundary Map
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          <div className="flex items-start gap-2.5 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 font-mono text-[11px]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Notice:</strong> Blank cells denote an absence of indexed data in this reviewed corpus, <em>not that NASA has not conducted testing in this regime</em>. Click any populated cell to immediately filter the research workspace.
            </span>
          </div>

          {/* 2D Matrix Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40 font-mono">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="p-3 w-48 font-bold text-slate-200">
                      Oxygen \ Forced Flow
                    </th>
                    {flowBins.map((fb, idx) => (
                      <th key={idx} className="p-3 text-center font-bold text-cyan-300">
                        {fb.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {o2Bins.map((ob, oIdx) => (
                    <tr key={oIdx}>
                      <td className="p-3 font-bold text-slate-200 bg-slate-950/60 border-r border-slate-800/80">
                        {ob.label}
                      </td>

                      {flowBins.map((fb, fIdx) => {
                        const matching = records.filter((r) => {
                          if (r.oxygen_pct == null || r.airflow_cm_s == null) return false;
                          const inO2 = r.oxygen_pct >= ob.min && r.oxygen_pct <= ob.max;
                          const inFlow =
                            fb.min === fb.max
                              ? r.airflow_cm_s === 0
                              : r.airflow_cm_s >= fb.min && r.airflow_cm_s <= fb.max;
                          return inO2 && inFlow;
                        });

                        const hasMatches = matching.length > 0;

                        return (
                          <td
                            key={fIdx}
                            className={`p-3 text-center border-r border-slate-800/60 transition-all ${
                              hasMatches
                                ? "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer border-amber-500/20"
                                : "bg-slate-950/20 text-slate-600"
                            }`}
                            onClick={() => {
                              if (hasMatches) {
                                onApplyCellFilter({
                                  oxygenPct: Math.round((ob.min + ob.max) / 2),
                                  airflowCmS: Math.round((fb.min + fb.max) / 2),
                                });
                                onClose();
                              }
                            }}
                          >
                            {hasMatches ? (
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs border border-amber-400/30">
                                  {matching.length} Study{matching.length > 1 ? "ies" : ""}
                                </span>
                                <div className="text-[10px] text-slate-300 truncate max-w-[140px] mx-auto">
                                  {matching.map((m) => m.programme).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 italic">No indexed data</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Corpus Total: {records.length} Investigations Analyzed</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
