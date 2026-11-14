"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Copy, ExternalLink, FileText, X } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import { formatCitations } from "../lib/citations";

interface PDFEvidenceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  record: ExperimentRecord | null;
}

function safeSourceUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function PDFEvidenceViewer({ isOpen, onClose, record }: PDFEvidenceViewerProps) {
  const [citationFormat, setCitationFormat] = useState<"apa" | "bibtex" | "ris" | "ieee">("apa");
  const [copied, setCopied] = useState(false);
  const citations = useMemo(() => record ? formatCitations(record) : null, [record]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;
  const locator = record.claim_locator_details;
  const sourceUrl = safeSourceUrl(record.source_url);
  const pdfUrl = safeSourceUrl(locator?.pdfUrl);
  const copyCitation = async () => {
    if (!citations) return;
    try {
      await navigator.clipboard.writeText(citations[citationFormat]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-amber-400/10 p-2.5 text-amber-400"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs text-slate-400">Study evidence</p><h2 id="evidence-title" className="mt-1 text-lg font-semibold leading-snug text-white">{record.investigation}</h2></div></div>
          <button type="button" onClick={onClose} aria-label="Close evidence" className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"><X className="h-5 w-5" /></button>
        </header>
        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-5">
          <div className="space-y-6 p-5 sm:p-7 lg:col-span-3">
            <section><p className="text-xs font-medium text-amber-400">Recorded finding</p><p className="mt-3 text-base leading-relaxed text-slate-100">{record.finding}</p>{record.limitations.length > 0 && <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"><h3 className="text-sm font-medium text-slate-200">Limitations</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-slate-400">{record.limitations.map((limit, index) => <li key={index}>{limit}</li>)}</ul></div>}</section>
            {locator?.quote && <section><h3 className="text-sm font-medium text-slate-200">Recorded source excerpt</h3><blockquote className="mt-3 border-l-2 border-amber-400/70 pl-4 text-sm leading-relaxed text-slate-300">{locator.quote}</blockquote><p className="mt-3 text-xs text-slate-500">Confirm the excerpt and location against the original source.</p></section>}
            <section><h3 className="text-sm font-medium text-slate-200">Reported conditions</h3><dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[
              ["Oxygen", record.oxygen_pct == null ? "Not stated" : `${record.oxygen_pct}%`],
              ["Airflow", record.airflow_cm_s == null ? "Not stated" : `${record.airflow_cm_s} cm/s`],
              ["Pressure", record.pressure_kpa == null ? "Not stated" : `${record.pressure_kpa} kPa`],
              ["Material", record.material || "Not stated"],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-200">{value}</dd></div>)}</dl></section>
          </div>
          <aside className="space-y-5 border-t border-white/[0.07] bg-white/[0.015] p-5 sm:p-7 lg:col-span-2 lg:border-l lg:border-t-0">
            <section><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100"><BookOpen className="h-4 w-4 text-amber-400" />Source details</h3><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-slate-500">Location</dt><dd className="mt-1 text-slate-300">{record.source_locator || "Not stated"}</dd></div>{locator?.pageNumber != null && <div><dt className="text-xs text-slate-500">Recorded page</dt><dd className="mt-1 text-slate-300">{locator.pageNumber}</dd></div>}{locator?.section && <div><dt className="text-xs text-slate-500">Section</dt><dd className="mt-1 text-slate-300">{locator.section}</dd></div>}<div><dt className="text-xs text-slate-500">Review status</dt><dd className="mt-1 text-slate-300">{record.verification_status.replace(/_/g, " ")}</dd></div></dl>
              <div className="mt-4 flex flex-wrap gap-2">{sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300">Open source <ExternalLink className="h-3 w-3" /><span className="sr-only"> (opens in a new tab)</span></a>}{pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]">Open document <ExternalLink className="h-3 w-3" /><span className="sr-only"> (opens in a new tab)</span></a>}</div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">The original document opens separately. This panel shows library metadata, not a reproduction of the source page.</p>
            </section>
            <section className="border-t border-white/[0.07] pt-5"><h3 className="text-sm font-semibold text-slate-100">Generated reference</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">Check author, year, and publication details against the source before citing.</p><div className="mt-3 flex flex-wrap gap-1">{(["apa", "bibtex", "ris", "ieee"] as const).map((format) => <button key={format} type="button" onClick={() => setCitationFormat(format)} aria-pressed={citationFormat === format} className={`rounded-lg px-2.5 py-1.5 text-xs uppercase ${citationFormat === format ? "bg-white/[0.12] text-white" : "text-slate-400 hover:bg-white/[0.05]"}`}>{format}</button>)}</div><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs leading-relaxed text-slate-300">{citations ? citations[citationFormat] : "Formatting reference…"}</pre><button type="button" onClick={copyCitation} disabled={!citations} className="mt-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy reference"}</button></section>
          </aside>
        </div>
      </section>
    </div>
  );
}
