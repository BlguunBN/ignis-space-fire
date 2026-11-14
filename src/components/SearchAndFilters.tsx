"use client";

import React from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
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

  return (
    <div className="space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query.freeText || ""}
          onChange={(e) => onChange({ ...query, freeText: e.target.value })}
          placeholder="Search NASA investigations, fuels, flame phenomena, or mission keywords..."
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 font-sans"
        />
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPreset(p.query)}
            className={`text-[11px] font-mono px-2 py-0.5 rounded-full border transition-all ${
              idx === 0
                ? "bg-amber-400/10 text-amber-300 border-amber-400/40 hover:bg-amber-400/20 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
            }`}
          >
            {idx === 0 ? "★ " : ""}{p.label}
          </button>
        ))}
      </div>

      {/* Physics Condition Controls */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1 text-slate-300">
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            Physical Boundary Filters
          </span>
          <span className="text-slate-400">Match Tolerance: ±1% O₂ | ±3 cm/s flow</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {/* Material */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Fuel / Material</label>
            <input
              type="text"
              value={query.material || ""}
              onChange={(e) => onChange({ ...query, material: e.target.value })}
              placeholder="e.g. PMMA, SIBAL"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Oxygen % */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              Oxygen: <span className="text-cyan-400">{query.oxygenPct != null ? `${query.oxygenPct}%` : "Any"}</span>
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
              placeholder="e.g. 21"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Airflow cm/s */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              Airflow: <span className="text-cyan-400">{query.airflowCmS != null ? `${query.airflowCmS} cm/s` : "Any"}</span>
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
              placeholder="e.g. 15"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Pressure kPa */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              Pressure: <span className="text-cyan-400">{query.pressureKpa != null ? `${query.pressureKpa} kPa` : "Any"}</span>
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
              placeholder="e.g. 101.3"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
