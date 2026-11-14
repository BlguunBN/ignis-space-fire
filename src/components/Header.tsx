"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Flame,
  Compass,
  RefreshCw,
  FileText,
  Grid3X3,
  BookOpen,
  ArrowRightLeft,
} from "lucide-react";

interface HeaderProps {
  corpusCount: number;
  onReset: () => void;
  onOpenBrief: () => void;
  onOpenCompare: () => void;
  onOpenCoverage: () => void;
  onOpenSources: () => void;
  selectedCount: number;
  activeView: "workspace" | "coverage" | "sources";
}

export function Header({
  corpusCount,
  onReset,
  onOpenBrief,
  onOpenCompare,
  onOpenCoverage,
  onOpenSources,
  selectedCount,
  activeView,
}: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 19) + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-white/10 bg-[#06080B]/90 backdrop-blur-xl px-4 py-2.5 sticky top-0 z-40 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1750px] mx-auto">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40">
            <Flame className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-slate-100">
                IGNIS <span className="text-amber-400 text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/30">2.0</span>
              </span>
              <span className="hidden xl:inline-block text-[11px] font-mono text-slate-400">
                NASA Space Apps • Flame in Freefall
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Microgravity Combustion Intelligence & Evidence Triage</p>
          </div>
        </div>

        {/* Center Navigation Tabs (The 3 Persistent Destinations) */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => {}}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
              activeView === "workspace"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Research Workspace</span>
          </button>

          <button
            onClick={onOpenCoverage}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coverage & Gap Matrix</span>
          </button>

          <button
            onClick={onOpenSources}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sources & Methods</span>
          </button>
        </nav>

        {/* Right Telemetry & Actions */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span><strong className="text-emerald-400">{corpusCount}</strong> Verified Studies</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">{time || "00:00:00 UTC"}</span>
          </div>

          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-white/10 transition-colors"
            title="Reset Filters and State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {selectedCount >= 2 && (
            <button
              onClick={onOpenCompare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold transition-all animate-in fade-in"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Compare ({selectedCount})</span>
            </button>
          )}

          <button
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evidence Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
}
