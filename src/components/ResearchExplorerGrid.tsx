"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { ExperimentRecord } from "../types/evidence";

interface ResearchExplorerGridProps {
  records: ExperimentRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onInspect: (record: ExperimentRecord) => void;
  onOpenPdf: (record: ExperimentRecord) => void;
}

type Pillar = "All" | "Prevention" | "Detection" | "Suppression" | "Partial-g Simulation";
type Facility = "All" | "ISS CIR" | "ISS MSG" | "Cygnus Saffire";

export function ResearchExplorerGrid({
  records,
  selectedIds,
  onToggleSelect,
  onInspect,
  onOpenPdf,
}: ResearchExplorerGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("All");
  const [selectedFacility, setSelectedFacility] = useState<Facility>("All");

  // Derive Pillar for each record
  const getPillar = (record: ExperimentRecord): Pillar => {
    const text = `${record.investigation} ${record.finding} ${record.material} ${record.fire_safety_relevance}`.toLowerCase();
    if (record.gravity === "partial_gravity" || text.includes("lunar") || text.includes("moon") || text.includes("mars")) {
      return "Partial-g Simulation";
    }
    if (text.includes("smoke") || text.includes("aerosol") || text.includes("detector") || text.includes("daft")) {
      return "Detection";
    }
    if (text.includes("extinguish") || text.includes("suppression") || text.includes("quench") || text.includes("nitrogen jet")) {
      return "Suppression";
    }
    return "Prevention";
  };

  // Derive Facility for each record
  const getFacility = (record: ExperimentRecord): { tag: string; chamber: string } => {
    const p = record.platform.toLowerCase();
    const inv = record.investigation.toLowerCase();
    if (p.includes("cygnus") || inv.includes("saffire")) {
      return { tag: "Cygnus Saffire", chamber: "Cygnus Flight Duct" };
    }
    if (p.includes("cir") || inv.includes("flex") || inv.includes("acme") || inv.includes("slice") || inv.includes("cfi")) {
      return { tag: "ISS CIR", chamber: "CIR MDCA / ACME" };
    }
    if (p.includes("msg") || inv.includes("bass") || inv.includes("same")) {
      return { tag: "ISS MSG", chamber: "MSG Flow Duct" };
    }
    return { tag: "NASA Facility", chamber: "Orbital Environmental Rig" };
  };

  // Derive Flow Banner text
  const getFlowBanner = (record: ExperimentRecord): string => {
    if (record.airflow_cm_s === 0 || record.material_class === "liquid_droplet") {
      return "FLOW: 0.0 cm/s (Quiescent)";
    }
    if (record.airflow_cm_s != null) {
      if (record.investigation.toLowerCase().includes("opposed")) {
        return `FLOW: ${record.airflow_cm_s.toFixed(1)} cm/s (Opposed Flow)`;
      }
      return `FLOW: ${record.airflow_cm_s.toFixed(1)} cm/s (Concurrent Flow)`;
    }
    if (record.investigation.toLowerCase().includes("smoke")) {
      return "FLOW: 5.0 cm/s (Ventilated / Fan-Driven)";
    }
    return "FLOW: Low Forced Airflow (1.0 to 15.0 cm/s)";
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.investigation.toLowerCase().includes(q) ||
        r.programme.toLowerCase().includes(q) ||
        r.material.toLowerCase().includes(q) ||
        r.finding.toLowerCase().includes(q);

      const pillar = getPillar(r);
      const matchPillar = selectedPillar === "All" || pillar === selectedPillar;

      const facility = getFacility(r);
      const matchFacility = selectedFacility === "All" || facility.tag === selectedFacility;

      return matchSearch && matchPillar && matchFacility;
    });
  }, [records, searchQuery, selectedPillar, selectedFacility]);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Search Input (Matching Image 3) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by acronym (BASS, Saffire, FLEX, SAME), fuel, or hardware..."
          className="w-full bg-[#0c0f16] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-sans"
        />
      </div>

      {/* Filter Row: Pillar + Facility */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-white/[0.06] bg-[#0c0f16]">
        {/* Pillar Filters */}
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
          <span className="text-slate-400 font-medium mr-1">Pillar:</span>
          {(["All", "Prevention", "Detection", "Suppression", "Partial-g Simulation"] as const).map((pillar) => (
            <button
              key={pillar}
              onClick={() => setSelectedPillar(pillar)}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedPillar === pillar
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
              }`}
            >
              {pillar}
            </button>
          ))}
        </div>

        {/* Facility Filters */}
        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
          <span className="text-slate-400 font-medium mr-1">Facility:</span>
          {(["All", "ISS CIR", "ISS MSG", "Cygnus Saffire"] as const).map((fac) => (
            <button
              key={fac}
              onClick={() => setSelectedFacility(fac)}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedFacility === fac
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
              }`}
            >
              {fac}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>Displaying {filteredRecords.length} of {records.length} Verified Flight Investigations</span>
        <span>Click 'Deep Inspector' for original NASA PDF Coordinates</span>
      </div>

      {/* 3-Column Card Grid (Matching Image 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((rec) => {
          const isSelected = selectedIds.has(rec.id);
          const pillar = getPillar(rec);
          const facility = getFacility(rec);
          const flowText = getFlowBanner(rec);

          return (
            <div
              key={rec.id}
              className={`rounded-lg border bg-[#0c0f16] flex flex-col justify-between overflow-hidden transition-all duration-150 hover:border-cyan-500/40 ${
                isSelected ? "border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "border-white/[0.08]"
              }`}
            >
              {/* Card Flame Banner with Flow Velocity Overlay (Image 3) */}
              <div className="relative h-28 bg-gradient-to-b from-[#0a0d14] via-[#0d1424] to-[#080b12] overflow-hidden flex flex-col justify-between p-2.5 border-b border-white/[0.06]">
                {/* Visual Flame Graphic (Synthesized CSS Flame Spectrum) */}
                <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-85">
                  <div className="w-12 h-16 rounded-full bg-gradient-to-t from-cyan-400 via-amber-400 to-transparent blur-[2px] transform -translate-y-1" />
                  <div className="w-16 h-20 rounded-full bg-gradient-to-t from-blue-500 via-orange-400 to-transparent blur-[3px]" />
                  <div className="w-14 h-16 rounded-full bg-gradient-to-t from-cyan-400 via-amber-300 to-transparent blur-[2px] transform translate-y-1" />
                </div>

                {/* Banner Top Controls: Pillar Badge + Compare Button */}
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                      pillar === "Prevention"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : pillar === "Detection"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : pillar === "Suppression"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{pillar}</span>
                  </span>

                  <button
                    onClick={() => onToggleSelect(rec.id)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-black/60 hover:bg-black/80 text-slate-300 border border-white/[0.15]"
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{isSelected ? "Selected" : "+ Compare"}</span>
                  </button>
                </div>

                {/* Flow Speed Indicator Callout on Banner Bottom */}
                <div className="relative z-10 text-[10px] font-mono text-amber-300 font-bold drop-shadow flex items-center gap-1">
                  <Wind className="w-3 h-3" />
                  <span>{flowText}</span>
                </div>
              </div>

              {/* Card Main Content */}
              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Facility Sub-header */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="text-cyan-400 font-medium">{facility.tag}</span>
                    <span className="text-slate-500">{facility.chamber}</span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onInspect(rec)}
                    className="text-xs font-semibold font-sans text-slate-100 hover:text-cyan-300 cursor-pointer transition-colors line-clamp-2"
                  >
                    {rec.investigation}
                  </h3>

                  {/* Fuel Material */}
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    <span className="text-slate-400 font-semibold">FUEL: </span>
                    <span className="text-slate-300">{rec.material}</span>
                  </div>

                  {/* Telemetry Summary */}
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {rec.oxygen_pct != null ? `${rec.oxygen_pct}% O₂` : "Amb. O₂"} ·{" "}
                    {rec.pressure_kpa != null ? `${rec.pressure_kpa} kPa` : "101.3 kPa"} ·{" "}
                    {rec.platform}
                  </div>

                  {/* Paragraph Summary */}
                  <p className="text-[11px] text-slate-400 font-sans mt-2 line-clamp-3 leading-relaxed">
                    {rec.finding}
                  </p>
                </div>

                {/* Safety Finding Highlight Box (Image 3) */}
                <div className="mt-2 p-2.5 rounded bg-cyan-950/20 border border-cyan-500/20 text-[11px] font-sans text-cyan-200">
                  <span className="text-[9px] font-mono text-cyan-400 font-bold block uppercase tracking-wider mb-0.5">
                    SAFETY FINDING:
                  </span>
                  <p className="text-[10px] line-clamp-2 text-slate-300 leading-normal">
                    {rec.fire_safety_relevance}
                  </p>
                </div>

                {/* Card Footer Actions: Deep Inspector & PSI Link */}
                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <button
                    onClick={() => onOpenPdf(rec)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Deep Inspector</span>
                  </button>

                  <a
                    href={rec.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span>PSI Entry</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
