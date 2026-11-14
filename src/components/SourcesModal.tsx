"use client";

import React, { useState } from "react";
import { X, BookOpen, ExternalLink, Search } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExperimentRecord[];
}

export function SourcesModal({ isOpen, onClose, records }: SourcesModalProps) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = records.filter((record) =>
    [record.investigation, record.programme, record.platform, record.material, record.source_locator]
      .some((value) => value?.toLowerCase().includes(term))
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], summary'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md md:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="sources-title" onKeyDown={handleKeyDown} className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101216] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-amber-400/10 p-2.5 text-amber-400"><BookOpen className="h-5 w-5" /></span>
            <div><h2 id="sources-title" className="text-xl font-semibold tracking-tight text-white">Sources</h2><p className="mt-1 text-sm text-slate-400">Browse the research behind the evidence.</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sources" className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input autoFocus aria-label="Search sources" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search investigations, materials, or platforms" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60" /></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-100">Research library</h3><p aria-live="polite" className="text-xs text-slate-400">{filtered.length} of {records.length} studies</p></div>
          {filtered.length === 0 ? <p className="rounded-xl border border-white/[0.06] px-5 py-10 text-center text-sm text-slate-400">No sources match your search. Try another term.</p> : (
            <ul className="mt-3 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
              {filtered.map((record) => (
                <li key={record.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                  <div className="min-w-0 space-y-1.5"><h4 className="text-sm font-medium text-slate-100">{record.investigation}</h4><p className="text-xs leading-relaxed text-slate-400">{record.platform} · {record.material}</p><p className="text-xs text-slate-400">{record.oxygen_pct == null ? "Oxygen not stated" : `${record.oxygen_pct}% O₂`} · {record.airflow_cm_s == null ? "Airflow not stated" : `${record.airflow_cm_s} cm/s airflow`}</p><p className="text-xs leading-relaxed text-slate-500">{record.source_locator || "Source locator not stated"}</p></div>
                  {record.source_url && <a href={record.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">View source <ExternalLink className="h-3 w-3" /><span className="sr-only"> (opens in a new tab)</span></a>}
                </li>
              ))}
            </ul>
          )}
          <details className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-slate-300"><summary className="cursor-pointer font-medium">About the evidence</summary><p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-400">Consult each source and its stated conditions before applying a finding. Differences in apparatus, gravity, fuel, and ventilation can limit comparisons between investigations.</p></details>
        </div>
      </section>
    </div>
  );
}
