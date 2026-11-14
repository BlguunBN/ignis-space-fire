"use client";

import { ArrowUpRight, BookOpen, Info, Sparkles } from "lucide-react";
import type { SynthesisResponse } from "@/lib/synthesis";

interface InterpretationPanelProps {
  synthesis: SynthesisResponse | null;
  loading: boolean;
  onGenerate: () => void;
}

export function InterpretationPanel({ synthesis, loading, onGenerate }: InterpretationPanelProps) {
  return (
    <section className="ignis-panel overflow-hidden" aria-label="Research interpretation">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="ignis-kicker">OPTIONAL ANALYSIS</p>
          <h2 className="mt-1 flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-[#e2ad73]"/> Evidence interpretation</h2>
        </div>
        <button type="button" onClick={onGenerate} disabled={loading} className="ignis-button ignis-button-primary">
          {loading ? "Analyzing…" : synthesis ? "Refresh analysis" : "Analyze selected evidence"}
        </button>
      </div>
      {!synthesis && !loading && <div className="flex items-start gap-3 px-5 py-6 text-xs leading-relaxed text-[#a3a6a7]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#d0ad85]"/>
        <p>Run a source-constrained summary of relevant records. Original NASA evidence remains the authority, and the interpretation is not fire-risk certification.</p>
      </div>}
      {loading && <p className="px-5 py-7 text-sm text-[#aeb0b0]" role="status">Reviewing the indexed evidence…</p>}
      {synthesis && !loading && <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="rounded-md border border-white/10 bg-[#202224] px-2.5 py-1.5 font-medium text-[#d6d7d5]">{synthesis.aiMode === "live_llm" ? "AI generated" : "Deterministic summary"}</span>
          <span className="text-[#8a8e90]">{synthesis.citedSources.length} linked sources</span>
        </div>
        <p className="max-w-[900px] text-[13px] leading-7 text-[#e5e3df]">{synthesis.summary}</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="ignis-kicker">INDEXED FINDINGS</h3>
            {synthesis.keyFindings.slice(0,4).map((item,index)=><p key={index} className="border-l border-[#5d5b56] pl-3 text-xs leading-6 text-[#aeb0b1]">{item}</p>)}
          </div>
          <div className="space-y-2">
            <h3 className="ignis-kicker">LIMITATIONS</h3>
            {synthesis.scientificLimitations.slice(0,4).map((item,index)=><p key={index} className="border-l border-[#816044] pl-3 text-xs leading-6 text-[#aeb0b1]">{item}</p>)}
          </div>
        </div>
        <div className="border-t border-white/10 pt-4">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] font-medium text-[#cdcdca]"><BookOpen className="h-4 w-4"/> Original references</h3>
          <div className="flex flex-wrap gap-2">
            {synthesis.citedSources.map(src=><a key={src.id} href={src.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-[11px] text-[#c9aa86] hover:border-[#826447] hover:text-white">
              {src.title} <ArrowUpRight className="h-3 w-3"/>
            </a>)}
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md border border-white/[.07] bg-[#101113] p-3 text-[11px] leading-5 text-[#919597]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0"/> Summaries are constrained to the indexed corpus. They can omit context or reproduce errors in source records; verify claims against the linked originals.
        </div>
      </div>}
    </section>
  );
}
