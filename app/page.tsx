"use client";

import { useMemo, useState } from "react";
import experimentsData from "@/data/experiments.json";
import type { ExperimentRecord, SearchQuery } from "@/types/evidence";
import type { SynthesisResponse } from "@/lib/synthesis";
import { rankEvidence } from "@/lib/ranking";
import { AppSidebar, type NavTab } from "@/components/layout/AppSidebar";
import { ExperimentStage } from "@/components/experiment/ExperimentStage";
import { FlameDynamicsChart } from "@/components/FlameDynamicsChart";
import { CompareModal } from "@/components/CompareModal";
import { GapMatrix } from "@/components/GapMatrix";
import { MasterComparisonTable } from "@/components/MasterComparisonTable";
import { InterpretationPanel } from "@/components/InterpretationPanel";
import {
  ArrowRight, ArrowUpRight, BookOpen, ChevronDown, ChevronRight,
  FileText, FlaskConical, Info, RotateCcw, Search, SlidersHorizontal,
  Sparkles, X
} from "lucide-react";

const experiments = experimentsData as ExperimentRecord[];

const titles: Record<NavTab, string> = {
  explore: "Research overview",
  studio: "Experiment studio",
  table: "Compare evidence",
  coverage: "Evidence coverage",
  methodology: "Sources & methodology"
};

function evidenceStatus(record: ExperimentRecord) {
  return record.verification_status === "verified" ? "Marked verified" : "Needs review";
}

function shortValue(value: number | null | undefined, suffix: string) {
  return value === null || value === undefined ? "—" : String(value) + suffix;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("explore");
  const [material, setMaterial] = useState("");
  const [oxygenPct, setOxygenPct] = useState<number | null>(null);
  const [airflowCmS, setAirflowCmS] = useState<number | null>(null);
  const [phenomenon, setPhenomenon] = useState("");
  const [programme, setProgramme] = useState("ALL");
  const [freeText, setFreeText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(experiments[0]?.id || "");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [synthesis, setSynthesis] = useState<SynthesisResponse | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  const query: SearchQuery = useMemo(() => ({
    material: material || undefined,
    oxygenPct,
    airflowCmS,
    phenomenon: phenomenon || undefined,
    programme: programme !== "ALL" ? programme : undefined,
    freeText: freeText || undefined
  }), [material, oxygenPct, airflowCmS, phenomenon, programme, freeText]);

  const rankedResults = useMemo(() => rankEvidence(
    programme === "ALL" ? experiments : experiments.filter(e => e.programme.toLowerCase() === programme.toLowerCase()),
    query
  ), [programme, query]);

  const displayedExperiment = experiments.find(e => e.id === selectedId) || rankedResults[0]?.experiment || experiments[0];
  const selectedIndex = experiments.findIndex(e => e.id === displayedExperiment?.id);

  function clearFilters() {
    setFreeText(""); setMaterial(""); setOxygenPct(null); setAirflowCmS(null);
    setPhenomenon(""); setProgramme("ALL"); setSynthesis(null);
  }

  function selectPreset(value: string) {
    clearFilters();
    if (value === "PMMA") { setMaterial("PMMA"); setFreeText("flame spread"); }
    else if (value === "Saffire") { setProgramme("Saffire"); }
    else if (value === "FLEX") { setProgramme("FLEX"); }
    else if (value === "smoke") { setPhenomenon("smoke"); }
    setActiveTab("explore");
  }

  function toggleCompare(id: string) {
    setSelectedForCompare(previous => previous.includes(id)
      ? previous.filter(v => v !== id)
      : previous.length >= 2 ? [previous[1], id] : [...previous, id]);
  }

  async function interpret() {
    setSynthesisLoading(true);
    setShowInterpretation(true);
    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, experimentIds: rankedResults.slice(0, 3).map(v => v.experiment.id) })
      });
      if (!response.ok) throw new Error("Interpretation is currently unavailable");
      setSynthesis(await response.json());
    } catch {
      const { generateGroundedInterpretation } = await import("@/lib/synthesis");
      setSynthesis(await generateGroundedInterpretation(query, rankedResults.slice(0, 3)));
    } finally {
      setSynthesisLoading(false);
    }
  }

  function changeExperiment(delta: number) {
    if (!experiments.length) return;
    const newIndex = (Math.max(selectedIndex, 0) + delta + experiments.length) % experiments.length;
    setSelectedId(experiments[newIndex].id);
  }

  const firstCompare = experiments.find(e => e.id === selectedForCompare[0]);
  const secondCompare = experiments.find(e => e.id === selectedForCompare[1]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0b0d] text-[#f2f1ed] lg:flex-row">
      <AppSidebar activeTab={activeTab} onSelectTab={setActiveTab}
        selectedCompareCount={selectedForCompare.length} onOpenCompare={() => setIsCompareOpen(true)}/>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d0e10]/95 px-5 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2 text-[11px] text-[#86898c]">
            <span>IGNIS</span><ChevronRight className="h-3 w-3"/><span className="text-[#e8e7e4]">{titles[activeTab]}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noopener noreferrer"
              className="hidden items-center gap-1.5 text-xs text-[#a0a2a2] transition hover:text-white sm:flex">
              NASA PSI <ArrowUpRight className="h-3.5 w-3.5"/>
            </a>
            <span className="h-3 w-px bg-white/10"/>
            <span className="rounded-md border border-[#3d3d3c] bg-[#1a1b1d] px-2.5 py-1.5 text-[10px] tracking-wide text-[#b8b8b5]">Research prototype</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1540px] space-y-6 px-4 pb-14 pt-7 sm:px-7 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ignis-kicker">NASA / MICROGRAVITY COMBUSTION</p>
              <h1 className="ignis-serif mt-2 text-[32px] leading-tight text-[#f5f1ec] sm:text-[39px]">
                {activeTab === "explore" ? "Explore the evidence." : activeTab === "studio" ? "See the experiment." : titles[activeTab] + "."}
              </h1>
              <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-[#919396]">
                {activeTab === "explore" ? "Investigations, conditions, and source-backed findings — without the noise." :
                activeTab === "studio" ? "A visual workspace for exploring documented combustion research. Schematics are illustrative." :
                activeTab === "table" ? "Inspect experiment records alongside their reported test conditions." :
                activeTab === "coverage" ? "What the current indexed dataset covers — and what it does not." :
                "How IGNIS handles evidence, relevance, interpretation, and uncertainty."}
              </p>
            </div>
            {(activeTab === "explore" || activeTab === "studio") &&
              <button type="button" onClick={() => setShowInterpretation(v => !v)} className="ignis-button inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#e2ad73]"/> {showInterpretation ? "Hide interpretation" : "Interpret evidence"}
              </button>}
          </div>

          {(activeTab === "explore" || activeTab === "studio") && (
            <>
              {activeTab === "explore" && <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#878a8e]"/>
                    <input type="search" aria-label="Search NASA evidence" value={freeText} onChange={e => setFreeText(e.target.value)}
                      placeholder="Search material, experiment, or research topic..."
                      className="ignis-field !h-12 !rounded-lg !pl-11 !text-[13px]"/>
                  </div>
                  <button type="button" onClick={() => setFiltersOpen(v => !v)} aria-expanded={filtersOpen}
                    className={"ignis-button flex h-12 items-center justify-center gap-2 " + (filtersOpen ? "!border-[#8f7658] text-white" : "")}>
                    <SlidersHorizontal className="h-4 w-4"/> Filters <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (filtersOpen ? "rotate-180" : "")}/>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] text-[#777a7d]">Explore:</span>
                  {[
                    { label: "All research", value: "all" },
                    { label: "PMMA", value: "PMMA" },
                    { label: "Saffire", value: "Saffire" },
                    { label: "Droplet combustion", value: "FLEX" },
                    { label: "Smoke", value: "smoke" }
                  ].map(item => (
                    <button key={item.value} onClick={() => selectPreset(item.value)}
                      className="rounded-md border border-[#313234] bg-[#141517] px-3 py-1.5 text-[11px] text-[#acaeae] transition-colors hover:border-[#616365] hover:text-white">
                      {item.label}
                    </button>
                  ))}
                  {(material || oxygenPct !== null || airflowCmS !== null || phenomenon || programme !== "ALL" || freeText) &&
                    <button type="button" onClick={clearFilters} className="ml-1 inline-flex items-center gap-1 text-[11px] text-[#c6a37e] hover:text-white">
                      <RotateCcw className="h-3 w-3"/> Clear
                    </button>}
                </div>
                {filtersOpen && <div className="ignis-panel-soft grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="text-[11px] text-[#989a9a]">Material
                    <select className="ignis-field mt-1.5" value={material} onChange={e => setMaterial(e.target.value)}>
                      <option value="">Any material</option>
                      <option value="PMMA">PMMA / Acrylic</option>
                      <option value="cotton-fiberglass">Cotton–fiberglass</option>
                      <option value="Nomex">Nomex</option>
                      <option value="wire">Wire insulation</option>
                      <option value="droplet">Liquid droplets</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-[#989a9a]">Investigation
                    <select className="ignis-field mt-1.5" value={programme} onChange={e => setProgramme(e.target.value)}>
                      <option value="ALL">All programmes</option>
                      {Array.from(new Set(experiments.map(e => e.programme))).map(name=><option key={name} value={name}>{name}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] text-[#989a9a]">Oxygen concentration
                    <select className="ignis-field mt-1.5" value={oxygenPct ?? ""} onChange={e => setOxygenPct(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any / Not specified</option>
                      {[18,21,26,34].map(n=><option key={n} value={n}>{n}%</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] text-[#989a9a]">Airflow
                    <select className="ignis-field mt-1.5" value={airflowCmS ?? ""} onChange={e => setAirflowCmS(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Any / Not specified</option>
                      <option value="0">Quiescent (0 cm/s)</option>
                      <option value="3.5">Low (approx. 3.5 cm/s)</option>
                      <option value="20">Forced (approx. 20 cm/s)</option>
                    </select>
                  </label>
                </div>}
              </section>}

              {displayedExperiment && <ExperimentStage experiment={displayedExperiment}
                onPrevious={() => changeExperiment(-1)} onNext={() => changeExperiment(1)}
                onCompare={() => toggleCompare(displayedExperiment.id)}
                selectedForCompare={selectedForCompare.includes(displayedExperiment.id)}/>}

              {showInterpretation && <InterpretationPanel synthesis={synthesis} loading={synthesisLoading} onGenerate={interpret}/>}

              {activeTab === "explore" && <FlameDynamicsChart />}

              <section className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="ignis-kicker">EVIDENCE LIBRARY</p>
                    <h2 className="mt-1 text-[17px] font-medium">Related investigations</h2>
                  </div>
                  <span className="text-[11px] text-[#989a9c]">{rankedResults.length} indexed results · relevance ranking</span>
                </div>
                {rankedResults.length === 0 ?
                  <div className="ignis-panel p-8 text-center text-sm text-[#a5a7a8]">No evidence records matched these filters. Try another material or reset filters.</div> :
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {rankedResults.slice(0,activeTab==="studio" ? 6 : 8).map(({ experiment, score, breakdown }, index) => (
                      <article key={experiment.id} className={"group min-w-0 overflow-hidden rounded-xl border bg-[#151618] p-4 transition-colors hover:border-[#626263] " +
                        (displayedExperiment?.id===experiment.id ? "border-[#96744f]" : "border-[#2c2d30]")}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-[#c8a27c]">{experiment.programme}</span>
                          <span className="text-[10px] text-[#95989a]">Relevance {score}/100</span>
                        </div>
                        <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-[#eeece9]">{experiment.investigation}</h3>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#a2a4a4]">
                          <span className="rounded border border-white/10 px-2 py-1">{experiment.material}</span>
                          <span className="rounded border border-white/10 px-2 py-1">{shortValue(experiment.oxygen_pct,"%")} O₂</span>
                          <span className="rounded border border-white/10 px-2 py-1">{shortValue(experiment.airflow_cm_s," cm/s")} flow</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                          <button type="button" onClick={() => {setSelectedId(experiment.id);setActiveTab("studio");window.scrollTo({top:0,behavior:"smooth"});}}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#e5bd8f] hover:text-[#fbe2c0]">
                            Open experiment <ArrowRight className="h-3.5 w-3.5"/>
                          </button>
                          <div className="flex gap-2">
                            <a aria-label={"Open source for " + experiment.investigation} href={experiment.source_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-[#999a9d] hover:bg-white/10 hover:text-white"><ArrowUpRight className="h-4 w-4"/></a>
                            <button type="button" onClick={() => toggleCompare(experiment.id)} aria-label={selectedForCompare.includes(experiment.id) ? "Remove from comparison" : "Add to comparison"}
                              className={"rounded-md px-2 py-1 text-[10px] " + (selectedForCompare.includes(experiment.id) ? "bg-[#53402e] text-[#f3d2ab]" : "bg-[#222426] text-[#aeb0b0] hover:text-white")}>
                              {selectedForCompare.includes(experiment.id) ? "Selected" : "Compare"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>}
              </section>
            </>
          )}

          {activeTab === "table" && <MasterComparisonTable data={experiments} selectedForCompare={selectedForCompare} onToggleCompare={toggleCompare}/>}
          {activeTab === "coverage" && <GapMatrix experiments={experiments}/>}
          {activeTab === "methodology" && <section className="grid gap-5 lg:grid-cols-2">
            <article className="ignis-panel space-y-3 p-6">
              <BookOpen className="h-5 w-5 text-[#e2ad73]"/>
              <h2 className="text-xl font-medium">What IGNIS measures</h2>
              <p className="text-sm leading-7 text-[#a6a7a8]">The ranking score reflects how well an indexed research record matches your question. It is not a flammability score, a predicted fire risk, or a certification.</p>
              <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#e2ad73]">Explore NASA PSI <ArrowUpRight className="h-3 w-3"/></a>
            </article>
            <article className="ignis-panel space-y-3 p-6">
              <Info className="h-5 w-5 text-[#e2ad73]"/>
              <h2 className="text-xl font-medium">Scientific boundaries</h2>
              <p className="text-sm leading-7 text-[#a6a7a8]">Measurements and conditions are attributed to individual sources. Missing fields are not estimated. Microgravity results do not automatically predict fire behavior on the Moon, Mars, or in other environments.</p>
              <a href="https://ntrs.nasa.gov/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#e2ad73]">NASA technical reports <ArrowUpRight className="h-3 w-3"/></a>
            </article>
            <article className="ignis-panel space-y-3 p-6 lg:col-span-2">
              <span className="ignis-kicker">REPRODUCIBILITY</span>
              <h2 className="text-lg font-medium">Sources, limitations and transparent relevance</h2>
              <p className="text-sm leading-7 text-[#a6a7a8]">Open the linked NASA source from any evidence record. Research findings should only be presented as verified when their exact page, figure, or data file has been checked. The current experimental geometry drawings are educational schematics, not experimental footage.</p>
            </article>
          </section>}
        </main>
      </div>
      {isCompareOpen && firstCompare && secondCompare &&
        <CompareModal exp1={firstCompare} exp2={secondCompare} onClose={() => setIsCompareOpen(false)}/>}
    </div>
  );
}
