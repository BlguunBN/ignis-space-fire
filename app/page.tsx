"use client";

import { sourceReviewedRecords } from "@/lib/sourceReviewedRecords";

import React, { useState, useMemo } from "react";
import sourcesData from "@/data/sources.json";
import experimentsData from "@/data/experiments.json";
import visualizationsData from "@/data/visualizations.json";
import { ExperimentRecord, SearchQuery, RankedEvidence } from "@/types/evidence";
import { VisualExperimentPackage } from "@/types/visualization";
import { rankEvidence } from "@/lib/ranking";
import { SynthesisResponse } from "@/lib/synthesis";
import { EvidenceCard } from "@/components/EvidenceCard";
import { CompareModal } from "@/components/CompareModal";
import { GapMatrix } from "@/components/GapMatrix";
import { MethodologyModal } from "@/components/MethodologyModal";
import { InterpretationPanel } from "@/components/InterpretationPanel";
import { FlameDynamicsChart } from "@/components/FlameDynamicsChart";
import { MasterComparisonTable } from "@/components/MasterComparisonTable";
import { PaperVisualStoryboard } from "@/components/papers/PaperVisualStoryboard";
import { ResearchPapersList } from "@/components/papers/ResearchPapersList";
import { MissionLab } from "@/components/mission/MissionLab";
import { SimulationLab } from "@/components/simulation/SimulationLab";
import { VisualComparison } from "@/components/experiment/VisualComparison";
import { AppSidebar, NavTab } from "@/components/layout/AppSidebar";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ShieldAlert,
  FileQuestion,
  Tv,
} from "lucide-react";

export default function Home() {
  const allExperiments = sourceReviewedRecords(experimentsData as ExperimentRecord[]);
  const visualPackages = visualizationsData as VisualExperimentPackage[];

  // Navigation State (defaults to flagship studio view)
  const [activeTab, setActiveTab] = useState<NavTab>("studio");

  // Selected Experiment for Visual Studio
  const [selectedStudioExpId, setSelectedStudioExpId] = useState<string>("sofie-gel");

  // Query State for Explorer
  const [material, setMaterial] = useState("");
  const [oxygenPct, setOxygenPct] = useState<number | null>(null);
  const [airflowCmS, setAirflowCmS] = useState<number | null>(null);
  const [phenomenon, setPhenomenon] = useState("");
  const [programme, setProgramme] = useState("ALL");
  const [freeText, setFreeText] = useState("");

  // Compare Basket State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(["sofie-gel", "saffire-1"]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Interpretation State
  const [synthesis, setSynthesis] = useState<SynthesisResponse | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  // Build current query
  const query: SearchQuery = useMemo(
    () => ({
      material: material || undefined,
      oxygenPct: oxygenPct,
      airflowCmS: airflowCmS,
      phenomenon: phenomenon || undefined,
      programme: programme !== "ALL" ? programme : undefined,
      freeText: freeText || undefined,
    }),
    [material, oxygenPct, airflowCmS, phenomenon, programme, freeText]
  );

  // Compute Ranked Evidence with Fuse.js fuzzy text boost
  const rankedResults = useMemo(() => {
    let dataset = allExperiments;
    if (programme !== "ALL") {
      dataset = dataset.filter((e) => e.programme.toUpperCase() === programme.toUpperCase());
    }
    return rankEvidence(dataset, query);
  }, [allExperiments, programme, query]);

  // Selected package and record for Studio
  const activeStudioExp = useMemo(
    () => allExperiments.find((e) => e.id === selectedStudioExpId) || allExperiments[0],
    [allExperiments, selectedStudioExpId]
  );

  const activeVisualPackage = useMemo(
    () => visualPackages.find((v) => v.experimentId === activeStudioExp.id)  ,
    [visualPackages, activeStudioExp]
  );

  // Handle Preset Scenarios
  const applyPreset = (preset: string) => {
    setSynthesis(null);
    if (preset === "pmma") {
      setFreeText("PMMA acrylic solid polymer flame spread under low airflow");
      setMaterial("PMMA");
      setOxygenPct(21);
      setAirflowCmS(3.5);
      setPhenomenon("flame_spread");
      setProgramme("ALL");
    } else if (preset === "saffire-fabric") {
      setFreeText("Saffire large-scale solid fabric flame spread in vehicle ventilation flow");
      setMaterial("cotton-fiberglass");
      setOxygenPct(21);
      setAirflowCmS(20);
      setPhenomenon("flame_spread");
      setProgramme("Saffire");
    } else if (preset === "smoke-detection") {
      setFreeText("SAME-R microgravity smoke particle size and spacecraft fire detection");
      setMaterial("Kapton / insulation");
      setOxygenPct(21);
      setAirflowCmS(2);
      setPhenomenon("smoke");
      setProgramme("ALL");
    } else if (preset === "cool-flame") {
      setFreeText("FLEX droplet low-temperature cool flames and CO2 gaseous suppression");
      setMaterial("droplet");
      setOxygenPct(18);
      setAirflowCmS(0);
      setPhenomenon("extinction");
      setProgramme("FLEX");
    } else if (preset === "exploration-atm") {
      setFreeText("Exploration atmosphere flammability elevated O2 at 26-34% reduced pressure");
      setMaterial("PMMA");
      setOxygenPct(26);
      setAirflowCmS(20);
      setPhenomenon("flammability");
      setProgramme("ALL");
    }
    setActiveTab("explore");
  };

  const resetFilters = () => {
    setMaterial("");
    setOxygenPct(null);
    setAirflowCmS(null);
    setPhenomenon("");
    setProgramme("ALL");
    setFreeText("");
    setSynthesis(null);
  };

  // Compare selection toggle
  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  // Secure Server Interpretation: Sends Query and IDs, Server loads trusted JSON
  const handleGenerateInterpretation = async () => {
    setSynthesisLoading(true);
    try {
      const top3Ids = rankedResults.slice(0, 3).map((r) => r.experiment.id);
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, experimentIds: top3Ids }),
      });

      if (res.ok) {
        const data = await res.json();
        setSynthesis(data);
      } else {
        const { generateGroundedInterpretation } = await import("@/lib/synthesis");
        const fallback = await generateGroundedInterpretation(query, rankedResults.slice(0, 3));
        setSynthesis(fallback);
      }
    } catch (e) {
      console.warn("Client fallback for interpretation:", e);
      const { generateGroundedInterpretation } = await import("@/lib/synthesis");
      const fallback = await generateGroundedInterpretation(query, rankedResults.slice(0, 3));
      setSynthesis(fallback);
    } finally {
      setSynthesisLoading(false);
    }
  };

  const compareExp1 = allExperiments.find((e) => e.id === selectedForCompare[0]) || allExperiments[0];
  const compareExp2 = allExperiments.find((e) => e.id === selectedForCompare[1]) || allExperiments[1];

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F3F2EF] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedCompareCount={selectedForCompare.length}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-[#303134] bg-[#111214] px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm text-[#9EA2A7]">Microgravity combustion <span className="text-[#F3F2EF]">/ Research explorer</span></span>
          <label className="flex items-center gap-2 bg-[#191A1D] border border-[#303134] rounded-lg px-3 py-2 w-full sm:w-80"><Search className="w-4 h-4 text-[#9EA2A7]"/><input aria-label="Search research library" value={freeText} onChange={e => { setFreeText(e.target.value); setActiveTab("explore"); }} placeholder="Search experiments, materials, or phenomena" className="bg-transparent w-full text-xs outline-none placeholder:text-[#9EA2A7]" /></label>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] w-full mx-auto">
          {activeTab === "overview" && <div className="space-y-5"><div><p className="text-xs uppercase tracking-widest text-[#DDA36B]">NASA microgravity research</p><h1 className="text-3xl mt-2 font-semibold">Explore the science of fire in space.</h1><p className="text-sm text-[#9EA2A7] mt-2">Inspect investigations, source imagery, and the evidence behind the findings.</p></div><div className="studio-panel p-6"><h2 className="text-lg font-semibold">Experiment Studio & Simulation Lab</h2><p className="text-sm text-[#9EA2A7] mt-2">Start with {activeStudioExp.investigation}, launch the interactive simulation engine, or explore the research library.</p><div className="flex flex-wrap gap-3 mt-5"><button className="studio-link" onClick={() => setActiveTab("studio")}>Open Studio →</button><button className="studio-link" onClick={() => setActiveTab("sim_lab")}>Simulation Lab →</button><button className="studio-link" onClick={() => setActiveTab("explore")}>Research Library →</button></div></div><div className="studio-panel p-5 text-sm text-[#9EA2A7]">Evidence is drawn from the indexed dataset. Microgravity findings do not predict lunar or Martian fire behavior without validated models.</div></div>}
          {activeTab === "studio" && <div className="space-y-5"><div className="flex flex-wrap justify-between items-end gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">Experiment Studio</h1><p className="text-sm text-[#9EA2A7] mt-1">Explore NASA combustion experiments and their sources.</p></div><label className="text-xs text-[#9EA2A7]">Investigation <select aria-label="Select investigation" value={selectedStudioExpId} onChange={e => setSelectedStudioExpId(e.target.value)} className="ml-2 bg-[#191A1D] border border-[#303134] text-[#F3F2EF] rounded-lg px-3 py-2 max-w-[250px]">{allExperiments.map(e => <option key={e.id} value={e.id}>{e.investigation}</option>)}</select></label></div><PaperVisualStoryboard key={activeStudioExp.id} pkg={activeVisualPackage} experiment={activeStudioExp} onCompare={() => { setSelectedForCompare([activeStudioExp.id, allExperiments.find(e => e.id !== activeStudioExp.id)!.id]); setActiveTab("compare_lab"); }} /></div>}
          {activeTab === "sim_lab" && <SimulationLab />}
          {activeTab === "mission" && <MissionLab />}
          {activeTab === "compare_lab" && <div className="space-y-4"><h1 className="text-3xl font-semibold">Compare Lab</h1><div className="grid sm:grid-cols-2 gap-4">{[0,1].map(i => <label key={i} className="text-xs text-[#9EA2A7]">Investigation {i+1}<select value={selectedForCompare[i] || ""} onChange={e => setSelectedForCompare(prev => { const next = [...prev]; next[i] = e.target.value; return next; })} className="block w-full mt-2 bg-[#191A1D] text-[#F3F2EF] border border-[#303134] rounded-lg p-2">{allExperiments.map(exp => <option key={exp.id} value={exp.id}>{exp.investigation}</option>)}</select></label>)}</div><VisualComparison exp1={compareExp1} exp2={compareExp2} visualPkg1={visualPackages.find(p => p.experimentId === compareExp1.id)} visualPkg2={visualPackages.find(p => p.experimentId === compareExp2.id)} /></div>}
          {/* VIEW: Empirical Flame Spread Measurements */}
          {activeTab === "chart" && <FlameDynamicsChart />}

          {/* VIEW: Master Comparison Table */}
          {activeTab === "table" && (
            <MasterComparisonTable
              data={allExperiments}
              selectedForCompare={selectedForCompare}
              onToggleCompare={toggleCompare}
            />
          )}

          {/* VIEW: Coverage Matrix */}
          {activeTab === "coverage" && <GapMatrix experiments={allExperiments} />}

          {activeTab === "methodology" && <div className="space-y-6"><div><h1 className="text-3xl font-semibold">Sources & Methodology</h1><p className="text-sm text-[#9EA2A7] mt-1">Verified sources and peer-reviewed scientific literature indexed by IGNIS. Every finding is traceable to its primary NASA publication, technical report, or PSI dataset.</p></div><div className="grid md:grid-cols-3 gap-4">{sourcesData.map(source => <section key={source.url} className="studio-panel p-5"><h2 className="font-semibold">{source.name}</h2><p className="text-xs leading-5 text-[#9EA2A7] mt-3">{source.description}</p><a href={source.url} target="_blank" rel="noreferrer" className="studio-link mt-4">Open source ↗</a></section>)}</div><ResearchPapersList /><div className="studio-panel p-5 text-sm text-[#9EA2A7]">Indexed coverage is not a complete inventory of NASA research. Findings from microgravity cannot be quantitatively extrapolated to partial gravity without validated evidence.<div><button className="studio-link mt-4" onClick={() => setIsMethodologyOpen(true)}>Read methodology</button></div></div></div>}
          {/* VIEW: Evidence Explorer */}
          {activeTab === "explore" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Filter Panel (4 cols) */}
              <div className="lg:col-span-4 bg-[#191A1D] border border-[#303134] rounded-xl p-4 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#303134] pb-2.5">
                  <h3 className="font-bold text-[#F3F2EF] flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#DDA36B]" />
                    Inquiry Filters & Controls
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-[#9EA2A7] hover:text-[#F3F2EF] flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div><span className="text-[#9EA2A7]">Example inquiries</span><div className="flex flex-wrap gap-2 mt-2">{[["pmma","PMMA"],["saffire-fabric","Saffire"],["smoke-detection","Smoke"],["cool-flame","Cool flames"],["exploration-atm","Exploration atmosphere"]].map(([id,label]) => <button key={id} onClick={() => applyPreset(id)} className="studio-link">{label}</button>)}</div></div>
                {/* Fuse.js Search */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1 font-mono">
                    Fuzzy Literature Query (Fuse.js)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="e.g. acrylic, soot particle, quiescent"
                      className="w-full bg-[#0B0C0E] border border-[#303134] rounded-lg px-3 py-1.5 text-xs text-[#F3F2EF] placeholder-[#737F8C] focus:outline-none focus:border-[#DDA36B] transition pl-8"
                    />
                    <Search className="w-3.5 h-3.5 text-[#737F8C] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Material Select */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1 font-mono">
                    Material / Fuel Class
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#0B0C0E] border border-[#303134] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F2EF] focus:outline-none focus:border-[#DDA36B] transition"
                  >
                    <option value="">All Materials</option>
                    <option value="PMMA">PMMA / Acrylic Polymer</option>
                    <option value="cotton-fiberglass">Cotton-Fiberglass (SIBAL)</option>
                    <option value="Nomex">Nomex / Flame Resistant Fabric</option>
                    <option value="wire">Overheated Wire Insulation (PTFE/Kapton)</option>
                    <option value="droplet">Liquid Fuel Droplets (Heptane/Methanol)</option>
                    <option value="gas">Gaseous Fuel (Ethylene/Methane)</option>
                  </select>
                </div>

                {/* Oxygen Level */}
                <div>
                  <div className="flex justify-between text-[10px] text-[#737F8C] mb-1">
                    <span className="uppercase tracking-wider font-semibold font-mono">Oxygen Concentration</span>
                    <span className="font-mono text-[#78A9D8]">
                      {oxygenPct ? `${oxygenPct}%` : "Any"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[null, 18, 21, 26, 34].map((pct, i) => (
                      <button
                        key={i}
                        onClick={() => setOxygenPct(pct)}
                        className={`flex-1 py-1 text-[11px] rounded border transition cursor-pointer ${
                          oxygenPct === pct
                            ? "bg-[#DDA36B] text-[#0B0C0E] border-[#DDA36B] font-bold"
                            : "bg-[#0B0C0E] text-[#9EA2A7] border-[#303134] hover:bg-[#111214]"
                        }`}
                      >
                        {pct ? `${pct}%` : "All"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Airflow Velocity */}
                <div>
                  <div className="flex justify-between text-[10px] text-[#737F8C] mb-1">
                    <span className="uppercase tracking-wider font-semibold font-mono">Ventilation Velocity</span>
                    <span className="font-mono text-[#78A9D8]">
                      {airflowCmS !== null ? `${airflowCmS} cm/s` : "Any"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      { label: "All", val: null },
                      { label: "0 cm/s", val: 0 },
                      { label: "2-5", val: 3.5 },
                      { label: "15-20", val: 20 },
                    ].map((flow, i) => (
                      <button
                        key={i}
                        onClick={() => setAirflowCmS(flow.val)}
                        className={`flex-1 py-1 text-[11px] rounded border transition cursor-pointer ${
                          airflowCmS === flow.val
                            ? "bg-[#DDA36B] text-[#0B0C0E] border-[#DDA36B] font-bold"
                            : "bg-[#0B0C0E] text-[#9EA2A7] border-[#303134] hover:bg-[#111214]"
                        }`}
                      >
                        {flow.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phenomenon Select */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1 font-mono">
                    Target Measurement / Phenomenon
                  </label>
                  <select
                    value={phenomenon}
                    onChange={(e) => setPhenomenon(e.target.value)}
                    className="w-full bg-[#0B0C0E] border border-[#303134] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F2EF] focus:outline-none focus:border-[#DDA36B] transition"
                  >
                    <option value="">All Phenomena</option>
                    <option value="flame_spread">Flame Spread Velocity</option>
                    <option value="extinction">Extinction & Quenching Limits</option>
                    <option value="smoke">Smoke & Aerosol Generation</option>
                    <option value="cool_flame">Cool Flame Behavior</option>
                    <option value="radiation">Radiation & Soot Emission</option>
                  </select>
                </div>

                {/* Programme Select */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1 font-mono">
                    NASA Flight Programme
                  </label>
                  <select
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full bg-[#0B0C0E] border border-[#303134] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F2EF] focus:outline-none focus:border-[#DDA36B] transition"
                  >
                    <option value="ALL">All Flight Programmes</option>
                    <option value="Saffire">Saffire (Cygnus Vehicle)</option>
                    <option value="BASS">BASS / BASS-II (ISS Glovebox)</option>
                    <option value="FLEX">FLEX (Droplet CIR)</option>
                    <option value="SAME">SAME-R (Smoke Aerosol)</option>
                    <option value="SPICE">SPICE (Laminar Burner)</option>
                    <option value="SoFIE">SoFIE (Exploration Atmosphere)</option>
                  </select>
                </div>

                {/* Filter count */}
                <div className="pt-2.5 border-t border-[#303134] text-[11px] text-[#9EA2A7] flex items-center justify-between">
                  <span>Candidate Studies:</span>
                  <span className="font-bold text-[#F3F2EF] font-mono">
                    {rankedResults.length} records
                  </span>
                </div>
              </div>

              {/* Right Results Column (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Interpretation Panel */}
                <details className="studio-panel p-4"><summary className="cursor-pointer text-sm">Optional AI interpretation</summary><div className="mt-4"><InterpretationPanel
                  synthesis={synthesis}
                  loading={synthesisLoading}
                  onGenerate={handleGenerateInterpretation}
                /></div></details>

                {/* Evidence Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#9EA2A7]">
                    <span className="uppercase tracking-wider font-bold text-[10px] text-[#737F8C] font-mono">
                      Ranked NASA Microgravity Investigations
                    </span>
                    <span className="text-[11px]">Sorted by Heuristic Relevance Score</span>
                  </div>

                  {rankedResults.length === 0 ? (
                    <div className="bg-[#191A1D] border border-[#303134] rounded-xl p-8 text-center text-[#9EA2A7]">
                      <FileQuestion className="w-8 h-8 mx-auto text-[#737F8C] mb-2" />
                      No NASA investigations match the selected filters.
                    </div>
                  ) : (
                    rankedResults.map((evidence, idx) => (
                      <EvidenceCard
                        key={evidence.experiment.id}
                        evidence={evidence}
                        rank={idx + 1}
                        isSelectedForCompare={selectedForCompare.includes(evidence.experiment.id)}
                        onToggleCompare={toggleCompare}
                        onOpenStudio={(id) => { setSelectedStudioExpId(id); setActiveTab("studio"); }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {isMethodologyOpen && <MethodologyModal onClose={() => setIsMethodologyOpen(false)} />}
      {/* Compare Modal */}
      {isCompareOpen && (
        <CompareModal exp1={compareExp1} exp2={compareExp2} onClose={() => setIsCompareOpen(false)} />
      )}
    </div>
  );
}
