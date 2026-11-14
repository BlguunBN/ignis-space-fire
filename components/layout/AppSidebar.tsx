"use client";

import React from "react";
import {
  Flame,
  Search,
  Activity,
  Table as TableIcon,
  Grid3X3,
  BookOpen,
  Scale,
  Sparkles,
  Database,
  Cpu,
  Tv,
  SplitSquareVertical,
} from "lucide-react";

export type NavTab = "explore" | "studio" | "compare_lab" | "chart" | "table" | "coverage" | "methodology";

interface AppSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedCompareCount: number;
  onOpenCompare: () => void;
}

export function AppSidebar({
  activeTab,
  onSelectTab,
  selectedCompareCount,
  onOpenCompare,
}: AppSidebarProps) {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: "studio", label: "Experiment Studio", icon: <Tv className="w-4 h-4" />, badge: "Visual" },
    { id: "explore", label: "Evidence Explorer", icon: <Search className="w-4 h-4" /> },
    { id: "compare_lab", label: "Visual Compare Lab", icon: <SplitSquareVertical className="w-4 h-4" /> },
    { id: "chart", label: "Flame Dynamics", icon: <Activity className="w-4 h-4" /> },
    { id: "table", label: "Master Comparison", icon: <TableIcon className="w-4 h-4" /> },
    { id: "coverage", label: "Coverage Matrix", icon: <Grid3X3 className="w-4 h-4" /> },
    { id: "methodology", label: "Provenance & Limits", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full lg:w-60 shrink-0 bg-[#15191F] border-r border-[#303741] flex flex-col justify-between py-5 px-3 min-h-screen">
      {/* Brand & Mission */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-[#E99847] flex items-center justify-center text-[#0C0F13] font-black shadow-sm shrink-0">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#F3F5F7]">IGNIS 2.0</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B2027] border border-[#303741] text-[#E99847]">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-[#A1AAB5] leading-tight">Visual Research Workspace</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] px-2 block mb-1.5 font-mono">
            Workspace Views
          </span>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer relative ${
                  isActive
                    ? "bg-[#1B2027] text-[#E99847] border border-[#303741] font-semibold"
                    : "text-[#A1AAB5] hover:text-[#F3F5F7] hover:bg-[#1B2027]/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? "text-[#E99847]" : "text-[#737F8C]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    isActive ? "bg-[#E99847]/10 text-[#E99847] border-[#E99847]/30" : "bg-[#0C0F13] text-[#5CB59B] border-[#5CB59B]/30"
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Live Service Status */}
        <div className="px-2 pt-2 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block font-mono">
            Connected Engines
          </span>
          <div className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#A1AAB5] flex items-center gap-1.5">
                <Database className="w-3 h-3 text-[#5CB59B]" />
                NASA PSI Corpus
              </span>
              <span className="font-mono text-[#5CB59B] text-[10px] font-semibold">10 Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A1AAB5] flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[#78A9D8]" />
                NVIDIA Nemotron
              </span>
              <span className="font-mono text-[#78A9D8] text-[10px]">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Tray & Footer */}
      <div className="pt-4 border-t border-[#303741] space-y-3">
        {selectedCompareCount > 0 && (
          <button
            onClick={onOpenCompare}
            disabled={selectedCompareCount < 2}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedCompareCount === 2
                ? "bg-[#E99847] text-[#0C0F13] border-[#E99847] shadow-sm"
                : "bg-[#1B2027] text-[#A1AAB5] border-[#303741] opacity-75"
            }`}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Compare Tray</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/20">
              {selectedCompareCount}/2
            </span>
          </button>
        )}

        <div className="px-2 text-[10px] text-[#737F8C] space-y-0.5">
          <div className="text-[#F3F5F7] font-semibold">Team Twinkle Twinkle</div>
          <div>NASA Space Apps Ulaanbaatar 2026</div>
          <div className="pt-1 text-[9px] text-[#737F8C] font-mono">Apache-2.0 · Open Source</div>
        </div>
      </div>
    </aside>
  );
}
