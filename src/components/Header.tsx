"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Flame,
  RotateCcw,
  FileText,
  Compass,
  Grid3X3,
  BookOpen,
  ArrowRightLeft,
  Network,
  Bot,
} from "lucide-react";

interface HeaderProps {
  corpusCount: number;
  onReset: () => void;
  onOpenBrief: () => void;
  onOpenCompare: () => void;
  onOpenCoverage: () => void;
  onOpenSources: () => void;
  onOpenWhiteboard?: () => void;
  onOpenAssistant?: () => void;
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
  onOpenWhiteboard,
  onOpenAssistant,
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
    <header className="border-b border-white/[0.08] bg-[#090a0d]/95 backdrop-blur-md px-4 py-2 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4 max-w-[1750px] mx-auto">
        {/* Left Branding - Minimalist Aerospace Identity */}
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold tracking-wider text-slate-100">
              IGNIS
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-1 py-0.2 rounded">
              v2.0
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 font-sans border-l border-white/10 pl-2 ml-1">
              Microgravity Combustion Intelligence
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => {}}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
              activeView === "workspace"
                ? "text-slate-100 bg-white/[0.06] font-medium border border-white/[0.08]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Workspace</span>
          </button>

          <button
            onClick={onOpenWhiteboard}
            className="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>Research Studio</span>
          </button>

          <button
            onClick={onOpenCoverage}
            className="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors"
          >
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coverage Matrix</span>
          </button>

          <button
            onClick={onOpenSources}
            className="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sources & Methods</span>
          </button>
        </nav>

        {/* Right Telemetry & Actions */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          {/* Live Status Telemetry */}
          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[11px] px-2.5 py-1 rounded border border-white/[0.06] bg-white/[0.02]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{corpusCount} Verified Studies</span>
            <span className="text-white/10">•</span>
            <span className="text-slate-400 tabular-nums">{time || "00:00:00 UTC"}</span>
          </div>

          {/* Reset Filters */}
          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] rounded border border-white/[0.06] transition-colors"
            title="Reset filters and selections"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* AI Assistant Drawer Trigger */}
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition-colors font-medium"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Assistant</span>
            </button>
          )}

          {/* Compare Trigger (Contextual when >= 2 selected) */}
          {selectedCount >= 2 && (
            <button
              onClick={onOpenCompare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Compare ({selectedCount})</span>
            </button>
          )}

          {/* Primary Action - Evidence Brief */}
          <button
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold transition-all shadow-sm shadow-amber-400/20 active:translate-y-px"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evidence Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
}
