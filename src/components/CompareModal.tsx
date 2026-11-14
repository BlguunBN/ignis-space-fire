"use client";

import React from "react";
import { X, AlertTriangle, ShieldAlert, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import { compareInvestigations } from "../lib/comparison";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: ExperimentRecord[];
  onOpenBrief: () => void;
}

export function CompareModal({
  isOpen,
  onClose,
  selectedRecords,
  onOpenBrief,
}: CompareModalProps) {
  if (!isOpen) return null;

  const comparison = compareInvestigations(selectedRecords);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                P0 SCIENTIFIC COMPARISON
              </span>
              <span className="text-xs font-mono text-slate-400">
                Comparing {selectedRecords.length} NASA Microgravity Investigation(s)
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100 font-sans mt-0.5">
              Multi-Study Experimental Condition Matrix
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenBrief();
              }}
              className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Compile into Brief</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-950 text-xs font-sans">
          {/* Scientific Invariant Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold text-amber-300">
                SCIENTIFIC INVARIANT: Qualitative Comparison Only
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                {comparison.aggregationWarning}
              </p>
            </div>
          </div>

          {/* Physical Confounder Explanations */}
          {comparison.confounders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Detected Physical Confounders ({comparison.confounders.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comparison.confounders.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-300">
                        {c.title}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-amber-400/10 text-amber-400 rounded border border-amber-400/20">
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Matrix */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="p-3 w-44 font-semibold text-slate-300">Parameter</th>
                    {selectedRecords.map((r) => (
                      <th key={r.id} className="p-3 min-w-[240px] font-bold text-slate-100">
                        <div className="text-amber-400">{r.programme}</div>
                        <div className="text-xs truncate">{r.investigation}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {/* Platform */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Flight Platform
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-slate-200">
                        {r.platform}
                      </td>
                    ))}
                  </tr>

                  {/* Fuel Material */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Fuel Material
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-slate-200">
                        <div className="font-bold text-cyan-300">{r.material}</div>
                        <div className="text-[10px] text-slate-400">{r.material_class}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Oxygen Concentration */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Oxygen Index (O₂)
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-cyan-400 font-bold">
                        {r.oxygen_pct != null ? `${r.oxygen_pct}% O₂` : "Unspecified"}
                      </td>
                    ))}
                  </tr>

                  {/* Ambient Pressure */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Chamber Pressure
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-slate-200">
                        {r.pressure_kpa != null ? `${r.pressure_kpa} kPa` : "Unspecified"}
                      </td>
                    ))}
                  </tr>

                  {/* Forced Airflow */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Ventilation Flow
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-cyan-400 font-bold">
                        {r.airflow_cm_s != null ? `${r.airflow_cm_s} cm/s` : "0 cm/s (Quiescent)"}
                      </td>
                    ))}
                  </tr>

                  {/* Observed Finding */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Observed Finding
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-slate-300 font-sans leading-relaxed text-[11px]">
                        "{r.finding}"
                      </td>
                    ))}
                  </tr>

                  {/* Source Locator */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Source Locator
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-emerald-400 text-[11px]">
                        {r.source_locator || "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Limitations */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-400 bg-slate-950/40">
                      Limitations
                    </td>
                    {selectedRecords.map((r) => (
                      <td key={r.id} className="p-3 text-slate-400 font-sans text-[11px]">
                        <ul className="list-disc list-inside space-y-1">
                          {r.limitations.map((lim, idx) => (
                            <li key={idx}>{lim}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{comparison.sharedConditions.join(" • ") || "Divergent parameters detected"}</span>
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
