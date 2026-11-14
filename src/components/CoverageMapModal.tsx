"use client";

import React, { useState, useMemo } from "react";
import { X, Sparkles, Bot, ExternalLink, ArrowRight, Layers } from "lucide-react";
import { ExperimentRecord, SearchQuery } from "../types/evidence";
import { BklitRingChart } from "./charts/bklit";

interface CoverageMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExperimentRecord[];
  onApplyCellFilter: (query: SearchQuery) => void;
  onAskAI?: (prompt: string) => void;
  onSelectRecord?: (recordId: string) => void;
}

// 6 Fuel Material Categories
const MATERIAL_CATEGORIES = [
  { id: "liquid_droplets", label: "Liquid droplets", matcher: (r: ExperimentRecord) => r.material.toLowerCase().includes("droplet") || r.material_class === "liquid_droplet" || r.material_class === "liquid_hydrocarbon" },
  { id: "pmma", label: "PMMA", matcher: (r: ExperimentRecord) => r.material.toLowerCase().includes("pmma") || r.material.toLowerCase().includes("polymethyl") },
  { id: "fabrics_cellulose", label: "Fabrics & thin cellulose", matcher: (r: ExperimentRecord) => r.material.toLowerCase().includes("cotton") || r.material.toLowerCase().includes("sibal") || r.material.toLowerCase().includes("cellulose") || r.material_class === "solid_fabric" },
  { id: "wire_insulation", label: "Wire insulation", matcher: (r: ExperimentRecord) => r.material.toLowerCase().includes("wire") || r.material.toLowerCase().includes("insulation") || r.material.toLowerCase().includes("ptfe") || r.material.toLowerCase().includes("kapton") },
  { id: "gaseous_fuels", label: "Gaseous fuels", matcher: (r: ExperimentRecord) => r.material.toLowerCase().includes("gaseous") || r.material.toLowerCase().includes("methane") || r.material.toLowerCase().includes("ethylene") || r.material_class === "gas_fuel" },
  { id: "other_solids", label: "Other solids", matcher: (r: ExperimentRecord) => r.material.toLowerCase().includes("silicone") || r.material.toLowerCase().includes("nomex") || r.material.toLowerCase().includes("rods") },
];

// 4 Gravity Regimes
const GRAVITY_REGIMES = [
  { id: "microgravity", label: "Microgravity", value: "microgravity" },
  { id: "partial_low", label: "Partial (<0.16 g)", value: "partial_low" },
  { id: "lunar", label: "Lunar (0.16 g)", value: "lunar" },
  { id: "martian", label: "Martian (0.38 g)", value: "martian" },
];

// 3 Oxygen Bins
const O2_BINS = [
  { id: "low", label: "<17%", min: 0, max: 16.9 },
  { id: "standard", label: "17–23%", min: 17, max: 23 },
  { id: "high", label: ">23%", min: 23.1, max: 100 },
];

export function CoverageMapModal({
  isOpen,
  onClose,
  records,
  onApplyCellFilter,
  onAskAI,
  onSelectRecord,
}: CoverageMapModalProps) {
  // Default selected cell: Fabrics & thin cellulose, Microgravity, 17–23%
  const [selectedCell, setSelectedCell] = useState<{
    materialId: string;
    gravityId: string;
    o2Id: string;
  }>({
    materialId: "fabrics_cellulose",
    gravityId: "microgravity",
    o2Id: "standard",
  });

  // Calculate cell matrix distributions
  const matrixData = useMemo(() => {
    let emptyCells = 0;
    let limitedCells = 0;
    let strongCells = 0;
    const totalCells = MATERIAL_CATEGORIES.length * GRAVITY_REGIMES.length * O2_BINS.length; // 72 cells

    const cellMap = new Map<string, ExperimentRecord[]>();

    MATERIAL_CATEGORIES.forEach((mat) => {
      GRAVITY_REGIMES.forEach((grav) => {
        O2_BINS.forEach((o2) => {
          const key = `${mat.id}__${grav.id}__${o2.id}`;
          const matching = records.filter((r) => {
            // Material match
            if (!mat.matcher(r)) return false;

            // Gravity match
            if (grav.id === "microgravity") {
              if (r.gravity !== "microgravity") return false;
            } else {
              // Non-microgravity partials are unindexed in this flight corpus
              return false;
            }

            // Oxygen match
            if (r.oxygen_pct == null) return false;
            return r.oxygen_pct >= o2.min && r.oxygen_pct <= o2.max;
          });

          cellMap.set(key, matching);

          if (matching.length === 0) emptyCells++;
          else if (matching.length === 1) limitedCells++;
          else strongCells++;
        });
      });
    });

    return {
      cellMap,
      emptyCells,
      limitedCells,
      strongCells,
      totalCells,
    };
  }, [records]);

  if (!isOpen) return null;

  const currentMat = MATERIAL_CATEGORIES.find((m) => m.id === selectedCell.materialId)!;
  const currentGrav = GRAVITY_REGIMES.find((g) => g.id === selectedCell.gravityId)!;
  const currentO2 = O2_BINS.find((o) => o.id === selectedCell.o2Id)!;

  const selectedKey = `${selectedCell.materialId}__${selectedCell.gravityId}__${selectedCell.o2Id}`;
  const cellRecords = matrixData.cellMap.get(selectedKey) || [];

  const handleApplyFilter = () => {
    const q: SearchQuery = {};
    if (selectedCell.gravityId === "microgravity") {
      q.gravity = "microgravity";
    }
    if (selectedCell.o2Id === "low") q.oxygenPct = 16;
    if (selectedCell.o2Id === "standard") q.oxygenPct = 21;
    if (selectedCell.o2Id === "high") q.oxygenPct = 26;
    onApplyCellFilter(q);
    onClose();
  };

  const handleAskAINearby = () => {
    if (onAskAI) {
      const prompt = `Synthesize current NASA evidence for ${currentMat.label} under ${currentGrav.label} at ${currentO2.label} O2. What are the nearest experimental boundary bounds and research gaps?`;
      onAskAI(prompt);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b0d12] border border-white/[0.08] rounded-xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-start justify-between bg-[#080a0f]">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold mb-0.5">
              WHAT WE STILL DON'T KNOW
            </div>
            <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
              Research Gaps
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Identify areas where current evidence is limited.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* KPI Summary Cards */}
            <div className="flex items-center gap-2 bg-[#13171e] p-1.5 rounded-lg border border-white/[0.06] text-xs font-mono">
              <div className="px-3 py-1 border-r border-white/[0.08] text-center">
                <span className="text-[10px] text-slate-400 uppercase block">No evidence</span>
                <span className="text-amber-400 font-bold text-sm tabular-nums">
                  {matrixData.emptyCells} cells
                </span>
              </div>

              <div className="px-3 py-1 border-r border-white/[0.08] text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Limited</span>
                <span className="text-cyan-300 font-bold text-sm tabular-nums">
                  {matrixData.limitedCells} cells
                </span>
              </div>

              <div className="px-3 py-1 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Strong</span>
                <span className="text-cyan-400 font-bold text-sm tabular-nums">
                  {matrixData.strongCells} / {matrixData.totalCells}
                </span>
              </div>

              <div
                className="ml-1 border-l border-white/[0.08] pl-2"
                aria-label={`Coverage: ${matrixData.strongCells} of ${matrixData.totalCells} cells strongly evidenced`}
              >
                <BklitRingChart
                  value={(matrixData.strongCells / matrixData.totalCells) * 100}
                  height={56}
                  color="#38bdf8"
                  trackColor="#0f1720"
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Matrix (65%) & Right Inspector (35%) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Research Coverage Matrix */}
          <div className="flex-1 p-5 overflow-y-auto border-r border-white/[0.08] flex flex-col justify-between">
            <div>
              {/* Card Title & Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-sans">
                    Research coverage • Oxygen × Gravity × Fuel
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Records per condition cell · click a cell · 72 structured cells
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 bg-[#13171e] px-2.5 py-1 rounded border border-white/[0.06]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" /> Strong (≥4)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block" /> Moderate (2–3)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0f3b52] inline-block" /> Limited (1)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block" /> None (0)
                  </span>
                </div>
              </div>

              {/* Multi-Dimensional Heatmap Grid Table */}
              <div className="border border-white/[0.08] rounded-lg overflow-x-auto bg-[#080a0f]">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    {/* Level 1: Gravity Regimes Header */}
                    <tr className="border-b border-white/[0.08] bg-[#0f131a] text-slate-300">
                      <th className="p-2.5 text-[10px] text-slate-400 uppercase w-44 font-semibold">
                        O₂ →
                      </th>
                      {GRAVITY_REGIMES.map((grav) => (
                        <th
                          key={grav.id}
                          colSpan={3}
                          className="p-2 text-center text-xs font-bold border-l border-white/[0.08] text-slate-200"
                        >
                          {grav.label}
                        </th>
                      ))}
                    </tr>

                    {/* Level 2: Oxygen Bins Subheaders */}
                    <tr className="border-b border-white/[0.08] bg-[#0c0f14] text-slate-400 text-[10px]">
                      <th className="p-2">Fuel Material</th>
                      {GRAVITY_REGIMES.map((grav) =>
                        O2_BINS.map((o2) => (
                          <th
                            key={`${grav.id}-${o2.id}`}
                            className="p-1.5 text-center font-medium border-l border-white/[0.04]"
                          >
                            {o2.label}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04]">
                    {MATERIAL_CATEGORIES.map((mat) => (
                      <tr key={mat.id} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 font-medium text-slate-200 text-xs bg-[#0c0f14]/80 whitespace-nowrap">
                          {mat.label}
                        </td>

                        {GRAVITY_REGIMES.map((grav) =>
                          O2_BINS.map((o2) => {
                            const key = `${mat.id}__${grav.id}__${o2.id}`;
                            const matching = matrixData.cellMap.get(key) || [];
                            const count = matching.length;
                            const isSelected =
                              selectedCell.materialId === mat.id &&
                              selectedCell.gravityId === grav.id &&
                              selectedCell.o2Id === o2.id;

                            // Heatmap cell styles
                            let cellBg = "bg-transparent text-slate-600";
                            if (count >= 4) {
                              cellBg = "bg-[#38bdf8] text-slate-950 font-bold";
                            } else if (count >= 2) {
                              cellBg = "bg-[#0284c7] text-slate-100 font-bold";
                            } else if (count === 1) {
                              cellBg = "bg-[#0f3b52] text-cyan-200 font-semibold";
                            }

                            return (
                              <td
                                key={`${mat.id}-${grav.id}-${o2.id}`}
                                onClick={() =>
                                  setSelectedCell({
                                    materialId: mat.id,
                                    gravityId: grav.id,
                                    o2Id: o2.id,
                                  })
                                }
                                className={`p-1.5 text-center border-l border-white/[0.04] cursor-pointer transition-all ${
                                  isSelected
                                    ? "ring-2 ring-amber-400 ring-inset shadow-lg scale-95"
                                    : "hover:ring-1 hover:ring-white/20"
                                }`}
                              >
                                <div
                                  className={`h-9 w-full rounded flex items-center justify-center text-xs transition-colors ${cellBg}`}
                                >
                                  {count > 0 ? count : "—"}
                                </div>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrix Footer Notes */}
            <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/[0.06] mt-4">
              <span>Primary benchmark: NASA PSI Flight Investigation Records</span>
              <button
                onClick={handleApplyFilter}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <span>Filter Workspace by Selected Cell</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* RIGHT: Selected Cell Evidence Inspector Drawer */}
          <div className="w-96 bg-[#0c0f14] p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Evidence Coverage Tag */}
              <div>
                <span className="text-[10px] font-mono tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 font-bold uppercase">
                  EVIDENCE COVERAGE
                </span>

                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-200">
                    {currentMat.label}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-200">
                    {currentGrav.label}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-200">
                    {currentO2.label} O₂
                  </span>
                </div>
              </div>

              {/* Status Headline */}
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-sans leading-snug">
                  {cellRecords.length >= 4 ? (
                    `Strong evidence: ${cellRecords.length} records cover ${currentMat.label.toLowerCase()} at ${currentGrav.label.toLowerCase()} with ${currentO2.label} O₂.`
                  ) : cellRecords.length > 0 ? (
                    `Moderate evidence: ${cellRecords.length} record(s) cover ${currentMat.label.toLowerCase()} at ${currentGrav.label.toLowerCase()} with ${currentO2.label} O₂.`
                  ) : (
                    `No evidence: 0 records exist for ${currentMat.label.toLowerCase()} under ${currentGrav.label.toLowerCase()} with ${currentO2.label} O₂.`
                  )}
                </h3>
              </div>

              {/* Why It Matters */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  WHY IT MATTERS
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#13171e] p-3 rounded-lg border border-white/[0.06]">
                  {currentGrav.id === "microgravity"
                    ? "Microgravity is the best-studied flight regime; remaining gaps are mostly at extreme oxygen levels or for specialized composite material classes."
                    : currentGrav.id === "lunar"
                    ? "Lunar (0.16g) partial buoyancy altered flame spread mechanics are poorly characterized due to limited partial-gravity parabolic flights; extrapolation from 0g or 1g is scientifically invalid."
                    : currentGrav.id === "martian"
                    ? "Martian (0.38g) buoyant convection transition remains an open spacecraft fire safety gap. Flame extinction curves shift substantially between pure diffusion and partial natural convection."
                    : "Partial gravity regime under 0.16g exhibits sub-buoyant convective cellular instability."}
                </p>
              </div>

              {/* Records In This Cell */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  RECORDS IN THIS CELL ({cellRecords.length})
                </span>

                {cellRecords.length > 0 ? (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {cellRecords.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          if (onSelectRecord) {
                            onSelectRecord(r.id);
                            onClose();
                          }
                        }}
                        className="p-2.5 rounded-lg border border-white/[0.06] bg-[#13171e] hover:bg-[#1a202a] hover:border-amber-400/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-cyan-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                          <span className="truncate">{r.investigation.toUpperCase()}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {r.oxygen_pct}% O₂ · {r.pressure_kpa != null ? `${r.pressure_kpa} kPa` : "1 atm"} · μg
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed border-white/10 text-center font-mono text-xs text-slate-500">
                    No verified investigations in this boundary cell. This represents a research gap for future flight experiments.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <button
                onClick={handleAskAINearby}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#1a202a] hover:bg-[#232b38] text-slate-100 border border-white/[0.08] font-mono text-xs font-semibold transition-colors"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>Ask AI what is known nearby</span>
              </button>

              <button
                onClick={handleApplyFilter}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-xs font-bold transition-colors shadow-sm"
              >
                <span>Filter Workspace to This Regime</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
