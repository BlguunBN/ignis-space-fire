"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, FileText, ShieldAlert } from "lucide-react";
import { EvidenceBrief } from "../lib/synthesis";
import { saveResearcherItem } from "../lib/researcher-items";

interface GroundedBriefDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brief: EvidenceBrief;
}

export function GroundedBriefDrawer({ isOpen, onClose, brief }: GroundedBriefDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(brief.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([brief.markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ignis-evidence-brief-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                {brief.title}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Corpus Version: {brief.corpusVersion} • Citations: {brief.citedRecordIds.length} investigations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={async () => { try { await saveResearcherItem("brief", brief.title, { text: brief.markdownContent }); setSaveStatus("Saved to workspace"); } catch (error) { setSaveStatus(error instanceof Error ? error.message : "Could not save brief."); } }} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200">Save to account</button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Markdown"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed space-y-4 select-text">
          {saveStatus && <p role="status">{saveStatus}</p>}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>
              Deterministic evidence synthesis compiled strictly from verified NASA Physical Sciences Informatics (PSI) records. Hallucinated extrapolation is disabled.
            </span>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 overflow-x-auto">
            {brief.markdownContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Inquiry: {brief.querySummary}</span>
          <span>IGNIS Research Engine</span>
        </div>
      </div>
    </div>
  );
}
