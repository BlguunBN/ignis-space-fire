"use client";

import React, { useState } from "react";
import { ArrowRightLeft, BookOpen, Bot, Columns, Compass, FileText, FileUp, Flame, Grid3X3, LayoutDashboard, Menu, Network, RotateCcw, Share2, X } from "lucide-react";

interface HeaderProps {
  corpusCount: number;
  onReset: () => void;
  onOpenBrief: () => void;
  onOpenCompare: () => void;
  onOpenCoverage: () => void;
  onOpenSources: () => void;
  onOpenWhiteboard?: () => void;
  onOpenAssistant?: () => void;
  onOpenGraph?: () => void;
  onOpenIngestion?: () => void;
  onOpenSimulator?: () => void;
  onOpenUpload?: () => void;
  selectedCount: number;
  activeView: "workspace" | "coverage" | "sources";
  activeMainView?: "dashboard" | "explorer" | "split";
  onSelectView?: (view: "dashboard" | "explorer" | "split") => void;
}

export function Header({ corpusCount, onReset, onOpenBrief, onOpenCompare, onOpenCoverage, onOpenSources, onOpenWhiteboard, onOpenAssistant, onOpenGraph, onOpenIngestion, onOpenSimulator, onOpenUpload, selectedCount, activeMainView, onSelectView }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const closeAfter = (action?: () => void) => () => { action?.(); setOpen(false); };
  const item = (label: string, Icon: typeof Flame, action?: () => void, active = false) => action && (
    <button type="button" onClick={closeAfter(action)} aria-current={active ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${active ? "bg-white/[0.09] text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"}`}>
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-amber-400" : "text-slate-500"}`} /><span>{label}</span>
    </button>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#0c0e12]/95 px-5 backdrop-blur md:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em]"><Flame className="h-5 w-5 text-amber-400" /> IGNIS</span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="workspace-navigation" className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Menu className="h-5 w-5" /></button>
      </div>
      {open && <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/70 md:hidden" />}
      <aside id="workspace-navigation" className={`${open ? "translate-x-0" : "invisible -translate-x-full md:visible"} fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.08] bg-[#101216] px-4 py-6 transition-transform duration-200 motion-reduce:transition-none md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0`}>
        <div className="mb-9 flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><Flame className="h-5 w-5" /></div><div><div className="text-sm font-semibold tracking-[0.18em] text-white">IGNIS</div><div className="mt-0.5 text-[11px] text-slate-500">Research workspace</div></div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-lg p-2 text-slate-400 md:hidden"><X className="h-4 w-4" /></button>
        </div>
        <nav aria-label="Workspace navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto">
          <div><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            {item("Overview", LayoutDashboard, onSelectView ? () => onSelectView("dashboard") : undefined, activeMainView === "dashboard")}
            {item("Explore", Compass, onSelectView ? () => onSelectView("explorer") : undefined, activeMainView === "explorer")}
            {item("Analysis", Columns, onSelectView ? () => onSelectView("split") : undefined, activeMainView === "split")}
            {item("AI Assistant", Bot, onOpenAssistant)}
            {item("Whiteboard", Network, onOpenWhiteboard)}
          </div>
          <div><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Research tools</p>
            {item("Sources", BookOpen, onOpenSources)}{item("Coverage", Grid3X3, onOpenCoverage)}{item("Relationships", Share2, onOpenGraph)}{item("Simulator", Flame, onOpenSimulator)}{item("Upload paper", FileUp, onOpenUpload)}{item("Ingestion queue", FileUp, onOpenIngestion)}
          </div>
          <div><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</p>
            {item("Evidence brief", FileText, onOpenBrief)}{selectedCount >= 2 && item(`Compare (${selectedCount})`, ArrowRightLeft, onOpenCompare)}{item("Reset filters", RotateCcw, onReset)}
          </div>
        </nav>
        <div className="mt-5 border-t border-white/[0.07] px-3 pt-4 text-xs text-slate-500"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />{corpusCount} studies in library</div>
      </aside>
    </>
  );
}
