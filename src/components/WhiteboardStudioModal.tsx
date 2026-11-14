"use client";

import React, { useState } from "react";
import { X, Network, PenTool, FileText, Sparkles } from "lucide-react";
import { StructuredWhiteboard } from "./whiteboard/StructuredWhiteboard";
import { ExcalidrawCanvas } from "./whiteboard/ExcalidrawCanvas";
import { ExperimentRecord } from "../types/evidence";
import { BuildHypothesisTreeArgs } from "../lib/agent-tools";

interface WhiteboardStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRecord: ExperimentRecord | null;
  onExportBrief?: (markdown: string) => void;
  initialPrompt?: string | null;
  initialTree?: BuildHypothesisTreeArgs | null;
}

export function WhiteboardStudioModal({
  isOpen,
  onClose,
  activeRecord,
  onExportBrief,
  initialPrompt,
  initialTree,
}: WhiteboardStudioModalProps) {
  const [activeTab, setActiveTab] = useState<"tree" | "sketch">("tree");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0c0f14] border border-white/[0.08] rounded-xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.08] bg-[#090a0d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  STAGE 3 RESEARCH WHITEBOARD STUDIO
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Mind Tree & Freehand Ideation
                </span>
              </div>
              <h2 className="text-sm md:text-base font-semibold text-slate-100 font-sans mt-0.5">
                Microgravity Experiment & Hypothesis Modeler
              </h2>
            </div>
          </div>

          {/* Center Canvas Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#13171e] p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => setActiveTab("tree")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === "tree"
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Evidence Mind Tree (@xyflow)</span>
            </button>

            <button
              onClick={() => setActiveTab("sketch")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                activeTab === "sketch"
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Freehand Sketch (Excalidraw)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Viewport */}
        <div className="flex-1 p-3 bg-[#090a0d] overflow-hidden flex flex-col">
          {activeTab === "tree" ? (
            <StructuredWhiteboard
              activeRecord={activeRecord}
              onExportBrief={onExportBrief}
              initialPrompt={initialPrompt}
              initialTree={initialTree}
            />
          ) : (
            <ExcalidrawCanvas />
          )}
        </div>
      </div>
    </div>
  );
}
