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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">
              Grounded AI Interpretation
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Powered by NVIDIA Nemotron-30B Reasoning Model under strict NASA evidence guardrails.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-purple-900/30 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Reasoning & Synthesising..." : "Generate AI Interpretation"}
        </button>
      </div>

      {!synthesis && !loading && (
        <div className="py-8 text-center text-slate-500 text-xs">
          <Cpu className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          Click <strong className="text-slate-300">"Generate AI Interpretation"</strong> to synthesise research findings, engineering implications, and documented boundaries for the current query.
        </div>
      )}

      {loading && (
        <div className="py-10 text-center text-slate-400 text-xs animate-pulse space-y-2">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div>Querying NVIDIA Nemotron-30B Reasoning Model...</div>
          <div className="text-[11px] text-slate-500">
            Applying physics grounding constraints and verifying non-extrapolation boundary.
          </div>
        </div>
      )}

      {synthesis && !loading && (
        <div className="mt-5 space-y-5 text-xs animate-fade-in">
          {/* Engine & Model Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
            <span className="text-slate-400">Synthesis Engine:</span>
            <span className="font-semibold text-purple-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              {synthesis.modelUsed || "NVIDIA Nemotron-30B"}
            </span>
          </div>

          {/* Optional: NVIDIA Reasoning Trace */}
          {synthesis.reasoningSteps && (
            <div className="bg-slate-950/80 rounded-xl border border-purple-900/40 p-3">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full flex items-center justify-between text-purple-400 hover:text-purple-300 font-semibold text-xs transition"
              >
                <span className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" />
                  NVIDIA Model Reasoning Trace
                </span>
                {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReasoning && (
                <div className="mt-2.5 pt-2 border-t border-purple-950 text-slate-400 leading-relaxed font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {synthesis.reasoningSteps}
                </div>
              )}
            </div>
          )}

          {/* Core Summary */}
          <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-900/30">
            <h4 className="font-bold text-purple-300 text-xs uppercase tracking-wider mb-2">
              Cross-Experiment Synthesis
            </h4>
            <p className="text-slate-200 text-sm leading-relaxed">{synthesis.summary}</p>
          </div>

          {/* Key Findings */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Observed Scientific Findings
            </h4>
            <ul className="space-y-2 pl-2">
              {synthesis.keyFindings.map((finding, idx) => (
                <li
                  key={idx}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 leading-relaxed"
                >
                  {finding}
                </li>
              ))}
            </ul>
          </div>

          {/* Fire Safety Implications */}
          <div className="space-y-2">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              Spacecraft Fire Safety Implications
            </h4>
            <ul className="space-y-2 pl-2">
              {synthesis.fireSafetyImplications.map((imp, idx) => (
                <li
                  key={idx}
                  className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 text-slate-300 leading-relaxed"
                >
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          {/* Scientific Limitations */}
          <div className="space-y-2">
            <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Scientific Boundaries & Limitations
            </h4>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-400">
              {synthesis.scientificLimitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Cited Sources */}
          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
              Cited NASA Experimental Investigations
            </h4>
            <div className="flex flex-wrap gap-2">
              {synthesis.citedSources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 text-blue-400 hover:text-blue-300 border border-slate-800 transition"
                >
                  <span>{src.title}</span>
                  <span className="text-slate-500 font-mono text-[10px]">[{src.doi}]</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
