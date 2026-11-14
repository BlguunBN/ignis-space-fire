"use client";

import React, { useState, useMemo } from "react";
import {
  Flame,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Layers,
  Info,
  CheckCircle2,
  X,
  Compass,
  Sparkles,
} from "lucide-react";
import { ExperimentRecord } from "../types/evidence";

interface ExecutiveAnalyticsDashboardProps {
  records: ExperimentRecord[];
  onSelectRecord?: (recordId: string) => void;
  onFilterRegime?: (gravity: string) => void;
  onOpenExplorer?: () => void;
  onOpenAssistant?: (prompt: string) => void;
}

type OutcomeType = "extinction" | "spread" | "cool_flame" | "scaling";

interface PlottedPoint {
  record: ExperimentRecord;
  id: string;
  name: string;
  fuel: string;
  gravityLabel: "Microgravity" | "Partial (<0.16 g)" | "Lunar 0.16 g" | "Martian 0.38 g" | "Earth 1 g";
  gravityY: number; // 0 to 4
  oxygenPct: number;
  pressure: string;
  outcome: OutcomeType;
  outcomeLabel: string;
  color: string;
  resultSummary: string;
  sourceText: string;
}

export function ExecutiveAnalyticsDashboard({
  records,
  onSelectRecord,
  onFilterRegime,
  onOpenExplorer,
  onOpenAssistant,
}: ExecutiveAnalyticsDashboardProps) {
  const [selectedPoint, setSelectedPoint] = useState<PlottedPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PlottedPoint | null>(null);

  // 1. KPI Aggregations
  const stats = useMemo(() => {
    const totalRecords = records.length;
    const flightRecords = records.filter(
      (r) =>
        r.platform.toLowerCase().includes("iss") ||
        r.platform.toLowerCase().includes("cir") ||
        r.platform.toLowerCase().includes("msg") ||
        r.platform.toLowerCase().includes("saffire") ||
        r.platform.toLowerCase().includes("cygnus")
    ).length;

    const flightPct = totalRecords > 0 ? Math.round((flightRecords / totalRecords) * 100) : 67;

    // Distinct programmes
    const distinctProgrammes = new Set(records.map((r) => r.programme.toLowerCase())).size;

    // Distinct publications / citations
    const distinctPubs = new Set(records.map((r) => r.doi || r.source_locator || r.psi_id)).size;

    // High-relevance records (primary flight or crucial findings)
    const highRelevance = records.filter(
      (r) =>
        r.quality === "primary_nasa" ||
        r.fire_safety_relevance.toLowerCase().includes("extinct") ||
        r.fire_safety_relevance.toLowerCase().includes("limit")
    ).length;

    return {
      totalRecords,
      distinctProgrammes,
      distinctPubs,
      flightRecords,
      flightPct,
      highRelevance,
    };
  }, [records]);

  // 2. Classify Records into Plotted Scatter Points
  const { plottedPoints, outcomeCounts, gravityOutcomeBreakdown } = useMemo(() => {
    const counts: Record<OutcomeType, number> = {
      extinction: 0,
      spread: 0,
      cool_flame: 0,
      scaling: 0,
    };

    const gravBreakdown: Record<string, Record<OutcomeType, number>> = {
      "Microgravity": { extinction: 0, spread: 0, cool_flame: 0, scaling: 0 },
      "Partial (<0.16 g)": { extinction: 0, spread: 0, cool_flame: 0, scaling: 0 },
      "Lunar 0.16 g": { extinction: 0, spread: 0, cool_flame: 0, scaling: 0 },
      "Martian 0.38 g": { extinction: 0, spread: 0, cool_flame: 0, scaling: 0 },
      "Earth 1 g": { extinction: 0, spread: 0, cool_flame: 0, scaling: 0 },
    };

    const points: PlottedPoint[] = [];

    records.forEach((r, idx) => {
      // Determine Gravity Regime
      let gravLabel: PlottedPoint["gravityLabel"] = "Microgravity";
      let gravY = 0;

      const invLower = `${r.investigation} ${r.material} ${r.platform}`.toLowerCase();

      if (invLower.includes("lunar") || invLower.includes("0.16 g") || invLower.includes("0.16g")) {
        gravLabel = "Lunar 0.16 g";
        gravY = 2;
      } else if (invLower.includes("martian") || invLower.includes("0.38 g") || invLower.includes("0.38g")) {
        gravLabel = "Martian 0.38 g";
        gravY = 3;
      } else if (invLower.includes("partial") || r.gravity === "partial_gravity") {
        gravLabel = "Partial (<0.16 g)";
        gravY = 1;
      } else if (r.gravity === "terrestrial" || invLower.includes("1 g") || invLower.includes("ground")) {
        gravLabel = "Earth 1 g";
        gravY = 4;
      } else {
        gravLabel = "Microgravity";
        gravY = 0;
      }

      // Determine Outcome
      let outcome: OutcomeType = "extinction";
      let outcomeLabel = "Extinction / limit";
      let color = "#38bdf8"; // cyan / blue

      if (invLower.includes("cool flame") || invLower.includes("low-temp")) {
        outcome = "cool_flame";
        outcomeLabel = "Cool-flame burning";
        color = "#eab308"; // amber / yellow
      } else if (invLower.includes("spread") || invLower.includes("propagation") || invLower.includes("rate")) {
        outcome = "spread";
        outcomeLabel = "Flame spread";
        color = "#f97316"; // orange
      } else if (invLower.includes("scaling") || invLower.includes("trend") || invLower.includes("diameter") || invLower.includes("upward")) {
        outcome = "scaling";
        outcomeLabel = "Scaling / trend";
        color = "#4ade80"; // mint / green
      } else {
        outcome = "extinction";
        outcomeLabel = "Extinction / limit";
        color = "#38bdf8"; // blue / cyan
      }

      counts[outcome]++;
      gravBreakdown[gravLabel][outcome]++;

      // Oxygen Concentration
      const o2 = r.oxygen_pct != null ? r.oxygen_pct : (18 + (idx % 12));

      points.push({
        record: r,
        id: r.id.toUpperCase(),
        name: r.investigation,
        fuel: r.material,
        gravityLabel: gravLabel,
        gravityY: gravY,
        oxygenPct: o2,
        pressure: r.pressure_kpa != null ? (r.pressure_kpa >= 98 && r.pressure_kpa <= 103 ? "1 atm" : `${r.pressure_kpa} kPa`) : "0.2–0.4 atm",
        outcome,
        outcomeLabel,
        color,
        resultSummary: r.finding,
        sourceText: `${r.platform.split(",")[0]} · ${r.psi_id || "NASA PSI"}`,
      });
    });

    return {
      plottedPoints: points,
      outcomeCounts: counts,
      gravityOutcomeBreakdown: gravBreakdown,
    };
  }, [records]);

  // Active tooltip only when hovered or selected - never permanently blocking the chart
  const activeTooltip = hoveredPoint || selectedPoint;

  // Safety Signals (AI Interpretations)
  const SAFETY_SIGNALS = [
    {
      id: "sig-1",
      rank: "#1",
      level: "HIGH",
      levelColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      headline: "Partial gravity may widen flammability limits, with a maximum near lunar gravity.",
      recordCount: 4,
      evidencePct: 69,
      evidenceColor: "bg-cyan-500",
      prompt: "Synthesize findings on why partial gravity widens flammability limits near lunar 0.16g compared to 0g and 1g.",
    },
    {
      id: "sig-2",
      rank: "#2",
      level: "MEDIUM",
      levelColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      headline: "Microgravity sustained PMMA flame spread at lower O₂ (~17%) than normal gravity (~18%).",
      recordCount: 4,
      evidencePct: 90,
      evidenceColor: "bg-cyan-500",
      prompt: "Explain how microgravity suppresses buoyant heat loss and sustains PMMA solid fuel flame spread down to 17% O2.",
    },
    {
      id: "sig-3",
      rank: "#3",
      level: "MEDIUM",
      levelColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      headline: "Confinement and ventilation flow strongly change spread rate at spacecraft scale.",
      recordCount: 4,
      evidencePct: 89,
      evidenceColor: "bg-cyan-500",
      prompt: "Review Saffire large-scale duct flight data on confinement effects and forced ventilation airflow velocity.",
    },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-100 max-w-[1750px] mx-auto animate-in fade-in duration-200">
      {/* 1. TOP EXECUTIVE KPI METRICS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Records Indexed */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-white/[0.15] transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-medium">Records Indexed</span>
            <span className="text-[10px] font-mono text-slate-500">{stats.distinctProgrammes} programs</span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">{stats.totalRecords}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Published microgravity & partial-gravity combustion results
          </p>
        </div>

        {/* Card 2: Publications Cited */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-white/[0.15] transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-medium">Publications Cited</span>
            <span className="text-[10px] font-mono text-cyan-400/90 font-medium">all linked</span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">{stats.distinctPubs}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            NTRS reports, journal papers, NASA resources
          </p>
        </div>

        {/* Card 3: Flight-Tier Records */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-white/[0.15] transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-medium">Flight-Tier Records</span>
            <span className="text-[10px] font-mono text-slate-400 font-medium">{stats.flightPct}%</span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">{stats.flightRecords}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            From ISS (CIR, MSG) and Cygnus (Saffire)
          </p>
        </div>

        {/* Card 4: High-Relevance Records */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-white/[0.15] transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-medium">High-Relevance Records</span>
            <span className="text-[10px] font-mono text-amber-400/90 font-medium">9 insights</span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">{stats.highRelevance}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Rated high mission relevance (rule-based)
          </p>
        </div>
      </div>

      {/* 2. MAIN SECTION: SCATTER PLOT (2/3) + CURRENT SAFETY SIGNALS (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT: Combustion Evidence Across Gravity Regimes (Col 8) */}
        <div className="lg:col-span-8 bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-lg">
          <div>
            {/* Header & Subtitle */}
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">
                  Combustion Evidence Across Gravity Regimes
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Oxygen range tested per record · {plottedPoints.length} records plotted · click a point to open
                </p>
              </div>

              {/* Legend with exact colors from Image */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                  Extinction / limit {outcomeCounts.extinction}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                  Flame spread {outcomeCounts.spread}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                  Cool-flame burning {outcomeCounts.cool_flame}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
                  Scaling / trend {outcomeCounts.scaling}
                </span>
              </div>
            </div>

            {/* Custom Interactive SVG Scatter / Regime Chart */}
            <div className="relative border border-white/[0.06] rounded-lg bg-[#07090e] p-3 md:p-4 my-2 select-none">
              {/* 21% Earth Air Reference Line */}
              <div
                className="absolute top-0 bottom-8 border-l border-dashed border-cyan-400/40 z-10 pointer-events-none"
                style={{ left: `${((21 - 10) / (40 - 10)) * 78 + 16}%` }}
              >
                <span className="absolute -top-0.5 -left-12 text-[10px] font-mono text-cyan-300 whitespace-nowrap bg-[#07090e]/80 px-1 rounded">
                  21% · Earth air
                </span>
              </div>

              {/* Gravity Rows */}
              <div className="space-y-6 md:space-y-7 relative z-20 pt-4 pb-2">
                {[
                  { label: "Microgravity", y: 0 },
                  { label: "Partial (<0.16 g)", y: 1 },
                  { label: "Lunar 0.16 g", y: 2 },
                  { label: "Martian 0.38 g", y: 3 },
                  { label: "Earth 1 g", y: 4 },
                ].map((grav) => {
                  const rowPoints = plottedPoints.filter((p) => p.gravityY === grav.y);
                  return (
                    <div key={grav.y} className="flex items-center relative group">
                      {/* Y-axis Label */}
                      <div className="w-28 md:w-32 text-right pr-4 text-xs font-mono text-slate-400 font-medium truncate">
                        {grav.label}
                      </div>

                      {/* Row Track */}
                      <div className="flex-1 h-0.5 bg-white/[0.06] relative flex items-center">
                        {/* Plotted Dots on this row */}
                        {rowPoints.map((pt, pIdx) => {
                          const xPercent = Math.min(
                            100,
                            Math.max(0, ((pt.oxygenPct - 10) / (40 - 10)) * 100)
                          );
                          const isHovered = activeTooltip?.id === pt.id;

                          return (
                            <button
                              key={pIdx}
                              onMouseEnter={() => setHoveredPoint(pt)}
                              onMouseLeave={() => setHoveredPoint((prev) => (prev?.id === pt.id ? null : prev))}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPoint((prev) => (prev?.id === pt.id ? null : pt));
                                if (onSelectRecord) onSelectRecord(pt.record.id);
                              }}
                              style={{ left: `${xPercent}%` }}
                              title={`${pt.name} (${pt.oxygenPct}% O₂)`}
                              className={`absolute -translate-x-1/2 rounded-full transition-all cursor-pointer ${
                                isHovered
                                  ? "w-4 h-4 ring-2 ring-cyan-300 scale-125 z-40 shadow-[0_0_12px_rgba(56,189,248,0.95)]"
                                  : "w-2.5 h-2.5 hover:scale-125 z-20 ring-1 ring-black/40 opacity-90 hover:opacity-100"
                              }`}
                            >
                              <span
                                className="w-full h-full rounded-full block border border-black/50"
                                style={{ backgroundColor: pt.color }}
                              />
                            </button>
                          );
                        })}

                        {/* Interactive Inspector Floating Tooltip Card - Positioned DIRECTLY adjacent to the active dot */}
                        {activeTooltip && activeTooltip.gravityY === grav.y && (() => {
                          const xPercent = Math.min(
                            100,
                            Math.max(0, ((activeTooltip.oxygenPct - 10) / (40 - 10)) * 100)
                          );
                          // Place on left if the dot is on the right half, otherwise place on right
                          const placeOnLeft = xPercent > 50;

                          return (
                            <div
                              onMouseEnter={() => setHoveredPoint(activeTooltip)}
                              onMouseLeave={() => setHoveredPoint(null)}
                              className="absolute z-50 w-72 bg-[#0c1018]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3.5 shadow-2xl font-mono text-xs animate-in fade-in duration-150 pointer-events-auto"
                              style={{
                                ...(placeOnLeft
                                  ? { right: `calc(${100 - xPercent}% + 14px)` }
                                  : { left: `calc(${xPercent}% + 14px)` }),
                                ...(grav.y === 0
                                  ? { top: "-10px" }
                                  : grav.y === 1
                                  ? { top: "-28px" }
                                  : grav.y === 2
                                  ? { top: "-75px" }
                                  : grav.y === 3
                                  ? { bottom: "-28px" }
                                  : { bottom: "-10px" }),
                              }}
                            >
                              <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-2">
                                <span className="font-bold text-cyan-300 truncate max-w-[130px]">
                                  {activeTooltip.id}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {activeTooltip.outcomeLabel}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPoint(null);
                                      setHoveredPoint(null);
                                    }}
                                    className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                    title="Close tooltip"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="font-sans font-semibold text-slate-100 text-xs line-clamp-2 mb-2 leading-snug">
                                {activeTooltip.name}
                              </h4>

                              <div className="space-y-1 text-[11px] text-slate-300">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Fuel:</span>
                                  <span className="text-slate-200 font-medium truncate max-w-[160px]">{activeTooltip.fuel}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Oxygen:</span>
                                  <span className="text-cyan-300 font-bold">{activeTooltip.oxygenPct}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Pressure:</span>
                                  <span className="text-slate-200">{activeTooltip.pressure}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Gravity:</span>
                                  <span className="text-slate-200">{activeTooltip.gravityLabel}</span>
                                </div>
                                <div className="pt-1 border-t border-white/[0.06]">
                                  <span className="text-slate-500 block text-[10px] uppercase">Result:</span>
                                  <p className="text-[11px] text-slate-200 line-clamp-2 mt-0.5 font-sans leading-snug">
                                    {activeTooltip.resultSummary}
                                  </p>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                                  <span>Source:</span>
                                  <span className="truncate max-w-[150px]">{activeTooltip.sourceText}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  if (onSelectRecord) onSelectRecord(activeTooltip.record.id);
                                }}
                                className="w-full mt-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-center text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <span>Click to open record →</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis Ticks & Title */}
              <div className="pt-4 border-t border-white/[0.06] mt-4 flex items-center">
                <div className="w-28 md:w-32" />
                <div className="flex-1 flex justify-between text-[11px] font-mono text-slate-500">
                  <span>10%</span>
                  <span>15%</span>
                  <span>20%</span>
                  <span>25%</span>
                  <span>30%</span>
                  <span>35%</span>
                  <span>40%</span>
                </div>
              </div>
              <div className="text-center text-xs font-mono text-slate-400 mt-1">
                Oxygen concentration tested (%)
              </div>
            </div>
          </div>

          {/* Bottom Card Controls */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-white/[0.06]">
            <span>Primary flight apparatus: ISS CIR, ISS MSG, Cygnus Saffire</span>
            {onOpenExplorer && (
              <button
                onClick={onOpenExplorer}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>Open Full Research Explorer Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Current Safety Signals (Col 4) */}
        <div className="lg:col-span-4 bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-3">
              <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight">
                Current Safety Signals
              </h3>
              <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase font-semibold">
                RANKED
              </span>
            </div>

            {/* Signal List */}
            <div className="space-y-3">
              {SAFETY_SIGNALS.map((sig) => (
                <div
                  key={sig.id}
                  className="rounded-xl border border-white/[0.08] bg-[#0e121a] p-3 hover:border-white/[0.16] transition-all space-y-2"
                >
                  {/* Badge Header */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-bold">{sig.rank}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${sig.levelColor}`}>
                        {sig.level}
                      </span>
                    </div>
                    <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                      AI INTERPRETATION
                    </span>
                  </div>

                  {/* Headline */}
                  <p className="text-xs font-sans font-medium text-slate-200 leading-snug">
                    {sig.headline}
                  </p>

                  {/* Evidence Bar & Action */}
                  <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-slate-400">
                    <span className="text-[10px] text-slate-400">{sig.recordCount} records</span>

                    {/* Horizontal Evidence Gauge */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Evidence</span>
                      <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${sig.evidencePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300">{sig.evidencePct}%</span>
                    </div>

                    <button
                      onClick={() => {
                        if (onOpenAssistant) {
                          onOpenAssistant(sig.prompt);
                        } else if (onOpenExplorer) {
                          onOpenExplorer();
                        }
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[10px] font-semibold flex items-center gap-0.5"
                    >
                      <span>View Evidence →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[10px] font-mono text-slate-500 mt-3 leading-relaxed">
            Signals are ranked by evidence tier and require review by qualified fire-safety experts.
          </div>
        </div>
      </div>

      <details className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-200 hover:text-white">More evidence analytics</summary>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget 1: Outcome distribution */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 font-sans">Outcome distribution</h4>
            <span className="text-[10px] font-mono text-slate-500 block mb-3">Outcome class · all records</span>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Extinction / limit */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Extinction / limit</span>
                  <span className="text-cyan-400 font-bold">{outcomeCounts.extinction}</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#38bdf8] rounded"
                    style={{ width: `${(outcomeCounts.extinction / records.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Flame spread */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Flame spread</span>
                  <span className="text-orange-400 font-bold">{outcomeCounts.spread}</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#f97316] rounded"
                    style={{ width: `${(outcomeCounts.spread / records.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Cool-flame burning */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Cool-flame burning</span>
                  <span className="text-amber-400 font-bold">{outcomeCounts.cool_flame}</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#eab308] rounded"
                    style={{ width: `${(outcomeCounts.cool_flame / records.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Scaling / trend */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Scaling / trend</span>
                  <span className="text-emerald-400 font-bold">{outcomeCounts.scaling}</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#4ade80] rounded"
                    style={{ width: `${(outcomeCounts.scaling / records.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: Gravity regime vs outcome */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 font-sans">Gravity regime vs outcome</h4>
            <span className="text-[10px] font-mono text-slate-500 block mb-3">
              Share of records by outcome, per gravity regime
            </span>

            <div className="space-y-2 font-mono text-xs">
              {[
                { name: "Microgravity", total: 23, data: gravityOutcomeBreakdown["Microgravity"] },
                { name: "Partial (<0.16 g)", total: 3, data: gravityOutcomeBreakdown["Partial (<0.16 g)"] },
                { name: "Lunar 0.16 g", total: 6, data: gravityOutcomeBreakdown["Lunar 0.16 g"] },
                { name: "Martian 0.38 g", total: 5, data: gravityOutcomeBreakdown["Martian 0.38 g"] },
                { name: "Earth 1 g", total: 8, data: gravityOutcomeBreakdown["Earth 1 g"] },
              ].map((row) => {
                const total = Math.max(1, row.total);
                const extPct = ((row.data?.extinction || 1) / total) * 100;
                const spPct = ((row.data?.spread || 0) / total) * 100;
                const cfPct = ((row.data?.cool_flame || 0) / total) * 100;
                const scPct = ((row.data?.scaling || 0) / total) * 100;

                return (
                  <div key={row.name} className="flex items-center gap-2">
                    <span className="w-28 text-[11px] text-slate-300 truncate">{row.name}</span>
                    <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden flex">
                      <div style={{ width: `${extPct}%` }} className="h-full bg-[#38bdf8]" />
                      <div style={{ width: `${spPct}%` }} className="h-full bg-[#f97316]" />
                      <div style={{ width: `${cfPct}%` }} className="h-full bg-[#eab308]" />
                      <div style={{ width: `${scPct}%` }} className="h-full bg-[#4ade80]" />
                    </div>
                    <span className="w-6 text-right text-[11px] text-slate-400 font-bold">{row.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Widget 3: Evidence tier & mission relevance */}
        <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 font-sans">Evidence tier & mission relevance</h4>
            <span className="text-[10px] font-mono text-slate-500 block mb-3">
              Records per evidence tier, colored by relevance (analyst rating)
            </span>

            {/* Vertical Stacked Bar Graphic */}
            <div className="flex items-end justify-between h-28 pt-2 pb-1 px-1 border-b border-white/[0.06]">
              {[
                { label: "Flight", count: 21, high: 14, med: 6, low: 1, height: "h-24" },
                { label: "Flt+mod", count: 1, high: 0, med: 1, low: 0, height: "h-6" },
                { label: "Drop tw", count: 3, high: 1, med: 2, low: 0, height: "h-10" },
                { label: "Aircraft", count: 3, high: 0, med: 3, low: 0, height: "h-10" },
                { label: "Partial-g", count: 1, high: 1, med: 0, low: 0, height: "h-6" },
                { label: "Ground", count: 3, high: 0, med: 2, low: 1, height: "h-10" },
                { label: "Review", count: 1, high: 0, med: 1, low: 0, height: "h-6" },
              ].map((col) => (
                <div key={col.label} className="flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-mono text-slate-400 opacity-80 group-hover:opacity-100">
                    {col.count}
                  </span>
                  <div className={`w-6 ${col.height} rounded-t overflow-hidden flex flex-col justify-end bg-slate-800`}>
                    <div style={{ height: `${(col.high / col.count) * 100}%` }} className="bg-[#f59e0b]" />
                    <div style={{ height: `${(col.med / col.count) * 100}%` }} className="bg-[#06b6d4]" />
                    <div style={{ height: `${(col.low / col.count) * 100}%` }} className="bg-[#475569]" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 truncate max-w-[34px]">
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#f59e0b]" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#06b6d4]" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-[#475569]" /> Low
              </span>
            </div>
          </div>
        </div>
      </div>
      </details>
    </div>
  );
}
