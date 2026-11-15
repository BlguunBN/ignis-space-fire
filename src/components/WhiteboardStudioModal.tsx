"use client";

import React, { useState } from "react";
import { X, Network, PenTool, FileText, Sparkles } from "lucide-react";
import { StructuredWhiteboard } from "./whiteboard/StructuredWhiteboard";
import { ExcalidrawCanvas } from "./whiteboard/ExcalidrawCanvas";
import { ExperimentRecord } from "../types/evidence";
import { BuildHypothesisTreeArgs } from "../lib/agent-tools";
import { useAuth } from "./AuthProvider";

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
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<"tree" | "sketch">("tree");
  const [opened, setOpened] = useState(false);
  const [sketchOpened, setSketchOpened] = useState(false);

  React.useEffect(() => { if (isOpen) setOpened(true); }, [isOpen]);
  if (!isOpen && !opened) return null;

  return (
    <div style={{ display: isOpen ? undefined : "none" }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="whiteboard-title" className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216] shadow-2xl">
        <header className="border-b border-white/[0.08] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-400/10 p-2.5 text-amber-400"><Network className="h-5 w-5" /></span><div><h2 id="whiteboard-title" className="text-lg font-semibold tracking-tight text-white">Whiteboard</h2><p className="mt-0.5 text-xs text-slate-400">Connect evidence, questions and ideas.</p></div></div>
            <button type="button" onClick={onClose} aria-label="Close whiteboard" className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"><X className="h-5 w-5" /></button>
          </div>
          <div aria-label="Whiteboard mode" className="mt-4 inline-flex max-w-full gap-1 rounded-xl bg-white/[0.04] p-1 text-sm">
            <button type="button" onClick={() => setActiveTab("tree")} aria-pressed={activeTab === "tree"} className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${activeTab === "tree" ? "bg-white/[0.10] text-white" : "text-slate-400 hover:text-white"}`}><Network className="h-4 w-4" />Evidence tree</button>
            <button type="button" onClick={() => { setSketchOpened(true); setActiveTab("sketch"); }} aria-pressed={activeTab === "sketch"} className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${activeTab === "sketch" ? "bg-white/[0.10] text-white" : "text-slate-400 hover:text-white"}`}><PenTool className="h-4 w-4" />Freehand sketch</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-[#090a0d] p-2 sm:p-3">
          <div style={{ display: activeTab === "tree" ? "flex" : "none" }} className="h-full flex-col">
            <StructuredWhiteboard key={session?.user.id || "guest"} activeRecord={activeRecord} onExportBrief={onExportBrief} initialPrompt={initialPrompt} initialTree={initialTree} />
          </div>
          {sketchOpened && <div style={{ display: activeTab === "sketch" ? "block" : "none" }} className="h-full"><ExcalidrawCanvas /></div>}
        </div>
      </section>
    </div>
  );
}
