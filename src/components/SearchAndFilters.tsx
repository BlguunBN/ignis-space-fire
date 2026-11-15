"use client";

import React, { useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Layers,
  Wind,
  Flame,
  Gauge,
  Check,
  ChevronDown,
  Filter,
} from "lucide-react";
import { SearchQuery, SortOption } from "../types/evidence";

interface SearchAndFiltersProps {
  query: SearchQuery;
  onChange: (query: SearchQuery) => void;
  onSelectPreset: (preset: SearchQuery) => void;
  totalCount?: number;
  filteredCount?: number;
}

const PRESETS: { label: string; description: string; query: SearchQuery }[] = [
  {
    label: "Ventilation Flame Spread (Saffire vs BASS)",
    description: "Concurrent/opposed airflow comparison on PMMA and fabric samples",
    query: {
      freeText: "flame spread forced airflow",
      material: "PMMA",
      airflowCmS: 15,
      oxygenPct: 21,
      sortBy: "airflow_desc",
    },
  },
  {
    label: "Moon base air (≥30% O₂ / ≤70 kPa)",
    description: "NASA EVA and exploration habitat reduced-pressure flammability",
    query: {
      freeText: "exploration atmosphere",
      oxygenPct: 26,
      pressureKpa: 57,
      toleranceMode: "standard",
      sortBy: "oxygen_desc",
    },
  },
  {
    label: "Thick Fuel Extinction (SoFIE GEL)",
    description: "Solid fuel boundary extinction limits at elevated oxidizer concentrations",
    query: {
      freeText: "extinction limit thick PMMA",
      material: "PMMA",
      oxygenPct: 34,
      sortBy: "oxygen_desc",
    },
  },
  {
    label: "Droplet Cool Flames (FLEX)",
    description: "Low-temperature second-stage combustion in quiescent microgravity",
    query: {
      freeText: "droplet cool flame",
      airflowCmS: 0,
      material: "Methanol",
      sortBy: "oxygen_asc",
    },
  },
];

const QUICK_SEARCH_CHIPS = [
  { label: "PMMA", type: "material", value: "PMMA" },
  { label: "Cotton / SIBAL", type: "material", value: "SIBAL" },
  { label: "Methanol Droplets", type: "material", value: "Methanol" },
  { label: "Cool Flames", type: "freeText", value: "cool flame" },
  { label: "Extinction Limit", type: "freeText", value: "extinction" },
  { label: "Quiescent (0 cm/s)", type: "airflow", value: 0 },
  { label: "Forced Flow (15+ cm/s)", type: "airflow", value: 15 },
  { label: "Exploration (26% O₂)", type: "oxygen", value: 26 },
];

const FACILITIES = [
  { id: "all", label: "All Facilities" },
  { id: "saffire", label: "Cygnus Saffire (Large Scale)" },
  { id: "cir", label: "ISS CIR (MDCA Droplets)" },
  { id: "msg", label: "ISS MSG (BASS Flame Spread)" },
];

const GRAVITIES = [
  { id: "all", label: "All Regimes" },
  { id: "microgravity", label: "Microgravity (μg)" },
  { id: "partial_gravity", label: "Partial-g (Lunar / Mars)" },
];

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: "relevance", label: "Relevance / Flight Index", icon: "relevance" },
  { id: "oxygen_desc", label: "Oxygen % (High → Low)", icon: "desc" },
  { id: "oxygen_asc", label: "Oxygen % (Low → High)", icon: "asc" },
  { id: "airflow_desc", label: "Airflow (Fast → Slow)", icon: "desc" },
  { id: "airflow_asc", label: "Airflow (Slow → Fast)", icon: "asc" },
  { id: "pressure_desc", label: "Pressure (High → Low)", icon: "desc" },
  { id: "pressure_asc", label: "Pressure (Low → High)", icon: "asc" },
  { id: "name_asc", label: "Investigation Name (A → Z)", icon: "asc" },
  { id: "name_desc", label: "Investigation Name (Z → A)", icon: "desc" },
];

export function SearchAndFilters({
  query,
  onChange,
  onSelectPreset,
  totalCount = 50,
  filteredCount = 50,
}: SearchAndFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentSort = query.sortBy || "relevance";
  const tolerance = query.toleranceMode || "standard";

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    query.freeText ||
    query.material ||
    query.facility ||
    query.gravity ||
    query.pillar ||
    query.oxygenPct != null ||
    query.airflowCmS != null ||
    query.pressureKpa != null ||
    (query.sortBy && query.sortBy !== "relevance")
  );

  const clearAllFilters = () => {
    onChange({
      sortBy: "relevance",
      toleranceMode: "standard",
    });
  };

  const handleChipClick = (chip: (typeof QUICK_SEARCH_CHIPS)[number]) => {
    if (chip.type === "material") {
      onChange({ ...query, material: chip.value as string });
    } else if (chip.type === "airflow") {
      onChange({ ...query, airflowCmS: chip.value as number });
    } else if (chip.type === "oxygen") {
      onChange({ ...query, oxygenPct: chip.value as number });
    } else if (chip.type === "freeText") {
      onChange({ ...query, freeText: chip.value as string });
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0f14] p-3.5 md:p-4 space-y-3.5 font-sans shadow-lg">
      {/* 1. SEARCH INPUT & INSTANT ACTIONS */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query.freeText || ""}
            onChange={(e) => onChange({ ...query, freeText: e.target.value })}
            placeholder="Search NASA investigations, materials, flame phenomena (e.g. Saffire PMMA flame spread)..."
            className="w-full bg-[#13171e] border border-white/[0.08] rounded-lg pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all font-sans"
          />
          {query.freeText && (
            <button
              onClick={() => onChange({ ...query, freeText: "" })}
              className="absolute right-3 text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Clear search text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Topic Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider mr-1 select-none flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick:
          </span>
          {QUICK_SEARCH_CHIPS.map((chip, idx) => {
            const isSelected =
              (chip.type === "material" && query.material === chip.value) ||
              (chip.type === "airflow" && query.airflowCmS === chip.value) ||
              (chip.type === "oxygen" && query.oxygenPct === chip.value) ||
              (chip.type === "freeText" && query.freeText === chip.value);

            return (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors border ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-semibold"
                    : "bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 border-white/[0.06]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RESEARCH PRESET BENCHMARKS */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-amber-400" />
            Curated Research Presets:
          </span>
          <span className="text-[10px] font-mono text-slate-500">Authentic NASA flight inquiries</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPreset(p.query)}
              className="text-left px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-400/30 group transition-all"
            >
              <div className="text-slate-200 group-hover:text-amber-300 font-medium truncate flex items-center justify-between">
                <span>{p.label}</span>
                <span className="text-[9px] text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Apply →</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. FACILITY & GRAVITY REGIME PILLS */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        {/* Facility filter */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-[10px] uppercase mr-1">Facility:</span>
          <div className="flex rounded-md bg-[#13171e] p-0.5 border border-white/[0.06]">
            {FACILITIES.map((f) => {
              const active = (query.facility || "all") === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() =>
                    onChange({
                      ...query,
                      facility: f.id === "all" ? undefined : f.id,
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.id === "all" ? "All" : f.label.split(" ")[1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gravity filter */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 text-[10px] uppercase mr-1">Regime:</span>
          <div className="flex rounded-md bg-[#13171e] p-0.5 border border-white/[0.06]">
            {GRAVITIES.map((g) => {
              const active = (query.gravity || "all") === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() =>
                    onChange({
                      ...query,
                      gravity: g.id === "all" ? undefined : (g.id as any),
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    active
                      ? "bg-amber-500/20 text-amber-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {g.id === "all" ? "All" : g.id === "microgravity" ? "μg (0g)" : "Partial-g"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PHYSICAL BOUNDARY FILTERS & TOLERANCE STRIP */}
      <div className="pt-2 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Physical Boundary Filters
          </span>

          <div className="flex items-center gap-3">
            {/* Tolerance Selector */}
            <div className="flex items-center gap-1 bg-[#13171e] px-2 py-0.5 rounded border border-white/[0.06] text-[10px]">
              <span className="text-slate-500 uppercase mr-1">Tolerance:</span>
              <button
                onClick={() => onChange({ ...query, toleranceMode: "strict" })}
                className={`px-1.5 py-0.5 rounded ${
                  tolerance === "strict"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Strict: ±0.5% O₂, ±1 cm/s, ±5 kPa"
              >
                Strict (±0.5%)
              </button>
              <button
                onClick={() => onChange({ ...query, toleranceMode: "standard" })}
                className={`px-1.5 py-0.5 rounded ${
                  tolerance === "standard"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Standard: ±1.5% O₂, ±3 cm/s, ±10 kPa"
              >
                Standard (±1.5%)
              </button>
              <button
                onClick={() => onChange({ ...query, toleranceMode: "wide" })}
                className={`px-1.5 py-0.5 rounded ${
                  tolerance === "wide"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Wide: ±3.0% O₂, ±6 cm/s, ±20 kPa"
              >
                Wide (±3.0%)
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-0.5 font-semibold"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset All
              </button>
            )}
          </div>
        </div>

        {/* 4 Instrument Grid Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* Material Input */}
          <div className="bg-[#13171e] rounded-lg p-2 border border-white/[0.06] focus-within:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              <span>Material</span>
              {query.material && (
                <button
                  onClick={() => onChange({ ...query, material: "" })}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={query.material || ""}
              onChange={(e) => onChange({ ...query, material: e.target.value })}
              placeholder="e.g. PMMA, SIBAL"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-medium"
            />
            {/* Quick Material presets */}
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-500">
              <button
                onClick={() => onChange({ ...query, material: "PMMA" })}
                className="hover:text-cyan-300 underline"
              >
                PMMA
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, material: "SIBAL" })}
                className="hover:text-cyan-300 underline"
              >
                SIBAL
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, material: "Methanol" })}
                className="hover:text-cyan-300 underline"
              >
                Methanol
              </button>
            </div>
          </div>

          {/* Oxygen % Input */}
          <div className="bg-[#13171e] rounded-lg p-2 border border-white/[0.06] focus-within:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              <span>Oxygen</span>
              <span className="text-cyan-400 font-bold">
                {query.oxygenPct != null ? `${query.oxygenPct}%` : "Any"}
              </span>
            </div>
            <input
              type="number"
              min={10}
              max={50}
              step={1}
              value={query.oxygenPct != null ? query.oxygenPct : ""}
              onChange={(e) =>
                onChange({
                  ...query,
                  oxygenPct: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="10 – 40 %"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-medium"
            />
            {/* Quick Oxygen presets */}
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-500">
              <button
                onClick={() => onChange({ ...query, oxygenPct: 21 })}
                className="hover:text-cyan-300 underline"
              >
                21% Air
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, oxygenPct: 26 })}
                className="hover:text-cyan-300 underline"
              >
                26% Expl
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, oxygenPct: 34 })}
                className="hover:text-cyan-300 underline"
              >
                34%
              </button>
            </div>
          </div>

          {/* Airflow Velocity Input */}
          <div className="bg-[#13171e] rounded-lg p-2 border border-white/[0.06] focus-within:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              <span>Airflow</span>
              <span className="text-cyan-400 font-bold">
                {query.airflowCmS != null ? `${query.airflowCmS} cm/s` : "Any"}
              </span>
            </div>
            <input
              type="number"
              min={0}
              max={35}
              step={0.5}
              value={query.airflowCmS != null ? query.airflowCmS : ""}
              onChange={(e) =>
                onChange({
                  ...query,
                  airflowCmS: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="0 – 25 cm/s"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-medium"
            />
            {/* Quick Airflow presets */}
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-500">
              <button
                onClick={() => onChange({ ...query, airflowCmS: 0 })}
                className="hover:text-cyan-300 underline"
              >
                0 cm/s
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, airflowCmS: 5 })}
                className="hover:text-cyan-300 underline"
              >
                5 cm/s
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, airflowCmS: 15 })}
                className="hover:text-cyan-300 underline"
              >
                15 cm/s
              </button>
            </div>
          </div>

          {/* Pressure kPa Input */}
          <div className="bg-[#13171e] rounded-lg p-2 border border-white/[0.06] focus-within:border-cyan-400/50 transition-colors">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              <span>Pressure</span>
              <span className="text-cyan-400 font-bold">
                {query.pressureKpa != null ? `${query.pressureKpa} kPa` : "Any"}
              </span>
            </div>
            <input
              type="number"
              min={30}
              max={120}
              step={1}
              value={query.pressureKpa != null ? query.pressureKpa : ""}
              onChange={(e) =>
                onChange({
                  ...query,
                  pressureKpa: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="40 – 102 kPa"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-medium"
            />
            {/* Quick Pressure presets */}
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-500">
              <button
                onClick={() => onChange({ ...query, pressureKpa: 57 })}
                className="hover:text-cyan-300 underline"
              >
                57 kPa
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, pressureKpa: 70 })}
                className="hover:text-cyan-300 underline"
              >
                70 kPa
              </button>
              <span>·</span>
              <button
                onClick={() => onChange({ ...query, pressureKpa: 101.3 })}
                className="hover:text-cyan-300 underline"
              >
                101 kPa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SMART SORTING & ACTIVE CRITERIA BAR */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] flex items-center gap-1 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            Sort by:
          </span>
          <select
            value={currentSort}
            onChange={(e) => onChange({ ...query, sortBy: e.target.value as SortOption })}
            className="bg-[#13171e] text-slate-200 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-amber-400/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#13171e] text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Quick toggle for Oxygen or Airflow */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() =>
                onChange({
                  ...query,
                  sortBy: currentSort === "oxygen_desc" ? "oxygen_asc" : "oxygen_desc",
                })
              }
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                currentSort.startsWith("oxygen")
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                  : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-slate-200"
              }`}
            >
              <span>O₂</span>
              {currentSort === "oxygen_asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            </button>

            <button
              onClick={() =>
                onChange({
                  ...query,
                  sortBy: currentSort === "airflow_desc" ? "airflow_asc" : "airflow_desc",
                })
              }
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                currentSort.startsWith("airflow")
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                  : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-slate-200"
              }`}
            >
              <span>Flow</span>
              {currentSort === "airflow_asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
            </button>

            <button
              onClick={() =>
                onChange({
                  ...query,
                  sortBy: currentSort === "name_asc" ? "name_desc" : "name_asc",
                })
              }
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors flex items-center gap-1 ${
                currentSort.startsWith("name")
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-slate-200"
              }`}
            >
              <span>A–Z</span>
            </button>
          </div>
        </div>

        {/* Real-time Match Count Metric */}
        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
          <span>
            Matched: <strong className="text-cyan-400 font-bold">{filteredCount}</strong> of {totalCount} ({Math.round((filteredCount / (totalCount || 1)) * 100)}%)
          </span>
        </div>
      </div>

      {/* 6. ACTIVE FILTER TAGS PILL HUD */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="text-slate-500 uppercase">Active Filters:</span>

          {query.freeText && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              Query: &quot;{query.freeText}&quot;
              <button
                onClick={() => onChange({ ...query, freeText: "" })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {query.material && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              Material: {query.material}
              <button
                onClick={() => onChange({ ...query, material: "" })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {query.oxygenPct != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              O₂: {query.oxygenPct}%
              <button
                onClick={() => onChange({ ...query, oxygenPct: null })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {query.airflowCmS != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              Flow: {query.airflowCmS} cm/s
              <button
                onClick={() => onChange({ ...query, airflowCmS: null })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {query.pressureKpa != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              Pressure: {query.pressureKpa} kPa
              <button
                onClick={() => onChange({ ...query, pressureKpa: null })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {query.facility && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30">
              Facility: {query.facility.toUpperCase()}
              <button
                onClick={() => onChange({ ...query, facility: undefined })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {query.gravity && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30">
              Regime: {query.gravity}
              <button
                onClick={() => onChange({ ...query, gravity: undefined })}
                className="hover:text-white"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-amber-400 hover:text-amber-300 hover:underline ml-1 font-semibold"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
