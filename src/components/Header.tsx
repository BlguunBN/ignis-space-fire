"use client";

import React, { useState } from "react";
import { ArrowRightLeft, BookOpen, Bot, Columns, Compass, FileText, FileUp, Flame, Grid3X3, LayoutDashboard, Menu, Network, PanelLeftClose, PanelLeftOpen, RotateCcw, Share2, X } from "lucide-react";

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

export function Header({ corpusCount, onReset, onOpenBrief, onOpenCompare, onOpenCoverage, onOpenSources, onOpenWhiteboard, onOpenAssistant, onOpenGraph, onOpenIngestion, onOpenSimulator, onOpenUpload, selectedCount, activeView, activeMainView, onSelectView }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeAfter = (action?: () => void) => () => { action?.(); setOpen(false); };
  const item = (label: string, Icon: typeof Flame, action?: () => void, active = false) => action && (
    <button type="button" title={collapsed ? label : undefined} onClick={closeAfter(action)} aria-current={active ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${active ? "bg-slate-800/60 text-white" : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"}`}>
      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-amber-400" : "text-slate-500"}`} /><span className={collapsed ? "md:sr-only" : undefined}>{label}</span>
    </button>
  );
  return (
    <>
      {/* Side nav — persistent column on desktop, slide-in drawer on mobile */}
      <aside id="workspace-navigation" className={`${open ? "translate-x-0" : "invisible -translate-x-full md:visible"} ${collapsed ? "md:w-20" : "md:w-64"} fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-700 bg-[#0e1116] px-4 py-6 transition-transform duration-200 motion-reduce:transition-none md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0 md:inset-y-auto md:left-0 md:z-20`}>
        <div className="mb-9 flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-400"><Flame className="h-5 w-5" /></div><div className={collapsed ? "md:sr-only" : undefined}><div className="text-sm font-semibold tracking-[0.18em] text-white">IGNIS</div><div className="mt-0.5 text-xs text-slate-500">Research workspace</div></div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-md p-2 text-slate-400 md:hidden"><X className="h-4 w-4" /></button>
        </div>
        <nav aria-label="Workspace navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto">
          <div><p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${collapsed ? "md:sr-only" : ""}`}>Workspace</p>
            {item("Overview", LayoutDashboard, onSelectView ? () => onSelectView("dashboard") : undefined, activeMainView === "dashboard")}
            {item("Explore", Compass, onSelectView ? () => onSelectView("explorer") : undefined, activeMainView === "explorer")}
            {item("Analysis", Columns, onSelectView ? () => onSelectView("split") : undefined, activeMainView === "split")}
            {item("AI Assistant", Bot, onOpenAssistant)}
            {item("Whiteboard", Network, onOpenWhiteboard)}
          </div>
          <div><p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${collapsed ? "md:sr-only" : ""}`}>Research tools</p>
            {item("Sources", BookOpen, onOpenSources)}{item("Coverage", Grid3X3, onOpenCoverage)}{item("Relationships", Share2, onOpenGraph)}{item("Simulator", Flame, onOpenSimulator)}{item("Upload paper", FileUp, onOpenUpload)}{item("Ingestion queue", FileUp, onOpenIngestion)}
          </div>
          <div><p className={`mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${collapsed ? "md:sr-only" : ""}`}>Actions</p>
            {item("Evidence brief", FileText, onOpenBrief)}{selectedCount >= 2 && item(`Compare (${selectedCount})`, ArrowRightLeft, onOpenCompare)}{item("Reset filters", RotateCcw, onReset)}
          </div>
        </nav>
        <div className="mt-5 border-t border-slate-700 pt-4">
          <p className={`px-3 text-xs text-slate-500 ${collapsed ? "md:sr-only" : ""}`}>{corpusCount} studies in library</p>
          <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed} className="mt-3 hidden rounded-md p-3 text-slate-400 hover:bg-slate-800/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 md:block">{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
        </div>
      </aside>
      {/* Mobile: hamburger trigger (always visible) + backdrop when drawer is open */}
      <button type="button" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)} className="fixed left-4 top-4 z-50 md:hidden rounded-md p-2 text-slate-300 hover:bg-slate-800/40">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      {open && <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}
    </>
  );
}
