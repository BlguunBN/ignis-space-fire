"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Bot,
  ArrowRight,
  Flame,
  Orbit,
  Wind,
  ShieldAlert,
  ShieldCheck,
  Compass,
  AlertTriangle,
  ChevronRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { ExperimentRecord, SearchQuery } from "../types/evidence";

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
  {
    id: "liquid_droplets",
    label: "Liquid droplets",
    desc: "FLEX, MDCA droplet kinetics",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("droplet") ||
      r.material_class === "liquid_droplet" ||
      r.material_class === "liquid_hydrocarbon",
  },
  {
    id: "pmma",
    label: "PMMA polymer",
    desc: "BASS solid polymer rods/slabs",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("pmma") ||
      r.material.toLowerCase().includes("polymethyl"),
  },
  {
    id: "fabrics_cellulose",
    label: "Fabrics & thin cellulose",
    desc: "Saffire SIBAL, cotton, blends",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("cotton") ||
      r.material.toLowerCase().includes("sibal") ||
      r.material.toLowerCase().includes("cellulose") ||
      r.material_class === "solid_fabric",
  },
  {
    id: "wire_insulation",
    label: "Wire insulation",
    desc: "PTFE, ETFE, Kapton aerospace wiring",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("wire") ||
      r.material.toLowerCase().includes("insulation") ||
      r.material.toLowerCase().includes("ptfe") ||
      r.material.toLowerCase().includes("kapton"),
  },
  {
    id: "gaseous_fuels",
    label: "Gaseous fuels",
    desc: "Methane, ethylene burner jets",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("gaseous") ||
      r.material.toLowerCase().includes("methane") ||
      r.material.toLowerCase().includes("ethylene") ||
      r.material_class === "gas_fuel",
  },
  {
    id: "other_solids",
    label: "Other solids & composites",
    desc: "Nomex, silicone, structural foams",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("silicone") ||
      r.material.toLowerCase().includes("nomex") ||
      r.material.toLowerCase().includes("rods"),
  },
];

// 4 Gravity Regimes
const GRAVITY_REGIMES = [
  {
    id: "microgravity",
    label: "Microgravity",
    sublabel: "0g Orbital",
    accent: "text-sky-400 border-sky-500/30",
    headerBg: "bg-sky-500/10",
  },
  {
    id: "partial_low",
    label: "Partial",
    sublabel: "<0.16 g",
    accent: "text-indigo-400 border-indigo-500/30",
    headerBg: "bg-indigo-500/10",
  },
  {
    id: "lunar",
    label: "Lunar",
    sublabel: "0.16 g Artemis",
    accent: "text-amber-400 border-amber-500/30",
    headerBg: "bg-amber-500/10",
  },
  {
    id: "martian",
    label: "Martian",
    sublabel: "0.38 g Mars",
    accent: "text-rose-400 border-rose-500/30",
    headerBg: "bg-rose-500/10",
  },
];

// 3 Oxygen Bins
const O2_BINS = [
  { id: "low", label: "<17%", regime: "Hypoxic", min: 0, max: 16.9 },
  { id: "standard", label: "17–23%", regime: "Standard", min: 17, max: 23 },
  { id: "high", label: ">23%", regime: "Hyperoxic", min: 23.1, max: 100 },
];

function MiniRingGauge({ percentage }: { percentage: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg className="h-11 w-11 -rotate-90 transform" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="#1e293b"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-slate-100">
        {Math.round(percentage)}%
      </div>
    </div>
  );
}

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
            if (!mat.matcher(r)) return false;

            if (grav.id === "microgravity") {
              if (r.gravity !== "microgravity") return false;
            } else {
              return false;
            }

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
      const prompt = `Synthesize NASA combustion evidence for ${currentMat.label} under ${currentGrav.label} at ${currentO2.label} O2. Detail physical transport regimes, low-speed quenching boundaries, and why this represents a critical research gap.`;
      onAskAI(prompt);
      onClose();
    }
  };

  const strongPct = (matrixData.strongCells / matrixData.totalCells) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header / Telemetry Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080a0f]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                  WHAT WE STILL DON'T KNOW
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono border border-amber-500/30">
                  72 Boundary Cells
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
                Research Coverage & Gaps
              </h1>
              <p className="text-xs text-slate-400">
                Identify tested flight conditions and uncharacterized fire-safety boundaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* KPI Telemetry Pod */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-[#111622] p-2 text-xs font-mono shadow-sm">
              <div className="px-2.5 py-1 text-center border-r border-slate-800/90">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">No evidence</span>
                <span className="text-amber-400 font-bold text-sm tabular-nums">
                  {matrixData.emptyCells} <span className="text-[10px] font-normal text-slate-500">cells</span>
                </span>
              </div>

              <div className="px-2.5 py-1 text-center border-r border-slate-800/90">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Limited</span>
                <span className="text-cyan-300 font-bold text-sm tabular-nums">
                  {matrixData.limitedCells} <span className="text-[10px] font-normal text-slate-500">cells</span>
                </span>
              </div>

              <div className="px-2.5 py-1 text-center">
                <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Strong</span>
                <span className="text-sky-400 font-bold text-sm tabular-nums">
                  {matrixData.strongCells} / {matrixData.totalCells}
                </span>
              </div>

              <div className="border-l border-slate-800/90 pl-2 pr-1">
                <MiniRingGauge percentage={strongPct} />
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Matrix (65%) & Right Inspector (35%) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* LEFT: Research Coverage Matrix */}
          <div className="flex-1 p-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div>
              {/* Card Title & Interactive Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                <div>
                  <h2 className="text-xs font-bold text-slate-200">
                    Parameter Matrix • Oxygen × Gravity × Fuel
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Select any cell to inspect authentic flight evidence or physical gap justification.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-300 bg-[#121622] px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-400 inline-block shadow-sm shadow-sky-400/30" />
                    <span>Strong (≥4)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-600/60 border border-sky-500/50 inline-block" />
                    <span>Moderate (2–3)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-950 border border-sky-700/60 inline-block" />
                    <span>Limited (1)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-900 border border-slate-700/60 inline-block" />
                    <span>Gap (0)</span>
                  </span>
                </div>
              </div>

              {/* Multi-Dimensional Heatmap Grid Table */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-[#07090e] shadow-inner">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    {/* Level 1: Gravity Regimes Header */}
                    <tr className="border-b border-slate-800 bg-[#0e121a]">
                      <th className="p-3 text-[10px] text-slate-400 uppercase w-48 font-semibold">
                        O₂ Concentration →
                      </th>
                      {GRAVITY_REGIMES.map((grav) => (
                        <th
                          key={grav.id}
                          colSpan={3}
                          className={`p-2.5 text-center text-xs font-bold border-l border-slate-800 ${grav.headerBg}`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <Orbit className="w-3.5 h-3.5 opacity-70" />
                            <span className="text-white">{grav.label}</span>
                            <span className={`text-[10px] font-mono font-normal opacity-75 ${grav.accent}`}>
                              ({grav.sublabel})
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>

                    {/* Level 2: Oxygen Bins Subheaders */}
                    <tr className="border-b border-slate-800/90 bg-[#090c12] text-slate-400 text-[10px]">
                      <th className="p-2.5 font-medium text-slate-400">Tested Fuel Specimen</th>
                      {GRAVITY_REGIMES.map((grav) =>
                        O2_BINS.map((o2) => (
                          <th
                            key={`${grav.id}-${o2.id}`}
                            className="p-1.5 text-center font-medium border-l border-slate-800/60 text-slate-300"
                          >
                            <span className="block font-semibold">{o2.label}</span>
                            <span className="block text-[9px] text-slate-500 font-normal">{o2.regime}</span>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60">
                    {MATERIAL_CATEGORIES.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-2.5 bg-[#090c12]/90 border-r border-slate-800/60 whitespace-nowrap">
                          <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                            <span>{mat.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 ml-5 truncate max-w-[150px]">
                            {mat.desc}
                          </div>
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
                            let cellBg = "bg-slate-900/40 text-slate-600 border-slate-800/40 hover:border-slate-700 hover:text-slate-400";
                            if (count >= 4) {
                              cellBg = "bg-sky-400 text-slate-950 font-bold border-sky-300 shadow-sm shadow-sky-400/25";
                            } else if (count >= 2) {
                              cellBg = "bg-sky-600/30 text-sky-200 font-bold border-sky-500/50 hover:bg-sky-600/40";
                            } else if (count === 1) {
                              cellBg = "bg-sky-950/60 text-sky-300 font-semibold border-sky-800/60 hover:bg-sky-900/60";
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
                                className="p-1 text-center border-l border-slate-800/60 cursor-pointer"
                              >
                                <div
                                  className={`h-9 w-full rounded-lg flex items-center justify-center text-xs transition-all border ${cellBg} ${
                                    isSelected
                                      ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#07090e] shadow-lg shadow-amber-400/20 scale-[0.98]"
                                      : "hover:scale-[1.02]"
                                  }`}
                                  title={`${mat.label} in ${grav.label} at ${o2.label} O2: ${count} record(s)`}
                                >
                                  {count > 0 ? (
                                    count
                                  ) : (
                                    <span className="text-slate-600 font-normal select-none">—</span>
                                  )}
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
            <div className="pt-3.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 mt-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Primary Benchmark: 50 Verified NASA PSI Flight Investigations</span>
              </span>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-semibold transition"
              >
                <span>Filter Workspace by Selected Cell</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT: Selected Cell Evidence Inspector Drawer */}
          <div className="w-full lg:w-96 bg-[#0c1017] p-5 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 border-slate-800">
            <div className="space-y-4">
              {/* Evidence Coverage Header */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20 font-bold uppercase">
                    EVIDENCE REGIME INSPECTION
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {cellRecords.length} Investigation{cellRecords.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Breadcrumbs / Telemetry Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 font-mono text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{currentMat.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                    <Orbit className="w-3 h-3 text-sky-400" />
                    <span>{currentGrav.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    <span>{currentO2.label} O₂</span>
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border ${
                  cellRecords.length >= 4
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-200"
                    : cellRecords.length > 0
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {cellRecords.length > 0 ? (
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-white font-sans leading-snug">
                      {cellRecords.length >= 4
                        ? `Strong Evidence: ${cellRecords.length} records verified`
                        : cellRecords.length > 0
                        ? `Limited Evidence: ${cellRecords.length} record(s) indexed`
                        : "Uncharacterized Research Gap"}
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {cellRecords.length > 0
                        ? `NASA PSI covers ${currentMat.label.toLowerCase()} in ${currentGrav.label.toLowerCase()} across ${currentO2.label} O₂.`
                        : `No flight or drop-tower tests have been published for ${currentMat.label.toLowerCase()} at ${currentGrav.label.toLowerCase()} and ${currentO2.label} O₂.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Why It Matters / Physical Regime Context */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  PHYSICAL BOUNDARY & MISSION RELEVANCE
                </span>
                <div className="text-xs text-slate-300 leading-relaxed font-sans bg-[#111622] p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <p>
                    {currentGrav.id === "microgravity"
                      ? "In orbital microgravity (0g), natural buoyant convection is suppressed (Grashof Gr → 0). Heat and mass transfer are governed strictly by molecular diffusion and forced airflow ventilation."
                      : currentGrav.id === "lunar"
                      ? "In Lunar partial gravity (0.16g), buoyant plumes re-emerge non-linearly. Extrapolating 0g or 1g data to Artemis Lunar Base Camp (56 kPa, 34% O₂) creates critical spacecraft fire risk."
                      : currentGrav.id === "martian"
                      ? "In Martian partial gravity (0.38g), convective airflow velocities shift extinction curves significantly. Low-speed quenching limits differ fundamentally from terrestrial 1g standards."
                      : "In partial gravity regimes under 0.16g, sub-buoyant cellular flame instabilities create unpredictable flame spread rates."}
                  </p>
                  {currentO2.id === "high" && (
                    <div className="text-[11px] text-amber-300/90 font-mono bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      ⚡ Hyperoxic atmosphere (&gt;23% O₂): Elevated flame temperatures and reduced quenching distances significantly heighten material flammability.
                    </div>
                  )}
                </div>
              </div>

              {/* Records In This Cell */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    RECORDS IN THIS CELL ({cellRecords.length})
                  </span>
                  {cellRecords.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Click to inspect source
                    </span>
                  )}
                </div>

                {cellRecords.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cellRecords.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          if (onSelectRecord) {
                            onSelectRecord(r.id);
                            onClose();
                          }
                        }}
                        className="p-3 rounded-xl border border-slate-800 bg-[#111622] hover:bg-[#181f2f] hover:border-amber-400/50 cursor-pointer transition-all group shadow-sm"
                      >
                        <div className="flex items-center justify-between font-mono text-xs font-semibold text-sky-300 group-hover:text-amber-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                            <span className="truncate">{r.investigation}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-2">
                          <span className="text-amber-400/90">{r.oxygen_pct}% O₂</span>
                          <span>•</span>
                          <span>{r.pressure_kpa != null ? `${r.pressure_kpa} kPa` : "1 atm"}</span>
                          <span>•</span>
                          <span className="text-slate-300">{r.platform || "Orbital"}</span>
                        </div>
                        {r.finding && (
                          <p className="text-[11px] text-slate-400 mt-1.5 font-sans line-clamp-2 leading-relaxed">
                            {r.finding}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center font-mono text-xs text-slate-500 space-y-1">
                    <AlertTriangle className="w-5 h-5 mx-auto text-amber-500/60 mb-1" />
                    <p className="text-slate-300 font-semibold font-sans">No Authentic Flight Records</p>
                    <p className="text-[11px] text-slate-500">
                      Scientific abstention strictly enforced. Propose a parabolic or orbital flight experiment to measure this regime.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2 mt-4">
              <button
                type="button"
                onClick={handleAskAINearby}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700/80 font-mono text-xs font-semibold transition hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              >
                <Bot className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ask FLARE Copilot for Boundary Analysis</span>
              </button>

              <button
                type="button"
                onClick={handleApplyFilter}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-xs font-bold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Filter Workspace to This Regime</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
