"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { HelpCircle, FileCheck, Sparkles, Layers, ShieldCheck, X } from "lucide-react";

export const QuestionNode = memo(({ id, data }: { id: string; data: any }) => {
  return (
    <div className={`bg-[#13171e] border-2 ${data.aiGenerated ? "border-amber-400 ring-2 ring-amber-400/30" : "border-amber-400/80"} rounded-xl p-3 shadow-xl w-72 font-sans text-xs text-slate-200 transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400 uppercase tracking-wider font-bold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Research Question</span>
          {data.aiGenerated && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-0.5 lowercase tracking-normal">
              <Sparkles className="w-2.5 h-2.5" /> ai
            </span>
          )}
        </div>
        {data.onDelete && (
          <button
            onClick={() => data.onDelete(id)}
            className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded"
            title="Delete node"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        type="text"
        value={data.label || ""}
        onChange={(e) => data.onChange?.(id, { ...data, label: e.target.value })}
        placeholder="e.g. Forced Airflow Flame Spread..."
        className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 font-semibold text-slate-100 text-xs focus:outline-none focus:border-amber-400 mb-1.5"
      />

      <textarea
        value={data.details || ""}
        onChange={(e) => data.onChange?.(id, { ...data, details: e.target.value })}
        placeholder="Enter research scope, gap, or physical question..."
        rows={2}
        className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !w-2.5 !h-2.5" />
    </div>
  );
});
QuestionNode.displayName = "QuestionNode";

export const EvidenceNode = memo(({ id, data }: { id: string; data: any }) => {
  const corpusList: Array<{ id: string; label: string; claimId: string; conditions: string; quote: string }> =
    data.corpusOptions || [
      {
        id: "saffire-1",
        label: "Saffire-I Flight Experiment",
        claimId: "CLM-SAFFIRE-001",
        conditions: "21% O₂ • 20 cm/s Flow • 101.3 kPa",
        quote: "Large-scale flame spread in microgravity proceeds steadily under forced airflow.",
      },
      {
        id: "saffire-2",
        label: "Saffire-II Multi-Material Flammability",
        claimId: "CLM-SAFFIRE-002",
        conditions: "21% O₂ • 15 cm/s Flow • 101.3 kPa",
        quote: "Different materials exhibit distinct flammability thresholds under microgravity convective flow.",
      },
      {
        id: "saffire-4",
        label: "Saffire-IV Sample IV-1 Fire Test",
        claimId: "CLM-SAFFIRE-004",
        conditions: "22% O₂ • 20 cm/s Flow • 100 kPa",
        quote: "Flame spread occurred; reports 130 s burning with 3,150 W average heat release.",
      },
      {
        id: "bass-2-pmma",
        label: "BASS-II Opposed Flow PMMA",
        claimId: "CLM-BASS-002",
        conditions: "21% O₂ • 3.5 cm/s Flow • 101.3 kPa",
        quote: "Narrow glovebox flow duct causes accelerated radiative extinction near low-speed boundary.",
      },
      {
        id: "flex-droplet-1",
        label: "FLEX Flame Extinction (Droplets)",
        claimId: "CLM-FLEX-001",
        conditions: "18% O₂ • 0 cm/s Flow • 101.3 kPa",
        quote: "Droplets exhibit low-temperature cool flame burning after radiative visible flame extinction.",
      },
      {
        id: "sofie-gel",
        label: "SoFIE GEL (Thick PMMA Slabs)",
        claimId: "CLM-SOFIE-001",
        conditions: "34% O₂ • 4 cm/s Flow • 101.3 kPa",
        quote: "Internal conduction heat sink in thick fuels shifts extinction boundary to 34% O₂.",
      },
    ];

  const handleSelectStudy = (selectedId: string) => {
    const study = corpusList.find((s) => s.id === selectedId);
    if (study) {
      data.onChange?.(id, {
        ...data,
        investigation: study.label,
        claimId: study.claimId,
        conditions: study.conditions,
        quote: study.quote,
      });
    }
  };

  return (
    <div className={`bg-[#13171e] border-2 ${data.aiGenerated ? "border-cyan-400 ring-2 ring-cyan-400/30" : "border-cyan-400/80"} rounded-xl p-3 shadow-xl w-80 font-sans text-xs text-slate-200 transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Verified Evidence</span>
          {data.aiGenerated && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-0.5 lowercase tracking-normal">
              <Sparkles className="w-2.5 h-2.5" /> ai
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
            {data.claimId || "NASA-PSI"}
          </span>
          {data.onDelete && (
            <button
              onClick={() => data.onDelete(id)}
              className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded"
              title="Delete node"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Investigation Selector */}
      <select
        value={data.investigationId || ""}
        onChange={(e) => handleSelectStudy(e.target.value)}
        className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 text-xs text-slate-100 font-semibold mb-1 focus:outline-none focus:border-cyan-400"
      >
        <option value="" disabled>Select NASA Investigation...</option>
        {corpusList.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} ({c.claimId})
          </option>
        ))}
      </select>

      <div className="text-[10px] font-mono text-cyan-300 mb-1.5 px-0.5">
        {data.conditions || "21% O₂ • 20 cm/s Flow"}
      </div>

      <textarea
        value={data.quote || ""}
        onChange={(e) => data.onChange?.(id, { ...data, quote: e.target.value })}
        rows={2}
        className="w-full bg-[#0c0f14] border border-white/[0.08] rounded p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-400 resize-none italic leading-relaxed"
      />

      <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
        <ShieldCheck className="w-3 h-3" />
        <span>Indexed Record Verified</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2.5 !h-2.5" />
    </div>
  );
});
EvidenceNode.displayName = "EvidenceNode";

export const HypothesisNode = memo(({ id, data }: { id: string; data: any }) => {
  const isCounter = data.isCounter;
  const borderColor = isCounter ? "border-amber-500 ring-2 ring-amber-500/30" : data.aiGenerated ? "border-emerald-400 ring-2 ring-emerald-400/30" : "border-emerald-400/80";

  return (
    <div className={`bg-[#13171e] border-2 ${borderColor} rounded-xl p-3 shadow-xl w-72 font-sans text-xs text-slate-200 transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className={`!w-2.5 !h-2.5 ${isCounter ? "!bg-amber-500" : "!bg-emerald-400"}`} />
      <div className="flex items-center justify-between mb-1.5">
        <div className={`flex items-center gap-1.5 font-mono text-[10px] ${isCounter ? "text-amber-400" : "text-emerald-400"} uppercase tracking-wider font-bold`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCounter ? "Counter-Hypothesis" : "Physical Hypothesis"}</span>
          {data.aiGenerated && (
            <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${isCounter ? "bg-amber-400/20 text-amber-300 border border-amber-400/40" : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40"} flex items-center gap-0.5 lowercase tracking-normal`}>
              <Sparkles className="w-2.5 h-2.5" /> ai
            </span>
          )}
        </div>
        {data.onDelete && (
          <button
            onClick={() => data.onDelete(id)}
            className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded"
            title="Delete node"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        type="text"
        value={data.title || ""}
        onChange={(e) => data.onChange?.(id, { ...data, title: e.target.value })}
        placeholder="Hypothesis Title..."
        className={`w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 font-semibold text-slate-100 text-xs focus:outline-none ${isCounter ? "focus:border-amber-400" : "focus:border-emerald-400"} mb-1.5`}
      />

      <textarea
        value={data.prediction || ""}
        onChange={(e) => data.onChange?.(id, { ...data, prediction: e.target.value })}
        placeholder="Enter physical prediction (e.g. extinction threshold shift)..."
        rows={2}
        className={`w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none ${isCounter ? "focus:border-amber-400" : "focus:border-emerald-400"} resize-none leading-relaxed mb-1.5`}
      />

      <input
        type="text"
        value={data.rationale || ""}
        onChange={(e) => data.onChange?.(id, { ...data, rationale: e.target.value })}
        placeholder="Governing physical mechanism / rationale..."
        className={`w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 text-[10px] font-mono text-slate-400 focus:outline-none ${isCounter ? "focus:border-amber-400" : "focus:border-emerald-400"}`}
      />
      <Handle type="source" position={Position.Bottom} className={`!w-2.5 !h-2.5 ${isCounter ? "!bg-amber-500" : "!bg-emerald-400"}`} />
    </div>
  );
});
HypothesisNode.displayName = "HypothesisNode";

export const ExperimentNode = memo(({ id, data }: { id: string; data: any }) => {
  return (
    <div className={`bg-[#13171e] border-2 ${data.aiGenerated ? "border-purple-400 ring-2 ring-purple-400/30" : "border-purple-400/80"} rounded-xl p-3 shadow-xl w-80 font-sans text-xs text-slate-200 transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-2.5 !h-2.5" />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-purple-400 uppercase tracking-wider font-bold">
          <Layers className="w-3.5 h-3.5" />
          <span>Experiment Proposal</span>
          {data.aiGenerated && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-400/20 text-purple-300 border border-purple-400/40 flex items-center gap-0.5 lowercase tracking-normal">
              <Sparkles className="w-2.5 h-2.5" /> ai
            </span>
          )}
        </div>
        {data.onDelete && (
          <button
            onClick={() => data.onDelete(id)}
            className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded"
            title="Delete node"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        type="text"
        value={data.objective || ""}
        onChange={(e) => data.onChange?.(id, { ...data, objective: e.target.value })}
        placeholder="Proposal Objective..."
        className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 font-semibold text-slate-100 text-xs focus:outline-none focus:border-purple-400 mb-1.5"
      />

      <div className="grid grid-cols-2 gap-1.5 mb-1.5 font-mono text-[10px]">
        <div>
          <label className="text-slate-400 block mb-0.5">Facility</label>
          <select
            value={data.facility || "ISS CIR"}
            onChange={(e) => data.onChange?.(id, { ...data, facility: e.target.value })}
            className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-1.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ISS CIR">ISS CIR</option>
            <option value="Cygnus Duct (Saffire)">Cygnus Duct (Saffire)</option>
            <option value="ISS Glovebox (MSG)">ISS Glovebox (MSG)</option>
            <option value="Drop Tower (5.18s)">Drop Tower (5.18s)</option>
            <option value="Sounding Rocket">Sounding Rocket</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-0.5">Flow Speed</label>
          <input
            type="text"
            value={data.airflow || "15 cm/s"}
            onChange={(e) => data.onChange?.(id, { ...data, airflow: e.target.value })}
            className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-1.5 py-1 text-slate-200 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-0.5">Oxygen Index</label>
          <input
            type="text"
            value={data.oxygen || "26% O₂"}
            onChange={(e) => data.onChange?.(id, { ...data, oxygen: e.target.value })}
            className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-1.5 py-1 text-slate-200 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-0.5">Pressure</label>
          <input
            type="text"
            value={data.pressure || "56 kPa"}
            onChange={(e) => data.onChange?.(id, { ...data, pressure: e.target.value })}
            className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-1.5 py-1 text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      <input
        type="text"
        value={data.geometry || "0.4m x 1.0m duct sample"}
        onChange={(e) => data.onChange?.(id, { ...data, geometry: e.target.value })}
        placeholder="Fuel geometry & dimensions..."
        className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-purple-400"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-2.5 !h-2.5" />
    </div>
  );
});
ExperimentNode.displayName = "ExperimentNode";
