"use client";

import React, { useMemo } from "react";
import { ArrowRight, BookOpen, Bot, Compass, FlaskConical } from "lucide-react";
import { BarChart } from "./charts/bar-chart";
import { Bar } from "./charts/bar";
import { BarXAxis } from "./charts/bar-x-axis";
import { Grid } from "./charts/grid";
import { ExperimentRecord } from "../types/evidence";

interface ExecutiveAnalyticsDashboardProps {
  records: ExperimentRecord[];
  onSelectRecord?: (recordId: string) => void;
  onFilterRegime?: (gravity: string) => void;
  onOpenExplorer?: () => void;
  onOpenAssistant?: (prompt: string) => void;
}

export function ExecutiveAnalyticsDashboard({ records, onSelectRecord, onOpenExplorer, onOpenAssistant }: ExecutiveAnalyticsDashboardProps) {
  const summary = useMemo(() => {
    const quality = [
      { name: "NASA primary", count: records.filter((record) => record.quality === "primary_nasa").length },
      { name: "Peer reviewed", count: records.filter((record) => record.quality === "peer_reviewed_nasa").length },
      { name: "Supporting", count: records.filter((record) => record.quality === "supporting").length },
    ];
    return {
      quality,
      programmes: new Set(records.map((record) => record.programme).filter(Boolean)).size,
      oxygen: records.filter((record) => record.oxygen_pct != null).length,
      airflow: records.filter((record) => record.airflow_cm_s != null).length,
    };
  }, [records]);

  return (
    <div className="space-y-5 text-slate-100">
      <section aria-label="Library summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Studies", value: records.length },
          { label: "Programmes", value: summary.programmes },
          { label: "Oxygen data", value: summary.oxygen },
          { label: "Airflow data", value: summary.airflow },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-white/[0.09] bg-[#13171e] p-5">
            <p className="text-xs font-medium text-slate-400">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-white tabular-nums">{item.value}</p>
          </div>
        ))}
      </section>
      <p className="text-[11px] text-slate-500">{summary.oxygen} studies with oxygen measurements · {summary.airflow} studies with airflow measurements</p>

      <div className="grid items-start gap-5 xl:grid-cols-12">
        <section className="rounded-lg border border-white/[0.09] bg-[#13171e] p-5 sm:p-6 xl:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Library at a glance</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">Source quality</h2>
            </div>
            <BookOpen className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>
          {records.length > 0 ? (
            <>
              <div className="bklit-overview-chart mt-5" aria-hidden="true">
                <BarChart data={summary.quality} xDataKey="name" aspectRatio="2 / 1" margin={{ top: 16, right: 12, bottom: 36, left: 12 }} animationDuration={0}>
                  <Grid horizontal stroke="rgba(255,255,255,0.08)" />
                  <Bar dataKey="count" fill="#e8a94b" animate={false} />
                  <BarXAxis showAllLabels />
                </BarChart>
              </div>
              <ul aria-label="Source quality counts" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {summary.quality.map((item) => <li key={item.name} className="rounded-md bg-white/[0.03] px-3 py-2 text-[11px] text-slate-300 flex items-center justify-between"><span>{item.name}</span><strong className="text-sm text-white tabular-nums">{item.count}</strong></li>)}
              </ul>
            </>
          ) : (
            <p className="mt-6 rounded-md bg-white/[0.03] p-4 text-[11px] text-slate-400">No studies are available yet.</p>
          )}
        </section>

        <section className="rounded-lg border border-white/[0.09] bg-[#13171e] p-5 sm:p-6 xl:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Continue researching</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">Explore the evidence</h2>
            </div>
            <FlaskConical className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>
          <div className="mt-5 space-y-2">
            {records.slice(0, 3).map((record) => <button key={record.id} type="button" onClick={() => onSelectRecord?.(record.id)} disabled={!onSelectRecord} className="flex w-full items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-default"><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-200">{record.investigation}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{record.programme} · {record.material}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-slate-500" /></button>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {onOpenExplorer && <button type="button" onClick={onOpenExplorer} className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300"><Compass className="h-4 w-4" />Explore studies</button>}
            {onOpenAssistant && <button type="button" onClick={() => onOpenAssistant("What does the research library say about flame spread in microgravity?")} className="inline-flex items-center gap-2 rounded-md border border-white/[0.09] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.05]"><Bot className="h-4 w-4" />Ask a research question</button>}
          </div>
        </section>
      </div>
    </div>
  );
}
