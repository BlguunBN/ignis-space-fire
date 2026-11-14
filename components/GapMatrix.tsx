"use client";

import React from "react";
import { Info, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface GapEntry {
  material: string;
  o2Regime: string;
  airflowRegime: string;
  evidenceStatus: "STRONG" | "MODERATE" | "SPARSE" | "UNTESTED";
  primaryProgramme: string;
  notes: string;
}

const MATRIX_DATA: GapEntry[] = [
  {
    material: "PMMA (Acrylic Polymer)",
    o2Regime: "21% (Standard ISS)",
    airflowRegime: "Low Flow (1-5 cm/s)",
    evidenceStatus: "STRONG",
    primaryProgramme: "BASS-II / MSG",
    notes: "Multiple documented burn runs, extinction quenching limits validated.",
  },
  {
    material: "PMMA (Acrylic Polymer)",
    o2Regime: "26% - 34% (Exploration)",
    airflowRegime: "Forced Flow (10-20 cm/s)",
    evidenceStatus: "MODERATE",
    primaryProgramme: "Saffire-IV / SoFIE",
    notes: "Flown on Saffire-IV and SoFIE-GEL; thick slab flammability boundaries established.",
  },
  {
    material: "Cotton-Fiberglass (SIBAL)",
    o2Regime: "21% (Standard ISS)",
    airflowRegime: "Forced Flow (15-20 cm/s)",
    evidenceStatus: "STRONG",
    primaryProgramme: "Saffire-I / Cygnus",
    notes: "Full-scale vehicle flight tests; 0.4m x 1.0m steady flame spread validated.",
  },
  {
    material: "Wire Insulation (PTFE / Kapton)",
    o2Regime: "21% (Standard ISS)",
    airflowRegime: "Quiescent to Low Flow",
    evidenceStatus: "STRONG",
    primaryProgramme: "SAME-R / MSG",
    notes: "Detailed smoke particle diameter distributions for detector sizing.",
  },
  {
    material: "Liquid Hydrocarbons (Heptane/Methanol)",
    o2Regime: "15% - 21%",
    airflowRegime: "Zero Flow (Quiescent)",
    evidenceStatus: "STRONG",
    primaryProgramme: "FLEX / CIR",
    notes: "Cool flames and CO2 gaseous suppression limits accurately mapped.",
  },
  {
    material: "Advanced Carbon Composites",
    o2Regime: "26% - 34% (Exploration)",
    airflowRegime: "Low Flow (< 5 cm/s)",
    evidenceStatus: "SPARSE",
    primaryProgramme: "Preliminary SoFIE",
    notes: "Limited orbital test data available; rely heavily on 1g parabolic flights.",
  },
  {
    material: "3D Printed Structural Polymers (PEEK/ULTEM)",
    o2Regime: "21% - 34%",
    airflowRegime: "Any Flow Velocity",
    evidenceStatus: "UNTESTED",
    primaryProgramme: "None in primary PSI",
    notes: "Major gap in publicly indexed microgravity databases; requires urgent test.",
  },
  {
    material: "Nomex / Aramid Flame-Resistant Fabrics",
    o2Regime: "30%+ Exploration Atmosphere",
    airflowRegime: "Zero to Low Flow",
    evidenceStatus: "SPARSE",
    primaryProgramme: "Saffire-II",
    notes: "Only limited strip burns conducted before extinction in lower O2.",
  },
];

export function GapMatrix() {
  const getBadge = (status: GapEntry["evidenceStatus"]) => {
    switch (status) {
      case "STRONG":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Strong Evidence
          </span>
        );
      case "MODERATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Info className="w-3.5 h-3.5" /> Moderate Coverage
          </span>
        );
      case "SPARSE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Sparse / Low Data
          </span>
        );
      case "UNTESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" /> Empirical Gap
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            NASA Microgravity Evidence Gap Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Highlighting areas where NASA has extensive sustained experimental flight data versus where evidence is currently sparse or untested for Exploration missions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Strong
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Sparse
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span> Gap
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <th className="py-2.5 px-3">Target Material</th>
              <th className="py-2.5 px-3">Atmosphere (O₂)</th>
              <th className="py-2.5 px-3">Airflow Regime</th>
              <th className="py-2.5 px-3">Indexed Evidence</th>
              <th className="py-2.5 px-3">Primary Investigation</th>
              <th className="py-2.5 px-3">Engineering Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {MATRIX_DATA.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-medium text-white">{row.material}</td>
                <td className="py-3 px-3">{row.o2Regime}</td>
                <td className="py-3 px-3">{row.airflowRegime}</td>
                <td className="py-3 px-3">{getBadge(row.evidenceStatus)}</td>
                <td className="py-3 px-3 text-cyan-400 font-mono text-[11px]">
                  {row.primaryProgramme}
                </td>
                <td className="py-3 px-3 text-slate-400 leading-snug">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
