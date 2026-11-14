"use client";

import React from "react";
import {
  Compass,
  Flame,
  Grid3X3,
  Bot,
  Network,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export type GuidedStep = "explore" | "simulate" | "gaps" | "agent" | "whiteboard";

interface GuidedResearchStepperProps {
  currentStep: GuidedStep;
  onSelectStep: (step: GuidedStep) => void;
}

export function GuidedResearchStepper({
  currentStep,
  onSelectStep,
}: GuidedResearchStepperProps) {
  const steps: { id: GuidedStep; label: string; number: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "explore",
      number: "01",
      label: "Explore Library",
      desc: "Filter 50 flight records",
      icon: <Compass className="w-3.5 h-3.5" />,
    },
    {
      id: "simulate",
      number: "02",
      label: "Physics Simulator",
      desc: "d² law & flame diagnostics",
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    {
      id: "gaps",
      number: "03",
      label: "Research Gaps",
      desc: "72-cell evidence matrix",
      icon: <Grid3X3 className="w-3.5 h-3.5" />,
    },
    {
      id: "agent",
      number: "04",
      label: "Nemotron AI Copilot",
      desc: "Grounded RAG synthesis",
      icon: <Bot className="w-3.5 h-3.5" />,
    },
    {
      id: "whiteboard",
      number: "05",
      label: "Whiteboard Studio",
      desc: "Mind Tree & test proposal",
      icon: <Network className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="w-full bg-[#0a0d14] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between overflow-x-auto text-xs font-mono">
      <div className="flex items-center gap-1 sm:gap-2 min-w-max">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2 hidden md:inline">
          Research Pathway:
        </span>

        {steps.map((st, idx) => {
          const isActive = currentStep === st.id;

          return (
            <React.Fragment key={st.id}>
              <button
                onClick={() => onSelectStep(st.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-left group ${
                  isActive
                    ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 shadow-sm"
                    : "bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <div
                  className={`p-1 rounded ${
                    isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-white/[0.04] text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {st.icon}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 font-semibold text-[11px]">
                    <span className="text-[9px] text-slate-400 font-normal">{st.number}</span>
                    <span>{st.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 leading-tight hidden lg:inline">
                    {st.desc}
                  </span>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-500 mx-0.5 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-400 hidden xl:flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Grounded Microgravity Workflow</span>
      </div>
    </div>
  );
}
