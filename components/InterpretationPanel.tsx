"use client";

import React, { useState } from "react";
import { SynthesisResponse } from "@/lib/synthesis";
import { Sparkles, ShieldCheck, AlertTriangle, ExternalLink, Cpu, Brain, ChevronDown, ChevronUp } from "lucide-react";

interface InterpretationPanelProps {
  synthesis: SynthesisResponse | null;
  loading: boolean;
  onGenerate: () => void;
}

export function InterpretationPanel({
  synthesis,
  loading,
  onGenerate,
}: InterpretationPanelProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#303741]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E99847]" />
            <h3 className="text-sm font-bold text-[#F3F5F7]">
              Grounded Scientific Interpretation
            </h3>
          </div>
          <p className="text-xs text-[#A1AAB5] mt-0.5">
            Powered by NVIDIA Nemotron-30B Reasoning Model under strict NASA evidence guardrails.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#E99847] hover:bg-[#d68536] disabled:opacity-50 text-[#0C0F13] font-bold text-xs shadow-sm transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          {loading ? "Reasoning & Synthesising..." : "Synthesize Evidence (NVIDIA)"}
        </button>
      </div>

      {!synthesis && !loading && (
        <div className="py-6 text-center text-[#737F8C] text-xs">
          <Cpu className="w-6 h-6 mx-auto text-[#303741] mb-1.5" />
          Click <strong className="text-[#A1AAB5]">&quot;Synthesize Evidence&quot;</strong> to generate a source-grounded scientific synthesis for the active query.
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-[#A1AAB5] text-xs space-y-2">
          <div className="w-6 h-6 border-2 border-[#E99847] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div>Querying NVIDIA Nemotron-30B Reasoning Model...</div>
          <div className="text-[10px] text-[#737F8C] font-mono">
            Grounding claims to NASA PSI DOIs and verifying microgravity boundary.
          </div>
        </div>
      )}

      {synthesis && !loading && (
        <div className="space-y-4 text-xs animate-fade-in">
          {/* Model Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0C0F13] p-2 rounded-lg border border-[#303741] text-[11px]">
            <span className="text-[#737F8C]">Inference Engine:</span>
            <span className="font-semibold text-[#E99847] flex items-center gap-1.5 font-mono">
              <Cpu className="w-3 h-3 text-[#E99847]" />
              {synthesis.modelUsed || "NVIDIA Nemotron-30B Reasoning (NIM)"}
            </span>
          </div>

          {/* NVIDIA Reasoning Trace (Expandable) */}
          {synthesis.reasoningSteps && (
            <div className="bg-[#0C0F13] rounded-lg border border-[#303741] p-3">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full flex items-center justify-between text-[#78A9D8] hover:text-[#F3F5F7] font-semibold text-xs transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Brain className="w-3.5 h-3.5 text-[#78A9D8]" />
                  Internal Reasoning Trace ({synthesis.reasoningSteps.length} chars)
                </span>
                {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showReasoning && (
                <div className="mt-2 pt-2 border-t border-[#303741] text-[#A1AAB5] leading-relaxed font-mono text-[10px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {synthesis.reasoningSteps}
                </div>
              )}
            </div>
          )}

          {/* Core Summary */}
          <div className="bg-[#15191F] p-3.5 rounded-lg border border-[#303741]">
            <span className="font-bold text-[#E99847] text-[10px] uppercase tracking-wider block mb-1 font-mono">
              Cross-Experiment Synthesis
            </span>
            <p className="text-[#F3F5F7] text-xs leading-relaxed">{synthesis.summary}</p>
          </div>

          {/* Key Findings */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#F3F5F7] uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5CB59B]" />
              Observed Scientific Findings
            </span>
            <ul className="space-y-1.5 pl-1">
              {synthesis.keyFindings.map((finding, idx) => (
                <li
                  key={idx}
                  className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741] text-[#A1AAB5] leading-relaxed text-[11px]"
                >
                  {finding}
                </li>
              ))}
            </ul>
          </div>

          {/* Fire Safety Implications */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#E99847] uppercase tracking-wider text-[10px] font-mono">
              Spacecraft Fire Safety Implications
            </span>
            <ul className="space-y-1.5 pl-1">
              {synthesis.fireSafetyImplications.map((imp, idx) => (
                <li
                  key={idx}
                  className="bg-[#0C0F13] p-2.5 rounded-lg border border-[#303741] text-[#F3F5F7] leading-relaxed text-[11px]"
                >
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          {/* Scientific Limitations */}
          <div className="space-y-1.5">
            <span className="font-bold text-[#D97777] uppercase tracking-wider text-[10px] flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3 h-3" />
              Scientific Boundaries & Limitations
            </span>
            <ul className="space-y-1 list-disc pl-4 text-[#A1AAB5] text-[11px]">
              {synthesis.scientificLimitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Cited Sources */}
          <div className="pt-2.5 border-t border-[#303741]">
            <span className="font-bold text-[#737F8C] uppercase tracking-wider text-[10px] block mb-1.5 font-mono">
              Verified NASA Citations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {synthesis.citedSources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0C0F13] text-[#78A9D8] hover:text-[#F3F5F7] border border-[#303741] transition text-[11px]"
                >
                  <span>{src.title}</span>
                  <span className="text-[#737F8C] font-mono text-[9px]">[{src.doi}]</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
