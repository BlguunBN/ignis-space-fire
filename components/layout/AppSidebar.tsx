"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  ChartColumnIncreasing,
  FileSearch,
  Flame,
  FlaskConical,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

export type NavTab = "explore" | "studio" | "table" | "coverage" | "methodology";

interface AppSidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedCompareCount: number;
  onOpenCompare: () => void;
}

const links: Array<{ id: NavTab; label: string; icon: typeof LayoutGrid }> = [
  { id: "explore", label: "Overview", icon: LayoutGrid },
  { id: "studio", label: "Experiment studio", icon: FlaskConical },
  { id: "table", label: "Compare records", icon: ArrowLeftRight },
  { id: "coverage", label: "Evidence coverage", icon: ChartColumnIncreasing },
  { id: "methodology", label: "Sources & methodology", icon: BookOpen }
];

export function AppSidebar({ activeTab, onSelectTab, selectedCompareCount, onOpenCompare }: AppSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className={"z-40 flex w-full shrink-0 items-center border-b border-white/10 bg-[#0d0e10] lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:border-b-0 lg:border-r " + (expanded ? "lg:w-56" : "lg:w-[72px]")}>
      <div className="hidden h-[72px] items-center justify-center border-b border-white/10 lg:flex">
        <Flame aria-label="IGNIS" className="h-5 w-5 text-[#e2ad73]" strokeWidth={1.8} />
        {expanded && <span className="ml-2 text-sm font-semibold tracking-[0.1em]">IGNIS</span>}
      </div>
      <div className="flex flex-1 items-center gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:gap-2 lg:overflow-visible lg:px-3 lg:py-5">
        <div className="mr-2 flex items-center lg:hidden"><Flame className="h-5 w-5 text-[#e2ad73]" aria-label="IGNIS" /></div>
        {links.map(({ id, label, icon: Icon }) => {
          const selected = activeTab === id;
          return (
            <button key={id} type="button" title={label} aria-label={label} aria-current={selected ? "page" : undefined}
              onClick={() => onSelectTab(id)}
              className={"group relative flex h-11 min-w-11 items-center justify-center rounded-lg px-3 transition-colors lg:w-full " +
                (expanded ? "lg:justify-start lg:gap-3" : "") +
                (selected ? " bg-[#242426] text-[#f6f1eb]" : " text-[#7e8186] hover:bg-white/[0.06] hover:text-white")}>
              <Icon className={"h-[18px] w-[18px] shrink-0 " + (selected ? "text-[#e2ad73]" : "")} strokeWidth={1.7}/>
              {expanded && <span className="hidden whitespace-nowrap text-xs lg:inline">{label}</span>}
              {selected && <span className="absolute bottom-1 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-[#e2ad73] lg:bottom-auto lg:left-0 lg:top-1/2 lg:h-5 lg:w-[2px] lg:-translate-x-0 lg:-translate-y-1/2" />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center px-2 lg:flex-col lg:gap-2 lg:px-3 lg:pb-4">
        <button type="button" title="Compare selected" aria-label={"Compare selected: " + selectedCompareCount + " of 2"} onClick={onOpenCompare}
          disabled={selectedCompareCount < 2}
          className="relative flex h-11 min-w-11 items-center justify-center rounded-lg text-[#9fa2a5] transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 lg:w-full">
          <FileSearch className="h-[18px] w-[18px]" strokeWidth={1.7}/>
          {selectedCompareCount > 0 && <span className="absolute right-1 top-1 rounded-full bg-[#e2ad73] px-[5px] text-[9px] font-medium text-black">{selectedCompareCount}</span>}
        </button>
        <button type="button" title={expanded ? "Collapse navigation" : "Expand navigation"} aria-label="Toggle sidebar labels"
          onClick={() => setExpanded((value) => !value)} className="hidden h-11 w-full items-center justify-center rounded-lg text-[#7e8186] hover:bg-white/[0.06] hover:text-white lg:flex">
          {expanded ? <PanelLeftClose className="h-[18px] w-[18px]"/> : <PanelLeftOpen className="h-[18px] w-[18px]"/>}
        </button>
        <div className="hidden h-px w-8 bg-white/10 lg:block" />
        <div title="Research software — not flight safety certification" className="hidden h-8 w-8 items-center justify-center rounded-md border border-white/10 text-[10px] font-semibold text-[#a8aaad] lg:flex">N</div>
      </div>
    </aside>
  );
}
