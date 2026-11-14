"use client";
import React from "react";
import { Flame, LayoutDashboard, MonitorPlay, Library, ArrowLeftRight, Grid3X3, BookOpen, Table2, ChartNoAxesCombined, Scale, Orbit } from "lucide-react";
export type NavTab = "overview" | "explore" | "studio" | "mission" | "compare_lab" | "chart" | "table" | "coverage" | "methodology";
interface Props { activeTab: NavTab; onSelectTab: (tab: NavTab) => void; selectedCompareCount: number; onOpenCompare: () => void }
export function AppSidebar({ activeTab, onSelectTab, selectedCompareCount, onOpenCompare }: Props) {
  const items = [
    { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "studio", label: "Experiment Studio", icon: MonitorPlay },
    { id: "mission", label: "Mission Lab", icon: Orbit }, { id: "explore", label: "Research Library", icon: Library }, { id: "compare_lab", label: "Compare Lab", icon: ArrowLeftRight },
    { id: "coverage", label: "Evidence Map", icon: Grid3X3 }, { id: "methodology", label: "Sources & Methodology", icon: BookOpen },
    { id: "table", label: "Comparison Table", icon: Table2 }, { id: "chart", label: "Measurements", icon: ChartNoAxesCombined },
  ] as const;
  return <aside className="w-full lg:w-56 shrink-0 bg-[#111214] border-b lg:border-b-0 lg:border-r border-[#303134] lg:min-h-screen px-4 py-4 lg:py-7">
    <div className="flex items-center gap-2 px-2 mb-5 lg:mb-9"><Flame className="w-7 h-7 text-[#DDA36B]"/><span className="font-semibold text-xl tracking-tight">IGNIS</span></div>
    <nav aria-label="Main navigation" className="flex lg:flex-col gap-1 overflow-x-auto pb-2">{items.map(({id,label,icon: Icon}) => <button key={id} type="button" title={label} aria-current={activeTab === id ? "page" : undefined} onClick={() => onSelectTab(id)} className={`shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left ${activeTab === id ? "bg-[#191A1D] text-[#F3F2EF]" : "text-[#9EA2A7] hover:bg-[#191A1D] hover:text-[#F3F2EF]"}`}><Icon className={`w-4 h-4 ${activeTab === id ? "text-[#DDA36B]" : ""}`}/>{label}</button>)}</nav>
    <button onClick={onOpenCompare} disabled={selectedCompareCount < 2} className="hidden lg:flex items-center gap-2 mt-8 px-3 py-2 text-xs text-[#9EA2A7] disabled:opacity-50"><Scale className="w-4 h-4"/> Compare tray ({selectedCompareCount}/2)</button>
    <p className="hidden lg:block mt-10 px-3 text-xs leading-5 text-[#9EA2A7]">NASA Space Apps 2026<br/>Research workspace</p>
  </aside>;
}
