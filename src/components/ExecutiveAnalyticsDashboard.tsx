"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Compass,
  Database,
  FileSearch,
  Flame,
  FlaskConical,
  Layers3,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import { rankFireSafetyEvidence } from "../lib/fire-safety-ranking";

interface ExecutiveAnalyticsDashboardProps {
  records: ExperimentRecord[];
  onSelectRecord?: (recordId: string) => void;
  onFilterRegime?: (gravity: string) => void;
  onOpenExplorer?: () => void;
  onOpenAssistant?: (prompt: string) => void;
  onOpenCoverage?: () => void;
  onOpenSimulator?: () => void;
  onOpenSources?: () => void;
}

type ResearchLens = "all" | "spread" | "extinction" | "cool_flames";
const LENSES: { id: ResearchLens; label: string; pattern?: RegExp }[] = [
  { id: "all", label: "Habitat safety" },
  { id: "spread", label: "Flame spread", pattern: /flame spread|propagation|spread rate/i },
  { id: "extinction", label: "Extinction", pattern: /extinct|suppress|quench/i },
  { id: "cool_flames", label: "Cool flames", pattern: /cool flame|low.temperature/i },
];
const RANKING_QUESTIONS: Record<ResearchLens, string> = {
  all: "spacecraft cabin solid material flame spread flammability airflow",
  spread: "solid material flame spread under ventilation in microgravity",
  extinction: "solid material flame extinction and suppression in microgravity",
  cool_flames: "liquid droplet cool flame extinction in microgravity",
};

const GRAVITIES = [
  { id: "microgravity", label: "Microgravity" },
  { id: "partial_gravity", label: "Partial gravity" },
  { id: "terrestrial", label: "Terrestrial" },
] as const;
const MATERIALS = [
  { id: "solid_plastic", label: "Plastics" },
  { id: "thick_solid", label: "Thick solids" },
  { id: "solid_fabric", label: "Fabrics" },
  { id: "liquid_droplet", label: "Liquid droplets" },
  { id: "gaseous_fuel", label: "Gaseous fuels" },
  { id: "wire_insulation", label: "Wire insulation" },
] as const;

const panel = "rounded-xl border border-white/[0.09] bg-[#13171e]";
const smallTitle = "text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400";
const focusStyle = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400";

function SourceTag({ record }: { record: ExperimentRecord }) {
  const label =
    record.source_type === "NASA_PSI"
      ? "NASA PSI"
      : record.source_type === "NTRS"
      ? "NASA NTRS"
      : record.source_type === "AGENCY_REPORT" || record.source_type === "NASA_WEB"
      ? "Agency Report"
      : "Published source";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      {label}
    </span>
  );
}

export function ExecutiveAnalyticsDashboard({
  records,
  onSelectRecord,
  onFilterRegime,
  onOpenExplorer,
  onOpenAssistant,
  onOpenCoverage,
  onOpenSimulator,
  onOpenSources,
}: ExecutiveAnalyticsDashboardProps) {
  const [lens, setLens] = useState<ResearchLens>("all");

  const summary = useMemo(() => {
    const verified = records.filter((r) => r.verification_status === "verified").length;
    const nasaPsi = records.filter((r) => r.source_type === "NASA_PSI").length;
    const programmes = new Set(records.map((r) => r.programme).filter(Boolean)).size;
    const measurements = [
      { label: "Oxygen", count: records.filter((r) => r.oxygen_pct != null).length, unit: "O₂ concentration" },
      { label: "Airflow", count: records.filter((r) => r.airflow_cm_s != null).length, unit: "Flow velocity" },
      { label: "Pressure", count: records.filter((r) => r.pressure_kpa != null).length, unit: "Ambient pressure" },
    ];
    const quality = [
      { label: "NASA primary", count: records.filter((r) => r.quality === "primary_nasa").length },
      { label: "Peer reviewed", count: records.filter((r) => r.quality === "peer_reviewed_nasa").length },
      { label: "Supporting", count: records.filter((r) => r.quality === "supporting").length },
    ];
    const matrix = MATERIALS.map((material) => ({
      ...material,
      counts: GRAVITIES.map((gravity) => records.filter(
        (r) => r.material_class === material.id && r.gravity === gravity.id
      ).length),
    }));
    const unclassified = records.filter(
      (r) => !MATERIALS.some((m) => m.id === r.material_class)
    ).length;
    return { verified, nasaPsi, programmes, measurements, quality, matrix, unclassified };
  }, [records]);

  const featured = useMemo(() => {
    const pattern = LENSES.find((item) => item.id === lens)?.pattern;
    const filtered = pattern
      ? records.filter((r) => pattern.test([r.investigation, r.finding, r.fire_safety_relevance].join(" ")))
      : records;
    const ranked = rankFireSafetyEvidence(filtered, RANKING_QUESTIONS[lens]);
    const seen = new Set<string>();
    return ranked.filter(({ record }) => {
      const key = record.investigation.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 4);
  }, [records, lens]);

  const ask = (question: string) => onOpenAssistant?.(question);

  return (
    <div className="space-y-5 text-slate-100">
      <section className={panel + " overflow-hidden"}>
        <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-amber-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/10"><Flame className="h-3.5 w-3.5" /></span>
              FLARE / Research intelligence
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold leading-[1.14] tracking-tight text-white sm:text-4xl lg:text-[42px]">
              Understand fire in low gravity. Build safer habitats.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
              Navigate experimental evidence, investigate tested conditions, and trace findings to their sources. From NASA combustion research to clearer fire-safety questions.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button type="button" onClick={onOpenExplorer} disabled={!onOpenExplorer} className={"inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#111318] transition-colors hover:bg-amber-300 disabled:opacity-50 " + focusStyle}>
                <Compass className="h-4 w-4" /> Explore evidence <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={onOpenSimulator} disabled={!onOpenSimulator} className={"inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.14] px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/[0.06] disabled:opacity-50 " + focusStyle}>
                <FlaskConical className="h-4 w-4" /> Open flame lab
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-between border-t border-white/[0.07] bg-[#10141a] p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div>
              <p className={smallTitle}>A clearer research workflow</p>
              <div className="mt-6 space-y-5">
                {[
                  ["01", "Discover", "Find relevant investigations"],
                  ["02", "Verify", "Inspect measured conditions and sources"],
                  ["03", "Compare", "Examine differences and missing data"],
                  ["04", "Interpret", "Generate a cited evidence brief"],
                ].map(([step, title, sub]) => (
                  <div key={step} className="flex gap-4">
                    <span className="font-mono text-xs text-amber-400/80">{step}</span>
                    <div><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{sub}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 border-t border-white/[0.08] pt-5">
              <p className="text-xs leading-5 text-slate-400">Evidence first. Simulations and AI interpretations are not observed experimental results.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Indexed collection status" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Indexed records", value: records.length, detail: summary.programmes + " programmes", Icon: Database },
          { label: "Marked verified", value: summary.verified, detail: "Internal review status", Icon: CheckCircle2 },
          { label: "NASA PSI records", value: summary.nasaPsi, detail: "Source-type metadata", Icon: BookOpen },
          { label: "Oxygen reported", value: summary.measurements[0].count, detail: "Records with O₂ values", Icon: Wind },
        ].map(({ label, value, detail, Icon }) => (
          <div key={label} className={panel + " p-4 sm:p-5"}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <Icon className="h-4 w-4 text-slate-600" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-white tabular-nums">{value}</p>
            <p className="mt-3 text-[11px] text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <section className={panel + " p-5 sm:p-6 xl:col-span-7"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={smallTitle}>The research landscape</p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-white">Evidence coverage</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">Number of indexed records by fuel class and gravity regime.</p>
            </div>
            {onOpenCoverage && <button type="button" onClick={onOpenCoverage} className={"inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 " + focusStyle}>Full coverage map <ArrowUpRight className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[485px] border-separate border-spacing-1.5 text-left">
              <thead>
                <tr>
                  <th scope="col" className="w-[34%] px-2 pb-2 text-[11px] font-medium text-slate-500">Material class</th>
                  {GRAVITIES.map((gravity) => <th scope="col" key={gravity.id} className="pb-2 text-center text-[11px] font-medium text-slate-400">
                    <button type="button" disabled={!onFilterRegime} onClick={() => onFilterRegime?.(gravity.id)} className={"rounded px-1 py-1 hover:text-amber-300 disabled:cursor-default disabled:hover:text-slate-400 " + focusStyle}>{gravity.label}</button>
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {summary.matrix.map((material) => (
                  <tr key={material.id}>
                    <th scope="row" className="px-2 py-3 text-xs font-medium text-slate-300">{material.label}</th>
                    {material.counts.map((count, index) => (
                      <td key={GRAVITIES[index].id} className="p-0 text-center">
                        <div title={count === 0 ? "No indexed records in this category" : count + " indexed records"} className={"flex h-10 items-center justify-center rounded-md border text-sm font-semibold tabular-nums " + (count === 0 ? "border-white/[0.04] bg-white/[0.02] text-slate-600" : count >= 8 ? "border-amber-400/25 bg-amber-400/25 text-amber-200" : count >= 3 ? "border-amber-400/15 bg-amber-400/[0.12] text-amber-200" : "border-white/[0.08] bg-white/[0.06] text-slate-200")}>
                          {count === 0 ? "—" : count}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            Blank cells mean no records are indexed here, not proof that no research exists.
            {summary.unclassified > 0 && " " + summary.unclassified + " additional records have other material classifications."}
          </p>
        </section>
        <section className={panel + " p-5 sm:p-6 xl:col-span-5"}>
          <p className={smallTitle}>Data transparency</p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-white">Reported conditions</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">Availability of parameters in indexed records, not measurements of fire risk.</p>
          <div className="mt-8 space-y-7">
            {summary.measurements.map((metric) => (
              <div key={metric.label}>
                <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-200">{metric.label}</span>
                  <span className="font-mono text-xs text-slate-400">{metric.count} / {records.length}</span>
                </div>
                <div role="progressbar" aria-label={metric.unit + " available"} aria-valuemin={0} aria-valuemax={records.length} aria-valuenow={metric.count} className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-amber-400 transition-[width]" style={{ width: (records.length ? (metric.count / records.length) * 100 : 0) + "%" }} />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">{metric.unit}</p>
              </div>
            ))}
          </div>
          <p className="mt-7 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-500">
            {summary.measurements[0].count} records with oxygen measurements · {summary.measurements[1].count} records with airflow measurements. Missing values are never treated as zero.
          </p>
          {onOpenSources && <button type="button" onClick={onOpenSources} className={"mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white " + focusStyle}>Inspect data sources <ChevronRight className="h-3.5 w-3.5" /></button>}
        </section>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <section className={panel + " p-5 sm:p-6 xl:col-span-7"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={smallTitle}>From the archive</p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-white">Investigations to explore</h3>
            </div>
            <button type="button" onClick={onOpenExplorer} disabled={!onOpenExplorer} className={"inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 disabled:opacity-50 " + focusStyle}>Browse all <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div role="group" aria-label="Filter investigations by topic" className="mt-5 flex flex-wrap gap-1.5">
            {LENSES.map((item) => <button key={item.id} type="button" onClick={() => setLens(item.id)} aria-pressed={lens === item.id} className={"rounded-md border px-3 py-2 text-xs font-medium transition-colors " + (lens === item.id ? "border-amber-400/30 bg-amber-400/[0.12] text-amber-200" : "border-white/[0.09] text-slate-400 hover:bg-white/[0.04] hover:text-white") + " " + focusStyle}>{item.label}</button>)}
          </div>
          <div className="mt-4 divide-y divide-white/[0.07]">
            {featured.length === 0 && <p className="py-8 text-sm text-slate-400">No indexed investigations match this topic.</p>}
            {featured.map(({ record, score, reasons, warnings }) => (
              <button key={record.id} type="button" onClick={() => onSelectRecord?.(record.id)} disabled={!onSelectRecord} className={"group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-white/[0.02] disabled:cursor-default " + focusStyle}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-amber-200">{record.investigation}</p>
                  <p className="mt-1.5 truncate text-xs text-slate-400">{record.material} · {record.gravity.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-xs text-amber-200/90">Relevance index {score}/100 · {reasons[0] || "Contextual evidence only"}</p>
                  {warnings.length > 0 && <p className="mt-1 truncate text-[11px] text-slate-500" title={warnings[0]}>Caution: {warnings[0]}</p>}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    <SourceTag record={record} />
                    <span className="text-[11px] text-slate-500">{record.oxygen_pct == null ? "O₂ unreported" : record.oxygen_pct + "% O₂"}</span>
                    {record.verification_status === "verified" && <span className="text-[11px] text-emerald-400/80">Marked verified</span>}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-amber-300" />
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">A transparent, question-specific relevance index ranks these records by topic, material applicability, provenance and reported conditions. The score is a discovery heuristic, never a fire-risk or safety prediction. “Marked verified” refers only to internal review status.</p>
        </section>
        <section className={panel + " p-5 sm:p-6 xl:col-span-5"}>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <p className={smallTitle}>Ask the evidence</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">Start with a fire-safety question</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">Open an investigation question in the grounded research assistant.</p>
          <div className="mt-6 space-y-2.5">
            {[
              { Icon: ShieldCheck, title: "Habitat material safety", question: "Which indexed NASA investigations examine the flammability of spacecraft-relevant solid materials? Cite the sources and explain their limitations." },
              { Icon: Wind, title: "Oxygen and ventilation", question: "How do reported oxygen levels and airflow conditions affect flame spread in the indexed evidence? Distinguish measurements from assumptions." },
              { Icon: Layers3, title: "Suppression and extinction", question: "What does the indexed NASA combustion evidence say about flame extinction and potential fire suppression implications? Cite exact supporting records." },
            ].map(({ Icon, title, question }) => (
              <button key={title} type="button" disabled={!onOpenAssistant} onClick={() => ask(question)} className={"group flex w-full items-center gap-3 rounded-lg border border-white/[0.08] bg-[#10141a] p-4 text-left hover:border-amber-400/20 hover:bg-white/[0.03] disabled:opacity-50 " + focusStyle}>
                <Icon className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-amber-300" aria-hidden="true" />
                <span className="flex-1 text-sm font-medium text-slate-200">{title}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-2 border-t border-white/[0.08] pt-4">
            <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <p className="text-[11px] leading-5 text-slate-500">AI-generated interpretations require source verification. Missing experimental evidence must be disclosed.</p>
          </div>
        </section>
      </div>

      <section className={panel + " flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"} aria-label="Source quality">
        <div>
          <p className={smallTitle}>Source quality</p>
          <h3 className="mt-1.5 text-sm font-semibold text-white">What the collection contains</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.quality.map((item) => <div key={item.label} className="inline-flex items-center gap-3 rounded-md border border-white/[0.08] px-3 py-2 text-xs text-slate-400"><span>{item.label}</span><strong className="font-mono text-sm text-white">{item.count}</strong></div>)}
        </div>
        <p className="w-full text-[11px] text-slate-500">Source quality and verification are repository metadata. An indexed record is not necessarily an independent experiment or a safety certification.</p>
      </section>
    </div>
  );
}
