"use client";

import React, { useState, useMemo } from "react";
import { FadeUp } from "./ui/animated/fade-up";
import {
  Search,
  ExternalLink,
  Flame,
  Check,
  Plus,
  Eye,
  Shield,
  Radio,
  Wind,
  Layers,
  Sparkles,
  Info,
  X,
  Bot,
  Filter,
  Sliders,
} from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import { matchesReportedConditions, PressureFilter } from "../lib/explorer-conditions";

interface ResearchExplorerGridProps {
  records: ExperimentRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onInspect: (record: ExperimentRecord) => void;
  onOpenPdf: (record: ExperimentRecord) => void;
  onAskAI?: (prompt: string) => void;
  initialSearchQuery?: string;
  initialGravity?: GravityRegimeFilter;
  initialMaterial?: MaterialFilter;
  initialOxygenRange?: [number, number];
}

type GravityRegimeFilter = "all" | "microgravity" | "partial_gravity" | "lunar" | "martian" | "terrestrial";
type MaterialFilter = "all" | "liquid_droplets" | "pmma" | "fabrics_cellulose" | "wire_insulation" | "gaseous_fuels" | "other_solids";
type OutcomeFilter = "all" | "extinction" | "spread" | "cool_flame" | "scaling" | "other";
type RelevanceFilter = "all" | "high" | "medium" | "low";
type SortOption = "relevance" | "oxygen_desc" | "oxygen_asc" | "pressure_desc" | "name_asc";

export function ResearchExplorerGrid({
  records,
  selectedIds,
  onToggleSelect,
  onInspect,
  onOpenPdf,
  onAskAI,
  initialSearchQuery,
  initialGravity,
  initialMaterial,
  initialOxygenRange,
}: ResearchExplorerGridProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedGravity, setSelectedGravity] = useState<GravityRegimeFilter>(initialGravity || "all");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialFilter>(initialMaterial || "all");
  const [oxygenRange, setOxygenRange] = useState<[number, number]>(initialOxygenRange || [0, 40]);
  const [selectedPressure, setSelectedPressure] = useState<PressureFilter>("any");
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeFilter>("all");
  const [selectedRelevance, setSelectedRelevance] = useState<RelevanceFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  React.useEffect(() => {
    if (initialGravity) setSelectedGravity(initialGravity);
  }, [initialGravity]);

  React.useEffect(() => {
    if (initialMaterial) setSelectedMaterial(initialMaterial);
  }, [initialMaterial]);

  React.useEffect(() => {
    if (initialOxygenRange) setOxygenRange(initialOxygenRange);
  }, [initialOxygenRange]);

  const getOutcome = (r: ExperimentRecord): { id: OutcomeFilter; label: string; dotColor: string } => {
    const text = `${r.investigation} ${r.finding} ${r.fire_safety_relevance}`.toLowerCase();
    if (text.includes("cool flame") || text.includes("low-temp")) {
      return { id: "cool_flame", label: "Cool-flame burning", dotColor: "#eab308" };
    }
    if (text.includes("spread") || text.includes("propagation") || text.includes("rate") || text.includes("growth")) {
      return { id: "spread", label: "Flame spread", dotColor: "#f97316" };
    }
    if (text.includes("scaling") || text.includes("trend") || text.includes("diameter") || text.includes("upward")) {
      return { id: "scaling", label: "Scaling / trend", dotColor: "#4ade80" };
    }
    if (text.includes("extinct") || text.includes("limit")) {
      return { id: "extinction", label: "Extinction / limit", dotColor: "#38bdf8" };
    }
    return { id: "other", label: "Other topic", dotColor: "#94a3b8" };
  };

  const getRelevance = (r: ExperimentRecord): "high" | "medium" | "low" => {
    if (r.quality === "primary_nasa") return "high";
    if (r.quality === "peer_reviewed_nasa") return "medium";
    return "low";
  };

  const filterCounts = useMemo(() => {
    const gravCounts: Record<GravityRegimeFilter, number> = {
      all: records.length,
      microgravity: 0,
      partial_gravity: 0,
      lunar: 0,
      martian: 0,
      terrestrial: 0,
    };

    const matCounts: Record<MaterialFilter, number> = {
      all: records.length,
      liquid_droplets: 0,
      pmma: 0,
      fabrics_cellulose: 0,
      wire_insulation: 0,
      gaseous_fuels: 0,
      other_solids: 0,
    };

    const outcomeCounts: Record<OutcomeFilter, number> = {
      all: records.length,
      extinction: 0,
      spread: 0,
      cool_flame: 0,
      scaling: 0,
      other: 0,
    };

    const relCounts: Record<RelevanceFilter, number> = {
      all: records.length,
      high: 0,
      medium: 0,
      low: 0,
    };

    records.forEach((r) => {
      const invLower = `${r.investigation} ${r.material} ${r.platform}`.toLowerCase();

      if (invLower.includes("lunar") || invLower.includes("0.16 g")) gravCounts.lunar++;
      else if (invLower.includes("martian") || invLower.includes("0.38 g")) gravCounts.martian++;
      else if (invLower.includes("partial") || r.gravity === "partial_gravity") gravCounts.partial_gravity++;
      else if (r.gravity === "terrestrial" || invLower.includes("1 g")) gravCounts.terrestrial++;
      else gravCounts.microgravity++;

      if (r.material.toLowerCase().includes("droplet") || r.material_class === "liquid_droplet") matCounts.liquid_droplets++;
      else if (r.material.toLowerCase().includes("pmma")) matCounts.pmma++;
      else if (
        r.material.toLowerCase().includes("cotton") ||
        r.material.toLowerCase().includes("sibal") ||
        r.material.toLowerCase().includes("fabric") ||
        r.material.toLowerCase().includes("cellulose") ||
        r.material.toLowerCase().includes("lampwick") ||
        r.material_class === "solid_fabric"
      ) matCounts.fabrics_cellulose++;
      else if (r.material.toLowerCase().includes("wire") || r.material.toLowerCase().includes("kapton") || r.material.toLowerCase().includes("ptfe")) matCounts.wire_insulation++;
      else if (r.material.toLowerCase().includes("gas") || r.material.toLowerCase().includes("methane")) matCounts.gaseous_fuels++;
      else matCounts.other_solids++;

      const out = getOutcome(r);
      outcomeCounts[out.id]++;
      relCounts[getRelevance(r)]++;
    });

    return { gravCounts, matCounts, outcomeCounts, relCounts };
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => {
      const invLower = `${r.investigation} ${r.material} ${r.platform} ${r.finding}`.toLowerCase();

      if (searchQuery.trim() !== "") {
        const words = searchQuery.toLowerCase().split(/\s+/);
        const matchesAll = words.every((w) => invLower.includes(w));
        if (!matchesAll) return false;
      }

      if (selectedGravity !== "all") {
        if (selectedGravity === "lunar" && !invLower.includes("lunar") && !invLower.includes("0.16 g")) return false;
        if (selectedGravity === "martian" && !invLower.includes("martian") && !invLower.includes("0.38 g")) return false;
        if (selectedGravity === "partial_gravity" && !invLower.includes("partial") && r.gravity !== "partial_gravity") return false;
        if (selectedGravity === "terrestrial" && r.gravity !== "terrestrial" && !invLower.includes("1 g")) return false;
        if (selectedGravity === "microgravity" && r.gravity !== "microgravity") return false;
      }

      if (selectedMaterial !== "all") {
        if (selectedMaterial === "liquid_droplets" && !r.material.toLowerCase().includes("droplet") && r.material_class !== "liquid_droplet") return false;
        if (selectedMaterial === "pmma" && !r.material.toLowerCase().includes("pmma")) return false;
        if (
          selectedMaterial === "fabrics_cellulose" &&
          !r.material.toLowerCase().includes("cotton") &&
          !r.material.toLowerCase().includes("sibal") &&
          !r.material.toLowerCase().includes("fabric") &&
          !r.material.toLowerCase().includes("cellulose") &&
          !r.material.toLowerCase().includes("lampwick") &&
          r.material_class !== "solid_fabric"
        ) return false;
        if (selectedMaterial === "wire_insulation" && !r.material.toLowerCase().includes("wire") && !r.material.toLowerCase().includes("kapton")) return false;
        if (selectedMaterial === "gaseous_fuels" && !r.material.toLowerCase().includes("gas")) return false;
        if (selectedMaterial === "other_solids" && (r.material.toLowerCase().includes("pmma") || r.material.toLowerCase().includes("droplet"))) return false;
      }

      if (!matchesReportedConditions(r, oxygenRange, selectedPressure)) return false;

      if (selectedOutcome !== "all") {
        if (getOutcome(r).id !== selectedOutcome) return false;
      }

      if (selectedRelevance !== "all") {
        if (getRelevance(r) !== selectedRelevance) return false;
      }

      return true;
    });

    if (sortBy === "oxygen_desc") {
      result.sort((a, b) => (b.oxygen_pct ?? -1) - (a.oxygen_pct ?? -1));
    } else if (sortBy === "oxygen_asc") {
      result.sort((a, b) => (a.oxygen_pct ?? 999) - (b.oxygen_pct ?? 999));
    } else if (sortBy === "pressure_desc") {
      result.sort((a, b) => (b.pressure_kpa ?? -1) - (a.pressure_kpa ?? -1));
    } else if (sortBy === "name_asc") {
      result.sort((a, b) => a.investigation.localeCompare(b.investigation));
    }

    return result;
  }, [records, searchQuery, selectedGravity, selectedMaterial, oxygenRange, selectedPressure, selectedOutcome, selectedRelevance, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedGravity !== "all" ||
    selectedMaterial !== "all" ||
    oxygenRange[0] !== 0 ||
    oxygenRange[1] !== 40 ||
    selectedPressure !== "any" ||
    selectedOutcome !== "all" ||
    selectedRelevance !== "all"
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGravity("all");
    setSelectedMaterial("all");
    setOxygenRange([0, 40]);
    setSelectedPressure("any");
    setSelectedOutcome("all");
    setSelectedRelevance("all");
    setSortBy("relevance");
  };

  return (
    <div className="space-y-4 font-sans text-slate-100 max-w-[1750px] mx-auto animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search studies"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experiments, fuels, materials, conditions, findings..."
            className="w-full bg-[#0c0f16] border border-white/[0.08] rounded-md pl-10 pr-9 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-sans shadow-lg transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <span>Try:</span>
          <button
            onClick={() => setSearchQuery("PMMA oxygen microgravity")}
            className="text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            &quot;PMMA oxygen microgravity&quot;
          </button>
          <span>·</span>
          <button
            onClick={() => setSearchQuery("droplet cool flame")}
            className="text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            &quot;droplet cool flame&quot;
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <details className="rounded-lg border border-white/[0.08] bg-[#13171e]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200 hover:text-white">Filters {hasActiveFilters && <span className="ml-2 text-xs text-amber-400">Active</span>}</summary>
          <aside className="border-t border-white/[0.08] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h3 className="text-sm font-bold text-slate-100 font-sans">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] font-mono text-amber-400 hover:text-amber-300 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-medium text-slate-400">Gravity</h4>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {[
                  { id: "microgravity", label: "Microgravity", count: filterCounts.gravCounts.microgravity },
                  { id: "partial_gravity", label: "Partial gravity", count: filterCounts.gravCounts.partial_gravity },
                  { id: "lunar", label: "Lunar gravity", count: filterCounts.gravCounts.lunar },
                  { id: "martian", label: "Martian gravity", count: filterCounts.gravCounts.martian },
                  { id: "terrestrial", label: "1 g reference", count: filterCounts.gravCounts.terrestrial },
                ].map((item) => {
                  const active = selectedGravity === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedGravity(active ? "all" : (item.id as GravityRegimeFilter))}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors flex items-center gap-1.5 ${active ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold" : "bg-[#141822] text-slate-300 border-white/[0.06] hover:border-white/[0.15]"}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-bold">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <h4 className="text-[11px] font-medium text-slate-400">Fuel / material</h4>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {[
                  { id: "liquid_droplets", label: "Liquid droplets", count: filterCounts.matCounts.liquid_droplets },
                  { id: "pmma", label: "PMMA", count: filterCounts.matCounts.pmma },
                  { id: "fabrics_cellulose", label: "Fabrics & thin cellulose", count: filterCounts.matCounts.fabrics_cellulose },
                  { id: "wire_insulation", label: "Wire insulation", count: filterCounts.matCounts.wire_insulation },
                  { id: "gaseous_fuels", label: "Gaseous fuels", count: filterCounts.matCounts.gaseous_fuels },
                  { id: "other_solids", label: "Other solids", count: filterCounts.matCounts.other_solids },
                ].map((item) => {
                  const active = selectedMaterial === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedMaterial(active ? "all" : (item.id as MaterialFilter))}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors flex items-center gap-1.5 ${active ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold" : "bg-[#141822] text-slate-300 border-white/[0.06] hover:border-white/[0.15]"}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-bold">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between font-mono">
                <h4 className="text-[11px] font-medium text-slate-400">Oxygen</h4>
                <span className="text-cyan-400 text-xs font-bold">
                  {oxygenRange[0] === 0 && oxygenRange[1] === 40 ? "Any" : `${oxygenRange[0]}% — ${oxygenRange[1]}%`}
                </span>
              </div>
              <div className="space-y-1">
                <input
                  type="range"
                  aria-label="Maximum oxygen percentage"
                  min={0}
                  max={40}
                  value={oxygenRange[1]}
                  onChange={(e) => setOxygenRange([oxygenRange[0], Number(e.target.value)])}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>0%</span>
                  <span>21% (Air)</span>
                  <span>40%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <h4 className="text-[11px] font-medium text-slate-400">Pressure</h4>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {[
                  { id: "any", label: "Any" },
                  { id: "low", label: "Below 76 kPa" },
                  { id: "standard", label: "76–105 kPa" },
                  { id: "high", label: "Above 105 kPa" },
                ].map((p) => {
                  const active = selectedPressure === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPressure(p.id as PressureFilter)}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${active ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold" : "bg-[#141822] text-slate-300 border-white/[0.06] hover:border-white/[0.15]"}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <h4 className="text-[11px] font-medium text-slate-400">Topic (keyword match)</h4>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {[
                  { id: "extinction", label: "Extinction / limits", count: filterCounts.outcomeCounts.extinction },
                  { id: "spread", label: "Flame spread", count: filterCounts.outcomeCounts.spread },
                  { id: "cool_flame", label: "Cool flames", count: filterCounts.outcomeCounts.cool_flame },
                  { id: "scaling", label: "Scaling trends", count: filterCounts.outcomeCounts.scaling },
                  { id: "other", label: "Other topic", count: filterCounts.outcomeCounts.other },
                ].map((item) => {
                  const active = selectedOutcome === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedOutcome(active ? "all" : (item.id as OutcomeFilter))}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors flex items-center gap-1.5 ${active ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-semibold" : "bg-[#141822] text-slate-300 border-white/[0.06] hover:border-white/[0.15]"}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-bold">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <h4 className="text-[11px] font-medium text-slate-400">Source quality</h4>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {[
                  { id: "high", label: "NASA primary", count: filterCounts.relCounts.high },
                  { id: "medium", label: "Peer reviewed", count: filterCounts.relCounts.medium },
                  { id: "low", label: "Supporting", count: filterCounts.relCounts.low },
                ].map((item) => {
                  const active = selectedRelevance === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedRelevance(active ? "all" : (item.id as RelevanceFilter))}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors flex items-center gap-1.5 ${active ? "bg-amber-500/20 text-amber-300 border-amber-400/50 font-semibold" : "bg-[#141822] text-slate-300 border-white/[0.06] hover:border-white/[0.15]"}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-bold">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </details>

        <section aria-label="Study results" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                <strong className="text-white text-sm">{filteredRecords.length}</strong> records in evidence corpus
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="research-sort" className="text-slate-400 text-xs">Sort</label>
              <select
                id="research-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#0c0f16] text-slate-200 border border-white/[0.08] rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400/50 cursor-pointer"
              >
                <option value="relevance">Library order</option>
                <option value="oxygen_desc">Oxygen (High to Low)</option>
                <option value="oxygen_asc">Oxygen (Low to High)</option>
                <option value="pressure_desc">Pressure (High to Low)</option>
                <option value="name_asc">Title (A to Z)</option>
              </select>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-10 text-center rounded-lg border border-white/[0.08] bg-[#0c0f16]">
              <Info className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-300 text-sm">No investigations match the selected filters.</p>
              <button
                onClick={resetFilters}
                className="mt-3 px-3 py-1.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRecords.slice(0, visibleCount).map((rec, idx) => {
                  const isSelected = selectedIds.has(rec.id);
                  const outcome = getOutcome(rec);
                  const relevance = getRelevance(rec);

                  const pressureStr = rec.pressure_kpa != null ? `${rec.pressure_kpa} kPa` : "Not stated";
                  const oxygenStr = rec.oxygen_pct != null ? `${rec.oxygen_pct}%` : "Not stated";
                  const gravityStr = rec.gravity.replace(/_/g, " ");

                  return (
                    <FadeUp key={rec.id} delay={Math.min(idx * 0.03, 0.3)}>
                    <div
                      className={`rounded-lg border bg-[#13171e] p-5 flex flex-col justify-between transition-colors duration-150 hover:border-white/[0.2] ${isSelected ? "border-amber-400/30" : "border-white/[0.09]"}`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono mb-2.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-cyan-400 font-bold truncate">{rec.id.toUpperCase()}</span>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: outcome.dotColor }} />
                            <span className="text-slate-400 truncate">{outcome.label}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 flex-shrink-0">
                            <span>{rec.programme.split(" ")[0]}</span>
                            <span className="text-white/20">•</span>
                            <span className="truncate">{rec.platform}</span>
                          </div>
                        </div>

                        <h3 className="mb-3 text-sm font-semibold leading-snug text-slate-100">
                          <button type="button" onClick={() => onInspect(rec)} className="text-left hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">{rec.investigation}</button>
                        </h3>

                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-4">{rec.finding}</p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="text-slate-500">Conditions</span>
                          <span className="text-slate-300 truncate">{oxygenStr} O₂ · {pressureStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="text-slate-500">Source quality</span>
                          <span className={relevance === "high" ? "text-amber-400" : "text-cyan-400"}>
                            {relevance === "high" ? "NASA primary" : relevance === "medium" ? "Peer reviewed" : "Supporting"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <button
                            onClick={() => onInspect(rec)}
                            className="flex-1 py-1.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] text-center transition-colors"
                          >
                            View record
                          </button>

                          <button
                            onClick={() => onToggleSelect(rec.id)}
                            aria-pressed={isSelected}
                            className={`flex-1 py-1.5 rounded-md border text-center transition-colors font-medium ${isSelected ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold" : "bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border-white/[0.06]"}`}
                          >
                            {isSelected ? "✓ Comparing" : "+ Compare"}
                          </button>

                          <button
                            onClick={() => {
                              if (onAskAI) {
                                onAskAI(`Synthesize research findings for ${rec.investigation} (${rec.material} under ${rec.gravity}). What are the key fire safety limits?`);
                              }
                            }}
                            className="flex-1 py-1.5 rounded-md bg-[#141822] hover:bg-[#1d2331] text-cyan-300 border border-cyan-500/40 text-center font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <Bot className="w-3 h-3 text-cyan-400" />
                            <span>Ask AI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    </FadeUp>
                  );
                })}
              </div>
              {visibleCount < filteredRecords.length && (
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="rounded-md border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-200 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">Show more studies</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
