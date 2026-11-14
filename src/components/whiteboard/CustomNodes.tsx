"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { HelpCircle, FileCheck, Sparkles, Layers, ShieldCheck } from "lucide-react";

export const QuestionNode = memo(({ data }: { data: any }) => {
  return (
    <div className="bg-[#13171e] border-2 border-amber-400/80 rounded-xl p-3 shadow-xl max-w-xs font-sans text-xs text-slate-200">
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400 uppercase tracking-wider mb-1 font-bold">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Research Question</span>
      </div>
      <div className="font-semibold text-slate-100 text-xs">{data.label}</div>
      {data.details && (
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{data.details}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !w-2.5 !h-2.5" />
    </div>
  );
});
QuestionNode.displayName = "QuestionNode";

export const EvidenceNode = memo(({ data }: { data: any }) => {
  return (
    <div className="bg-[#13171e] border-2 border-cyan-400/80 rounded-xl p-3 shadow-xl max-w-sm font-sans text-xs text-slate-200">
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Verified Evidence</span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
          {data.claimId || "NASA-PSI"}
        </span>
      </div>
      <div className="font-semibold text-slate-100 text-xs">{data.investigation}</div>
      <div className="text-[10px] font-mono text-cyan-300 mt-0.5">{data.conditions}</div>
      <blockquote className="mt-1.5 text-[11px] text-slate-300 border-l border-cyan-400/50 pl-2 leading-relaxed italic bg-white/[0.02] p-1 rounded">
        "{data.quote}"
      </blockquote>
      <div className="mt-2 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
        <ShieldCheck className="w-3 h-3" />
        <span>Primary Flight Provenance Confirmed</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2.5 !h-2.5" />
    </div>
  );
});
EvidenceNode.displayName = "EvidenceNode";

export const HypothesisNode = memo(({ data }: { data: any }) => {
  return (
    <div className="bg-[#13171e] border-2 border-emerald-400/80 rounded-xl p-3 shadow-xl max-w-xs font-sans text-xs text-slate-200">
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-2.5 !h-2.5" />
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 uppercase tracking-wider mb-1 font-bold">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Physical Hypothesis</span>
      </div>
      <div className="font-semibold text-slate-100 text-xs">{data.title}</div>
      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{data.prediction}</p>
      {data.rationale && (
        <div className="text-[10px] font-mono text-slate-400 mt-1.5 border-t border-white/[0.06] pt-1">
          Rationale: {data.rationale}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-2.5 !h-2.5" />
    </div>
  );
});
HypothesisNode.displayName = "HypothesisNode";

export const ExperimentNode = memo(({ data }: { data: any }) => {
  return (
    <div className="bg-[#13171e] border-2 border-purple-400/80 rounded-xl p-3 shadow-xl max-w-xs font-sans text-xs text-slate-200">
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-purple-400 uppercase tracking-wider font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>Experiment Proposal</span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-400/10 text-purple-300 border border-purple-400/30">
          {data.facility || "ISS CIR"}
        </span>
      </div>
      <div className="font-semibold text-slate-100 text-xs">{data.objective}</div>
      <div className="mt-1.5 space-y-0.5 text-[10px] font-mono text-slate-300 bg-white/[0.02] p-1.5 rounded border border-white/[0.04]">
        <div>Target Flow: {data.airflow || "15 cm/s"}</div>
        <div>Target O₂: {data.oxygen || "26% O₂"}</div>
        <div>Chamber: {data.pressure || "56 kPa (Exploration)"}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-2.5 !h-2.5" />
    </div>
  );
});
ExperimentNode.displayName = "ExperimentNode";
