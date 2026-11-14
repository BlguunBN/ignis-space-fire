"use client";

import React, { useState, useMemo } from "react";
import experimentsData from "@/data/experiments.json";
import { ExperimentRecord, SearchQuery, RankedEvidence } from "@/types/evidence";
import { rankEvidence } from "@/lib/ranking";
import { SynthesisResponse } from "@/lib/synthesis";
import { EvidenceCard } from "@/components/EvidenceCard";
import { CompareModal } from "@/components/CompareModal";
import { GapMatrix } from "@/components/GapMatrix";
import { MethodologyModal } from "@/components/MethodologyModal";
import { InterpretationPanel } from "@/components/InterpretationPanel";
import { FlameDynamicsChart } from "@/components/FlameDynamicsChart";
import { MasterComparisonTable } from "@/components/MasterComparisonTable";
import { AppSidebar, NavTab } from "@/components/layout/AppSidebar";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ShieldAlert,
  FileQuestion,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const allExperiments = experimentsData as ExperimentRecord[];

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("explore");

  // Query State
  const [material, setMaterial] = useState("");
  const [oxygenPct, setOxygenPct] = useState<number | null>(null);
  const [airflowCmS, setAirflowCmS] = useState<number | null>(null);
  const [phenomenon, setPhenomenon] = useState("");
  const [programme, setProgramme] = useState("ALL");
  const [freeText, setFreeText] = useState("");

  // Compare Basket State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);

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

  const exp1 = selectedForCompare[0] ? allExperiments.find((e) => e.id === selectedForCompare[0]) : null;
  const exp2 = selectedForCompare[1] ? allExperiments.find((e) => e.id === selectedForCompare[1]) : null;

  return (
    <div className="min-h-screen bg-[#0C0F13] text-[#F3F5F7] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedCompareCount={selectedForCompare.length}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="border-b border-[#303741] bg-[#15191F]/80 backdrop-blur px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#E99847]">
              NASA Flame in Freefall
            </span>
            <span className="text-[#303741]">/</span>
            <span className="text-xs text-[#A1AAB5]">SI-Powered Fire Safety Intelligence</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#1B2027] text-[#5CB59B] border border-[#303741] font-mono">
              10 Verified Investigations
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#1B2027] text-[#78A9D8] border border-[#303741] font-mono">
              NVIDIA Nemotron NIM
            </span>
          </div>
        </header>

        {/* Scientific Boundary Banner */}
        <div className="bg-[#15191F] border-b border-[#303741] px-4 sm:px-6 py-2">
          <div className="flex items-center gap-2 text-xs text-[#A1AAB5]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#E99847] shrink-0" />
            <p className="text-[11px]">
              <strong className="text-[#F3F5F7]">Scientific Boundary:</strong> Microgravity (~0g) alters buoyancy; these findings are empirical spacecraft intelligence and do not predict Lunar (0.16g) or Martian (0.38g) partial-gravity fires without dedicated testing.
            </p>
          </div>
        </div>

        {/* Main Body */}
        <main className="p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Preset Inquiry Chips */}
          <div className="bg-[#1B2027] p-3.5 rounded-xl border border-[#303741] space-y-2">
            <span className="text-[10px] font-bold text-[#737F8C] uppercase tracking-wider block">
              One-Click Demonstration Queries:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => applyPreset("pmma")}
                className="px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-[#303741] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              >
                PMMA Low Airflow (BASS-II)
              </button>
              <button
                onClick={() => applyPreset("saffire-fabric")}
                className="px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-[#303741] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              >
                Large Fabric Fire in Cygnus (Saffire-I)
              </button>
              <button
                onClick={() => applyPreset("smoke-detection")}
                className="px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-[#303741] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              >
                Smoke Particle Sizing for Detectors (SAME-R)
              </button>
              <button
                onClick={() => applyPreset("cool-flame")}
                className="px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-[#303741] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              >
                Cool Flame Extinction & CO₂ (FLEX)
              </button>
              <button
                onClick={() => applyPreset("exploration-atm")}
                className="px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-[#303741] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              >
                Exploration Atmosphere (26-34% O₂)
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === "chart" && <FlameDynamicsChart />}
          {activeTab === "table" && (
            <MasterComparisonTable
              data={allExperiments}
              selectedForCompare={selectedForCompare}
              onToggleCompare={toggleCompare}
            />
          )}
          {activeTab === "coverage" && <GapMatrix experiments={allExperiments} />}
          {activeTab === "methodology" && (
            <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-6">
              <MethodologyModal onClose={() => setActiveTab("explore")} />
            </div>
          )}

          {activeTab === "explore" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Filter Panel (4 cols) */}
              <div className="lg:col-span-4 bg-[#1B2027] border border-[#303741] rounded-xl p-4 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#303741] pb-2.5">
                  <h3 className="font-bold text-[#F3F5F7] flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#E99847]" />
                    Inquiry Filters & Controls
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-[#A1AAB5] hover:text-[#F3F5F7] flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Fuse.js Search */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1">
                    Fuzzy Literature Query (Fuse.js)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="e.g. acrylic, soot particle, quiescent"
                      className="w-full bg-[#0C0F13] border border-[#303741] rounded-lg px-3 py-1.5 text-xs text-[#F3F5F7] placeholder-[#737F8C] focus:outline-none focus:border-[#E99847] transition pl-8"
                    />
                    <Search className="w-3.5 h-3.5 text-[#737F8C] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Material Select */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1">
                    Material / Fuel Class
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#0C0F13] border border-[#303741] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F5F7] focus:outline-none focus:border-[#E99847] transition"
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
                    <span className="uppercase tracking-wider font-semibold">Oxygen Concentration</span>
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
                            ? "bg-[#E99847] text-[#0C0F13] border-[#E99847] font-bold"
                            : "bg-[#0C0F13] text-[#A1AAB5] border-[#303741] hover:bg-[#15191F]"
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
                    <span className="uppercase tracking-wider font-semibold">Ventilation Velocity</span>
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
                            ? "bg-[#E99847] text-[#0C0F13] border-[#E99847] font-bold"
                            : "bg-[#0C0F13] text-[#A1AAB5] border-[#303741] hover:bg-[#15191F]"
                        }`}
                      >
                        {flow.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phenomenon Select */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1">
                    Target Measurement / Phenomenon
                  </label>
                  <select
                    value={phenomenon}
                    onChange={(e) => setPhenomenon(e.target.value)}
                    className="w-full bg-[#0C0F13] border border-[#303741] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F5F7] focus:outline-none focus:border-[#E99847] transition"
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
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-[#737F8C] block mb-1">
                    NASA Flight Programme
                  </label>
                  <select
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full bg-[#0C0F13] border border-[#303741] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F5F7] focus:outline-none focus:border-[#E99847] transition"
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
                <div className="pt-2.5 border-t border-[#303741] text-[11px] text-[#A1AAB5] flex items-center justify-between">
                  <span>Candidate Studies:</span>
                  <span className="font-bold text-[#F3F5F7] font-mono">
                    {rankedResults.length} records
                  </span>
                </div>
              </div>

              {/* Right Results Column (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Interpretation Panel */}
                <InterpretationPanel
                  synthesis={synthesis}
                  loading={synthesisLoading}
                  onGenerate={handleGenerateInterpretation}
                />

                {/* Evidence Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#A1AAB5]">
                    <span className="uppercase tracking-wider font-bold text-[10px] text-[#737F8C]">
                      Ranked NASA Microgravity Investigations
                    </span>
                    <span className="text-[11px]">Sorted by Transparent Relevance Score</span>
                  </div>

                  {rankedResults.length === 0 ? (
                    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-8 text-center text-[#A1AAB5]">
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
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Compare Modal */}
      {isCompareOpen && exp1 && exp2 && (
        <CompareModal exp1={exp1} exp2={exp2} onClose={() => setIsCompareOpen(false)} />
      )}
    </div>
  );
}
