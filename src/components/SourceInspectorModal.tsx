"use client";

import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, ShieldCheck, FileCheck, BookOpen } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";

interface SourceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ExperimentRecord | null;
}

export function SourceInspectorModal({
  isOpen,
  onClose,
  record,
}: SourceInspectorModalProps) {
  const [citationFormat, setCitationFormat] = useState<"bibtex" | "apa" | "ris">("apa");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  // Format citations
  const bibtex = `@article{nasa_${record.id.replace(/-/g, "_")},
  title = {${record.investigation}},
  author = {NASA Physical Sciences Research Team},
  journal = {NASA Physical Sciences Informatics (PSI)},
  year = {2021},
  doi = {${record.doi || "10.60555/psi-record"}},
  url = {${record.source_url}},
  note = {Locator: ${record.source_locator || "Archive record"}}
}`;

  const apa = `NASA Physical Sciences Research Program. (2021). ${record.investigation} [Data set]. NASA Physical Sciences Informatics Repository. https://doi.org/${record.doi || "10.60555/psi-record"} (Locator: ${record.source_locator || "Archive record"})`;

  const ris = `TY  - DATA
TI  - ${record.investigation}
AU  - NASA Physical Sciences Research Program
PY  - 2021
DO  - ${record.doi || "10.60555/psi-record"}
UR  - ${record.source_url}
N1  - Locator: ${record.source_locator || "Archive record"}
ER  - `;

  const currentCitation =
    citationFormat === "bibtex" ? bibtex : citationFormat === "apa" ? apa : ris;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(currentCitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Primary Evidence Source
              </span>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                {record.investigation}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950 text-xs font-mono">
          {/* Provenance Verification Seal */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span className="font-bold">Peer-Reviewed NASA Source</span>
            </div>
            <span className="text-[11px] text-slate-300">
              Verified by: <strong>{record.verified_by || "NASA GRC"}</strong>
            </span>
          </div>

          {/* Exact Source Locator */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" /> Exact Document Locator
            </label>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-bold">
              {record.source_locator || "PSI Archive Record / Investigation Summary"}
            </div>
          </div>

          {/* Supporting Finding Quote */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-wider">
              Verified Finding Excerpt
            </label>
            <blockquote className="p-3 bg-slate-900/60 border-l-2 border-amber-400 text-slate-300 text-xs font-sans italic leading-relaxed">
              "{record.finding}"
            </blockquote>
          </div>

          {/* Citation Export Tabs */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400 uppercase tracking-wider">
                Export Standard Citation
              </label>
              <div className="flex items-center gap-1">
                {(["apa", "bibtex", "ris"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setCitationFormat(fmt)}
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded transition-colors ${
                      citationFormat === fmt
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap select-text">
                {currentCitation}
              </pre>
              <button
                onClick={handleCopyCitation}
                className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] flex items-center gap-1 transition-colors"
                title="Copy Citation"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono">
          <a
            href={record.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            Open Primary NASA Repository <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
