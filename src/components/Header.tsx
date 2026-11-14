"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Flame, Compass, RefreshCw, FileText } from "lucide-react";

interface HeaderProps {
  corpusCount: number;
  onReset: () => void;
  onOpenBrief: () => void;
  selectedCount: number;
}

export function Header({ corpusCount, onReset, onOpenBrief, selectedCount }: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(new Date().toUTCString().replace("GMT", "UTC"));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 py-3 sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-white">
                IGNIS <span className="text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">2.0</span>
              </span>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                // NASA Space Apps Flame in Freefall
              </span>
            </div>
            <p className="text-xs text-slate-400">Microgravity Combustion Intelligence & Evidence Triage</p>
          </div>
        </div>

        {/* Center telemetry stats */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Corpus: <strong className="text-emerald-400">{corpusCount}</strong> Verified Investigations</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{time || "UTC CLOCK"}</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded border border-slate-800 transition-colors"
            title="Reset Search and Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onOpenBrief}
            className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded shadow-sm shadow-amber-400/20 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evidence Brief {selectedCount > 0 && `(${selectedCount})`}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
