"use client";

import React from "react";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { SearchQuery } from "../types/evidence";

interface SearchAndFiltersProps {
  query: SearchQuery;
  onChange: (query: SearchQuery) => void;
  onSelectPreset: (preset: SearchQuery) => void;
}

export function SearchAndFilters({ query, onChange, onSelectPreset }: SearchAndFiltersProps) {
  const PRESETS: { label: string; query: SearchQuery }[] = [
    {
      label: "Ventilation Flame Spread (Saffire vs BASS)",
      query: {
        freeText: "flame spread forced airflow",
        material: "PMMA",
        airflowCmS: 15,
        oxygenPct: 21,
      },
    },
    {
      label: "Exploration Atmospheres (26% O₂ / 56 kPa)",
      query: {
        freeText: "exploration atmosphere",
        oxygenPct: 26,
        pressureKpa: 57,
      },
    },
    {
      label: "Thick Fuel Extinction (SoFIE GEL)",
      query: {
        freeText: "extinction limit thick PMMA",
        material: "PMMA",
        oxygenPct: 34,
      },
    },
    {
      label: "Droplet Cool Flames (FLEX)",
      query: {
        freeText: "droplet cool flame",
        airflowCmS: 0,
      },
    },
  ];

  const hasActiveFilters = Boolean(
    query.freeText ||
    query.material ||
    query.oxygenPct != null ||
    query.airflowCmS != null ||
    query.pressureKpa != null
  );

  const clearAllFilters = () => {
    onChange({});
  };

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0c0f14] p-3.5 space-y-3">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query.freeText || ""}
          onChange={(e) => onChange({ ...query, freeText: e.target.value })}
          placeholder="Search NASA investigations, materials, flame phenomena..."
          className="w-full bg-[#13171e] border border-white/[0.08] rounded-md pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-colors font-sans"
        />
        {query.freeText && (
          <button
            onClick={() => onChange({ ...query, freeText: "" })}
            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="Clear search text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
        <span className="text-slate-400 mr-1 select-none">Presets:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPreset(p.query)}
            className="px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-slate-100 hover:border-white/[0.12] transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Physical Boundary Filters - Integrated Precision Instrument Strip */}
      <div className="pt-2 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            Physical Boundary Filters
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Tolerance: ±1% O₂ | ±3 cm/s</span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-0.5 ml-1"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* Fuel / Material */}
          <div className="bg-[#13171e] rounded p-2 border border-white/[0.06] focus-within:border-white/[0.15] transition-colors">
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              Material
            </label>
            <input
              type="text"
              value={query.material || ""}
              onChange={(e) => onChange({ ...query, material: e.target.value })}
              placeholder="e.g. PMMA, SIBAL"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs"
            />
          </div>

          {/* Oxygen % */}
          <div className="bg-[#13171e] rounded p-2 border border-white/[0.06] focus-within:border-white/[0.15] transition-colors">
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Oxygen</span>
              <span className="text-cyan-400 font-medium">
                {query.oxygenPct != null ? `${query.oxygenPct}%` : "Any"}
              </span>
            </label>
            <input
              type="number"
              min={15}
              max={40}
              step={1}
              value={query.oxygenPct != null ? query.oxygenPct : ""}
              onChange={(e) =>
                onChange({
                  ...query,
                  oxygenPct: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="15 – 40 %"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs"
            />
          </div>

          {/* Airflow cm/s */}
          <div className="bg-[#13171e] rounded p-2 border border-white/[0.06] focus-within:border-white/[0.15] transition-colors">
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Airflow</span>
              <span className="text-cyan-400 font-medium">
                {query.airflowCmS != null ? `${query.airflowCmS} cm/s` : "Any"}
              </span>
            </label>
            <input
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={query.airflowCmS != null ? query.airflowCmS : ""}
              onChange={(e) =>
                onChange({
                  ...query,
                  airflowCmS: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="0 – 25 cm/s"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs"
            />
          </div>

          {/* Pressure kPa */}
          <div className="bg-[#13171e] rounded p-2 border border-white/[0.06] focus-within:border-white/[0.15] transition-colors">
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
              <span>Pressure</span>
              <span className="text-cyan-400 font-medium">
                {query.pressureKpa != null ? `${query.pressureKpa} kPa` : "Any"}
              </span>
            </label>
            <input
              type="number"
              min={40}
              max={110}
              step={1}
              value={query.pressureKpa != null ? query.pressureKpa : ""}
              onChange={(e) =>
                onChange({
                  ...query,
                  pressureKpa: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="40 – 102 kPa"
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
