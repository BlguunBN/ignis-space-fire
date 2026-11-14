"use client";

import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, ChevronDown, Clipboard, ExternalLink, FileText, Flame, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import experimentsData from "@/data/experiments.json";
import { computeEvidenceCoverage } from "@/lib/coverage";
import { createInquiryKey } from "@/lib/inquiry";
import { assessQuerySupport, rankEvidence } from "@/lib/ranking";
import { CORPUS_VERSION, isEligibleEvidence, sourceReviewedRecords } from "@/lib/sourceReviewedRecords";
import { buildDeterministicSynthesis, type SynthesisResponse } from "@/lib/synthesis";
import type { ExperimentRecord, RankedEvidence, SearchQuery } from "@/types/evidence";

const records = sourceReviewedRecords(experimentsData as ExperimentRecord[]).filter(isEligibleEvidence);
const scenarios = [
  { id: "pmma", title: "PMMA & ventilation", question: "Which investigations study PMMA and flame spread under ventilation?", query: { material: "PMMA", phenomenon: "flame_spread" } },
  { id: "fabric", title: "Fabric flame spread", question: "What does NASA report about flame spread over fabric?", query: { material: "fabric", phenomenon: "flame_spread" } },
  { id: "extinction", title: "Flame extinction", question: "Which investigations study the limits of flame extinction?", query: { phenomenon: "extinction" } },
] satisfies { id: string; title: string; question: string; query: SearchQuery }[];

type Section = "research" | "map" | "sources";
type Panel = "evidence" | "compare" | "brief";

function displayNumber(value: number | null | undefined, unit: string) {
  return value == null ? "Not reported" : `${value} ${unit}`;
}

function parseQuestion(question: string): SearchQuery {
  const q = question.toLowerCase();
  const query: SearchQuery = { freeText: question.trim() };
  if (/\b(pmma|acrylic)\b/.test(q)) query.material = "PMMA";
  else if (/\b(fabric|textile|cotton|sibal)\b/.test(q)) query.material = "fabric";
  if (/flame[\s-]*spread|spread[\s-]*rate/.test(q)) query.phenomenon = "flame_spread";
  else if (/extinction|extinguish/.test(q)) query.phenomenon = "extinction";
  const oxygen = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:o2|o₂|oxygen)/);
  const pressure = q.match(/(\d+(?:\.\d+)?)\s*kpa/);
  const flow = q.match(/(\d+(?:\.\d+)?)\s*cm\s*\/\s*s/);
  if (oxygen) query.oxygenPct = Number(oxygen[1]);
  if (pressure) query.pressureKpa = Number(pressure[1]);
  if (flow) query.airflowCmS = Number(flow[1]);
  if (query.material || query.phenomenon || oxygen || pressure || flow) delete query.freeText;
  return query;
}

function Status({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "verified" | "warning" | "neutral" }) {
  return <span className={ `status status-${tone}` }>{tone === "verified" && <Check size={13} aria-hidden="true" />}{children}</span>;
}

function Conditions({ experiment }: { experiment: ExperimentRecord }) {
  return <dl className="conditions">
    <div><dt>Material</dt><dd>{experiment.material}</dd></div>
    <div><dt>Oxygen</dt><dd>{displayNumber(experiment.oxygen_pct, "% O₂")}</dd></div>
    <div><dt>Pressure</dt><dd>{displayNumber(experiment.pressure_kpa, "kPa")}</dd></div>
    <div><dt>Airflow</dt><dd>{displayNumber(experiment.airflow_cm_s, "cm/s")}</dd></div>
  </dl>;
}

function EvidenceItem({ item, selected, compared, onInspect, onCompare }: {
  item: RankedEvidence; selected: boolean; compared: boolean; onInspect: () => void; onCompare: () => void;
}) {
  const { experiment, breakdown } = item;
  return <article className={ `evidence-item ${selected ? 'is-selected' : ''}` }>
    <div className="evidence-heading">
      <div><div className="record-meta"><span>{experiment.programme}</span><span>{experiment.psi_id || "NASA source"}</span><Status tone="verified">Source reviewed</Status></div>
        <h3><button className="record-title" onClick={onInspect}>{experiment.investigation}</button></h3>
        <p className="record-platform">{experiment.platform}</p>
      </div>
      <button className="compare-toggle" onClick={onCompare} aria-pressed={compared}>{compared ? "Remove" : "Compare"}</button>
    </div>
    <Conditions experiment={experiment} />
    <p className="finding-preview">{experiment.finding}</p>
    {breakdown.reasons.length > 0 && <p className="match-explanation">{breakdown.reasons.slice(0, 2).join(" · ")}</p>}
    {breakdown.missingParameters.length > 0 && <p className="missing-explanation">Not reported: {breakdown.missingParameters.join(", ")}</p>}
    <button className="text-action" onClick={onInspect}>Inspect evidence <ArrowRight size={15} aria-hidden="true" /></button>
  </article>;
}

function Inspector({ experiment }: { experiment: ExperimentRecord }) {
  return <section className="inspector-body" aria-labelledby="inspector-heading">
    <div className="inspector-intro"><div className="record-meta"><span>{experiment.programme}</span><span>{experiment.psi_id || "NASA source"}</span><Status tone="verified">Source reviewed</Status></div>
      <h2 id="inspector-heading">{experiment.investigation}</h2><p>{experiment.platform} · Investigation overview</p>
    </div>
    <section className="inspector-section"><div className="section-label">Research focus</div><p className="main-finding">{experiment.finding}</p></section>
    <section className="inspector-section"><div className="section-label">Reported conditions</div><Conditions experiment={experiment} />
      <p className="small-note">Conditions apply to this indexed overview. “Not reported” does not mean zero.</p>
    </section>
    <section className="inspector-section"><div className="section-label">What this can inform</div><p>{experiment.fire_safety_relevance}</p></section>
    <section className="limitation-block"><strong>Interpretation limits</strong><ul>{experiment.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul></section>
    <section className="source-card"><div><span className="section-label">Original source</span><strong>{experiment.source_locator}</strong><p>Review status applies to the indexed summary, not every claim in the source.</p></div>
      <a href={experiment.source_url} target="_blank" rel="noopener noreferrer">Open NASA record <ExternalLink size={14} aria-hidden="true" /></a>
    </section>
    <div className="media-empty"><BookOpen size={18} aria-hidden="true" /><div><strong>Source-matched imagery</strong><p>No reviewed image is indexed for this investigation. The original record remains available above.</p></div></div>
  </section>;
}

function Comparison({ selected, onRemove }: { selected: ExperimentRecord[]; onRemove: (id: string) => void }) {
  if (selected.length < 2) return <div className="empty-panel"><div className="empty-icon"><SlidersHorizontal size={22} /></div><h2>Compare investigations</h2><p>Select two studies from the evidence list to inspect their conditions and limitations side by side.</p><span>{selected.length} of 2 selected</span>{selected.map(e => <button key={e.id} className="text-action" onClick={() => onRemove(e.id)}>Remove {e.investigation} <X size={14}/></button>)}</div>;
  const [a, b] = selected;
  const rows = [
    ["Record scope", a.record_type.replaceAll("_", " "), b.record_type.replaceAll("_", " ")],
    ["Material", a.material, b.material], ["Gravity", a.gravity, b.gravity], ["Platform", a.platform, b.platform],
    ["Oxygen", displayNumber(a.oxygen_pct, "% O₂"), displayNumber(b.oxygen_pct, "% O₂")],
    ["Pressure", displayNumber(a.pressure_kpa, "kPa"), displayNumber(b.pressure_kpa, "kPa")],
    ["Airflow", displayNumber(a.airflow_cm_s, "cm/s"), displayNumber(b.airflow_cm_s, "cm/s")],
    ["Measurements", a.measurements.map(x => x.replaceAll("_", " ")).join(", "), b.measurements.map(x => x.replaceAll("_", " ")).join(", ")],
    ["Research focus", a.finding, b.finding],
  ];
  const differences = rows.filter(([, av, bv]) => av !== bv && av !== "Not reported" && bv !== "Not reported").map(([name]) => name.toLowerCase());
  return <section className="inspector-body"><div className="inspector-intro"><span className="eyebrow">Evidence comparison</span><h2>Compare investigations</h2><p>Study conditions and methods before drawing a conclusion.</p></div>
    <div className="compare-headings">{selected.map(e => <div key={e.id}><span>{e.programme} · {e.psi_id}</span><strong>{e.investigation}</strong><button className="text-action" onClick={() => onRemove(e.id)}>Remove <X size={13}/></button></div>)}</div>
    <div className="comparison-list">{rows.map(([name, av, bv]) => <div className="comparison-row" key={name}><span>{name}</span><div><strong>{a.programme}</strong>{av}</div><div><strong>{b.programme}</strong>{bv}</div></div>)}</div>
    <section className="limitation-block"><strong>What this comparison can establish</strong><p>These records differ in {differences.length ? differences.join(", ") : "reported detail"}. Missing conditions and different sample geometries prevent isolating a cause or ranking safety from this comparison.</p></section>
    <div className="source-links">{selected.map(e => <a key={e.id} href={e.source_url} target="_blank" rel="noopener noreferrer">{e.psi_id || e.investigation}: {e.source_locator} <ExternalLink size={13}/></a>)}</div>
  </section>;
}

function Brief({ brief, loading, onGenerate, onExport, onCopy }: { brief: SynthesisResponse | null; loading: boolean; onGenerate: () => void; onExport: () => void; onCopy: () => void }) {
  return <section className="inspector-body"><div className="inspector-intro"><span className="eyebrow">Research brief</span><h2>Turn evidence into a clear answer</h2><p>Review source-backed observations, relevance and limitations together.</p></div>
    {!brief ? <div className="brief-start"><Sparkles size={21} aria-hidden="true"/><h3>Build from your selected evidence</h3><p>The brief uses your comparison selection, or the investigation you are inspecting. It cannot establish safety or predict partial gravity behavior.</p><button className="primary-button" onClick={onGenerate} disabled={loading}>{loading ? "Building brief…" : "Generate evidence brief"} <ArrowRight size={16}/></button><p className="small-note">If the model is unavailable, a deterministic summary is shown.</p></div> :
      <><div className="brief-toolbar"><Status tone={brief.aiMode === "live_llm" ? "verified" : "warning"}>{brief.aiMode === "live_llm" ? "AI-assisted interpretation" : "Deterministic evidence summary"}</Status><div><button className="quiet-button" onClick={onCopy}><Clipboard size={14}/> Copy</button><button className="quiet-button" onClick={onExport}><FileText size={14}/> Download</button><button className="quiet-button" onClick={() => window.print()}>Print</button></div></div>
        <p className="small-note">{brief.modelUsed} · Corpus {brief.corpusVersion}. Check the original sources before use.</p>
        <BriefSection title="What NASA investigated" statements={brief.observations.map(o => ({ text: o.text, evidenceIds: [o.evidenceId] }))} sources={brief.citedSources}/>
        <BriefSection title="Why it is relevant" statements={brief.relevance} sources={brief.citedSources}/>
        <BriefSection title="What remains unknown" statements={brief.unknowns} sources={brief.citedSources}/>
        <button className="quiet-button" onClick={onGenerate} disabled={loading}>{loading ? "Updating…" : "Regenerate brief"}</button>
      </>}
  </section>;
}

function BriefSection({ title, statements, sources }: { title: string; statements: { text: string; evidenceIds: string[] }[]; sources: SynthesisResponse["citedSources"] }) {
  return <section className="brief-section"><h3>{title}</h3>{statements.length ? <ul>{statements.map((statement, i) => <li key={i}>{statement.text} {statement.evidenceIds.map(id => { const source = sources.find(s => s.id === id); return source ? <a key={id} href={source.sourceUrl} target="_blank" rel="noopener noreferrer">[{source.title}]</a> : null; })}</li>)}</ul> : <p>Not reported in the indexed evidence.</p>}</section>;
}

function briefMarkdown(question: string, brief: SynthesisResponse) {
  const statements = (items: { text: string; evidenceIds: string[] }[]) => items.map(item => `- ${item.text}${item.evidenceIds.length ? ` [${item.evidenceIds.join(', ')}]` : ''}`).join("\n") || "- Not reported in the indexed evidence.";
  return [
    "# IGNIS evidence brief", "", `**Question:** ${question || 'Browse the reviewed research'}`, `**Mode:** ${brief.aiMode === 'live_llm' ? 'AI-assisted interpretation' : 'Deterministic evidence summary'}`, `**Corpus:** ${brief.corpusVersion}`, "",
    "## What NASA investigated", statements(brief.observations.map(o => ({ text: o.text, evidenceIds: [o.evidenceId] }))), "",
    "## Why it is relevant", statements(brief.relevance), "", "## What remains unknown", statements(brief.unknowns), "", "## Sources",
    ...brief.citedSources.map(s => `- [${s.id}] ${s.title} — ${s.sourceLocator || 'Locator not reported'}: ${s.sourceUrl}`),
  ].join("\n");
}

function EvidenceMap({ onExplore }: { onExplore: (material: string) => void }) {
  const coverage = computeEvidenceCoverage(records);
  const omitted = records.filter(e => e.oxygen_pct == null || e.airflow_cm_s == null || !((e.oxygen_pct >= 20 && e.oxygen_pct <= 22) || (e.oxygen_pct >= 26 && e.oxygen_pct <= 34)) || !(e.airflow_cm_s === 0 || (e.airflow_cm_s >= 1 && e.airflow_cm_s <= 5) || (e.airflow_cm_s >= 10 && e.airflow_cm_s <= 20))).length;
  return <main className="secondary-page"><div className="page-heading"><div><span className="eyebrow">Corpus coverage</span><h1>Evidence Map</h1><p>Explore the conditions represented in the reviewed IGNIS index.</p></div><Status>{records.length} reviewed overviews</Status></div>
    <div className="map-note"><strong>Read this map carefully.</strong> Empty cells mean no matching reviewed record in this small index. They do not mean NASA has not tested a condition. Investigation summaries are not individual test runs.</div>
    <div className="coverage-summary"><div><strong>{coverage.summary.coveredBins}</strong><span>indexed combinations</span></div><div><strong>{coverage.summary.emptyBins}</strong><span>empty combinations</span></div><div><strong>{omitted}</strong><span>records with missing or out-of-range conditions</span></div></div>
    <div className="table-wrap"><table className="coverage-table"><thead><tr><th>Material</th><th>Oxygen</th><th>Airflow</th><th>Indexed records</th><th>Explore</th></tr></thead><tbody>{coverage.cells.map((cell, i) => <tr key={i}><td>{cell.materialClass}</td><td>{cell.atmosphereRegime}</td><td>{cell.airflowRegime}</td><td>{cell.count || "No indexed evidence"}</td><td><button className="text-action" onClick={() => onExplore(cell.materialClass)}>Explore material <ArrowRight size={14}/></button></td></tr>)}</tbody></table></div>
    <p className="small-note">The map uses only records reporting both oxygen and airflow within the displayed ranges. Bins are retrieval groupings, not safety thresholds.</p>
  </main>;
}

function Sources() {
  return <main className="secondary-page"><div className="page-heading"><div><span className="eyebrow">Transparency</span><h1>Sources &amp; Methods</h1><p>How evidence enters IGNIS and what its results can tell you.</p></div><Status>Corpus {CORPUS_VERSION}</Status></div>
    <div className="methods-grid"><section className="method-card"><BookOpen size={19}/><h2>A deliberately small index</h2><p>IGNIS currently includes {records.length} source-reviewed investigation overviews. Other indexed records remain under review and are excluded from research results.</p></section><section className="method-card"><SlidersHorizontal size={19}/><h2>Relevance, not risk</h2><p>Ordering uses requested material, phenomenon and reported conditions. Unknown values are not assumed. It is a retrieval aid, not a probability or a safety certification.</p></section><section className="method-card"><Sparkles size={19}/><h2>Interpretation modes</h2><p>Live AI can draft explanations from selected records. When unavailable, IGNIS compiles a deterministic summary. Citation links require human source review.</p></section></div>
    <h2 className="source-list-heading">Reviewed investigation sources</h2><div className="source-inventory">{records.map(e => <article key={e.id}><div><div className="record-meta"><span>{e.programme}</span><span>{e.psi_id}</span><Status tone="verified">Source reviewed</Status></div><h3>{e.investigation}</h3><p>{e.source_locator}</p></div><a href={e.source_url} target="_blank" rel="noopener noreferrer">Open source <ExternalLink size={14}/></a></article>)}</div>
    <div className="map-note"><strong>Scientific boundary.</strong> The index is not a complete inventory of NASA research. Microgravity observations do not quantitatively predict lunar or Martian fire behavior without dedicated evidence.</div>
  </main>;
}

export function ResearchWorkspace() {
  const [section, setSection] = useState<Section>("research");
  const [panel, setPanel] = useState<Panel>("evidence");
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [query, setQuery] = useState<SearchQuery>({});
  const [draft, setDraft] = useState<SearchQuery>({});
  const [activeId, setActiveId] = useState(records[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [brief, setBrief] = useState<SynthesisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const requestVersion = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const ranked = useMemo(() => rankEvidence(records, query), [query]);
  const support = assessQuerySupport(query, ranked);
  const active = ranked.find(r => r.experiment.id === activeId)?.experiment || ranked[0]?.experiment;
  const compared = selected.map(id => records.find(e => e.id === id)).filter((e): e is ExperimentRecord => Boolean(e));
  const activeSelected = selected.filter(id => ranked.some(result => result.experiment.id === id));

  function invalidate() {
    requestVersion.current += 1;
    controller.current?.abort();
    setBrief(null);
    setLoading(false);
  }
  function applyQuery(next: SearchQuery, text: string) {
    invalidate(); setQuery(next); setDraft(next); setQuestion(text); setSubmittedQuestion(text); setSelected([]); setPanel("evidence"); setNotice(""); setSection("research"); setFilterOpen(false);
  }
  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const next = parseQuestion(question);
    if ((next.oxygenPct != null && next.oxygenPct > 100) || (next.pressureKpa != null && next.pressureKpa <= 0)) {
      setNotice("Enter oxygen between 0 and 100% and a positive pressure."); return;
    }
    applyQuery(next, question);
  }
  function toggleCompare(id: string) {
    invalidate();
    setSelected(previous => {
      if (previous.includes(id)) return previous.filter(value => value !== id);
      if (previous.length >= 2) { setNotice("Remove a study before adding another to your comparison."); return previous; }
      setNotice(""); return [...previous, id];
    });
  }
  function applyFilters() {
    if ((draft.oxygenPct != null && (draft.oxygenPct < 0 || draft.oxygenPct > 100)) || (draft.pressureKpa != null && draft.pressureKpa <= 0) || (draft.airflowCmS != null && draft.airflowCmS < 0)) {
      setNotice("Enter oxygen between 0 and 100%, a positive pressure and non-negative airflow."); return;
    }
    applyQuery(draft, submittedQuestion);
  }
  async function generateBrief() {
    const ids = activeSelected.length ? activeSelected : active ? [active.id] : [];
    if (!ids.length || support.kind === "no_relevant_evidence") { setNotice("Select relevant reviewed evidence before creating a brief."); return; }
    invalidate();
    const id = ++requestVersion.current;
    const expectedKey = createInquiryKey(query, ids, CORPUS_VERSION);
    const abort = new AbortController(); controller.current = abort;
    setLoading(true); setNotice("");
    const timeout = setTimeout(() => abort.abort(), 10000);
    try {
      const response = await fetch("/api/interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, experimentIds: ids }), signal: abort.signal });
      if (!response.ok) throw new Error("Interpretation unavailable");
      const data: SynthesisResponse = await response.json();
      if (requestVersion.current === id && data.queryKey === expectedKey) setBrief(data);
    } catch {
      if (requestVersion.current === id) {
        const fallback = buildDeterministicSynthesis(query, rankEvidence(records.filter(e => ids.includes(e.id)), query));
        if (fallback.queryKey === expectedKey) setBrief(fallback);
      }
    } finally {
      clearTimeout(timeout);
      if (requestVersion.current === id) setLoading(false);
    }
  }
  function exportBrief() {
    if (!brief) return;
    const url = URL.createObjectURL(new Blob([briefMarkdown(submittedQuestion, brief)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "ignis-evidence-brief.md"; link.click(); URL.revokeObjectURL(url);
  }
  function copyBrief() {
    if (brief) void navigator.clipboard.writeText(briefMarkdown(submittedQuestion, brief)).then(() => setNotice("Brief copied to clipboard.")).catch(() => setNotice("Copy was unavailable. Use Download or Print instead."));
  }
  function exploreMaterial(label: string) {
    const material = label.includes("Polymer") ? "PMMA" : label.includes("Textile") ? "fabric" : label.includes("Insulation") ? "insulation" : label.includes("Liquid") ? "droplet" : label.includes("Gaseous") ? "gas" : label;
    applyQuery({ material }, `Explore indexed evidence for ${material}`);
    setNotice("Material selected. Coverage ranges were not applied as exact values.");
  }

  const tabs: { id: Section; label: string }[] = [{ id: "research", label: "Research" }, { id: "map", label: "Evidence Map" }, { id: "sources", label: "Sources & Methods" }];
  return <div className="workspace-shell">
    <header className="app-header"><div className="header-inner"><button className="brand" onClick={() => setSection("research")} aria-label="IGNIS research home"><span className="brand-mark"><Flame size={19}/></span><span>IGNIS<small>RESEARCH WORKSPACE</small></span></button>
      <nav className="main-nav" aria-label="Main navigation">{tabs.map(tab => <button key={tab.id} onClick={() => setSection(tab.id)} aria-current={section === tab.id ? "page" : undefined}>{tab.label}</button>)}</nav>
      <div className="header-actions"><span className="corpus-pill"><span className="live-dot"/>{records.length} reviewed studies</span><button className="header-compare" onClick={() => { setSection("research"); setPanel("compare"); }}>Compare ({selected.length}/2)</button></div>
    </div></header>
    {section === "map" ? <EvidenceMap onExplore={exploreMaterial}/> : section === "sources" ? <Sources/> :
    <main className="research-page">
      <section className="research-top">
        <div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> NASA microgravity research <span className="hero-divider">/</span> Evidence workspace</div>
          <h1>Find the evidence behind<br/><em>fire safety in space.</em></h1>
          <p>Explore NASA combustion investigations, compare their conditions and trace findings back to the source.</p>
          <form className="question-form" onSubmit={handleSearch}><Search size={20} aria-hidden="true"/><label className="sr-only" htmlFor="research-question">What would you like to investigate?</label><input id="research-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="What would you like to investigate?" maxLength={1000}/><button type="submit">Search evidence <ArrowRight size={16}/></button></form>
          <div className="scenario-row"><span>Try an example</span>{scenarios.map(s => <button key={s.id} onClick={() => applyQuery(s.query, s.question)}>{s.title} <ArrowRight size={13}/></button>)}</div>
        </div>
        <aside className="context-visual"><img src="/nasa/sofie-gel/gel-sequence-original.jpg" alt="NASA montage showing snapshots of the SoFIE-GEL experiment"/><div><span>NASA imagery</span><strong>Fire behaves differently in microgravity</strong><a href="https://svs.gsfc.nasa.gov/31394" target="_blank" rel="noopener noreferrer">SoFIE-GEL image source <ExternalLink size={13}/></a></div></aside>
      </section>
      <section className="query-strip"><div><span className="strip-label">Current inquiry</span><strong>{submittedQuestion || "Browse reviewed investigations"}</strong></div><div className="query-tags">{query.material && <span>Material: {query.material}</span>}{query.phenomenon && <span>Phenomenon: {query.phenomenon.replaceAll("_", " ")}</span>}{query.oxygenPct != null && <span>O₂: {query.oxygenPct}%</span>}{query.pressureKpa != null && <span>Pressure: {query.pressureKpa} kPa</span>}{query.airflowCmS != null && <span>Airflow: {query.airflowCmS} cm/s</span>}{!Object.values(query).some(v => v !== undefined && v !== null && v !== "") && <span>All reviewed studies</span>}</div><button className="filter-button" onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><SlidersHorizontal size={15}/> {filterOpen ? "Close filters" : "Edit conditions"} <ChevronDown size={14}/></button></section>
      {filterOpen && <div className="filter-panel"><label>Material<input value={draft.material || ""} onChange={e => setDraft({ ...draft, material: e.target.value || undefined })} placeholder="e.g. PMMA"/></label><label>Phenomenon<select value={draft.phenomenon || ""} onChange={e => setDraft({ ...draft, phenomenon: e.target.value || undefined })}><option value="">Any phenomenon</option><option value="flame_spread">Flame spread</option><option value="extinction">Extinction</option></select></label>{([["oxygenPct", "Oxygen (%)"], ["pressureKpa", "Pressure (kPa)"], ["airflowCmS", "Airflow (cm/s)"]] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min={0} step="any" value={draft[key] ?? ""} onChange={e => setDraft({ ...draft, [key]: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Any"/></label>)}<button className="primary-button" onClick={applyFilters}>Apply conditions</button></div>}
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15}/></button></div>}
      <div className="workbench"><section className="triage-panel" aria-labelledby="triage-title"><div className="panel-heading"><div><span className="eyebrow">01 / Discover</span><h2 id="triage-title">Research evidence</h2><p>{ranked.length} {ranked.length === 1 ? "investigation" : "investigations"} in this view</p></div><Status tone={support.kind === "no_relevant_evidence" ? "warning" : "neutral"}>{support.kind === "browse" ? "Browse" : support.kind === "reported_conditions_match" ? "Inputs match" : support.kind === "related_only" ? "Related" : "No match"}</Status></div>
        <p className="support-note" role="status">{support.reason}</p>
        <div className="evidence-stack">{ranked.length ? ranked.map(item => <EvidenceItem key={item.experiment.id} item={item} selected={active?.id === item.experiment.id} compared={selected.includes(item.experiment.id)} onInspect={() => { setActiveId(item.experiment.id); setPanel("evidence"); }} onCompare={() => toggleCompare(item.experiment.id)}/>) : <div className="empty-search"><Search size={22}/><h3>No applicable evidence</h3><p>Try another material or remove a condition. This index is not a complete inventory of NASA research.</p><button className="quiet-button" onClick={() => applyQuery({}, "")}>Clear inquiry</button></div>}</div>
      </section>
      <section className="detail-panel"><div className="detail-tabs" role="tablist" aria-label="Research workspace panels">{([{ id: "evidence", label: "Evidence" }, { id: "compare", label: `Compare (${selected.length}/2)` }, { id: "brief", label: "Research brief" }] as { id: Panel; label: string }[]).map(tab => <button key={tab.id} role="tab" aria-selected={panel === tab.id} onClick={() => setPanel(tab.id)}>{tab.label}</button>)}</div>
        {panel === "evidence" ? active ? <Inspector experiment={active}/> : <div className="empty-panel"><h2>Choose an investigation</h2><p>Search or browse the reviewed evidence to inspect its source.</p></div> : panel === "compare" ? <Comparison selected={compared} onRemove={toggleCompare}/> : <Brief brief={brief} loading={loading} onGenerate={generateBrief} onExport={exportBrief} onCopy={copyBrief}/>}
      </section></div>
      <footer className="workspace-footer"><span>IGNIS · Research evidence, clearly traced</span><span>Microgravity results do not predict partial-gravity behavior.</span></footer>
    </main>}
  </div>;
}

