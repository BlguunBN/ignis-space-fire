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
import {
  Flame,
  Search,
  SlidersHorizontal,
  Scale,
  Sparkles,
  FileQuestion,
  RotateCcw,
  BookOpen,
  ShieldAlert,
  Grid3X3,
  ListFilter,
  Activity,
  Table as TableIcon,
  Sparkle,
} from "lucide-react";

export default function Home() {
  const allExperiments = experimentsData as ExperimentRecord[];

  // Query State
  const [material, setMaterial] = useState("");
  const [oxygenPct, setOxygenPct] = useState<number | null>(null);
  const [airflowCmS, setAirflowCmS] = useState<number | null>(null);
  const [phenomenon, setPhenomenon] = useState("");
  const [programme, setProgramme] = useState("ALL");
  const [freeText, setFreeText] = useState("");

  // Compare State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Active View Tab: 'evidence' | 'chart' | 'table' | 'gap-matrix'
  const [activeTab, setActiveTab] = useState<"evidence" | "chart" | "table" | "gap-matrix">("evidence");

  // Modals
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

  // Trigger Grounded AI Interpretation via API Route (NVIDIA Nemotron 30B + Fallback)
  const handleGenerateInterpretation = async () => {
    setSynthesisLoading(true);
    try {
      const top3 = rankedResults.slice(0, 3);
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, topRanked: top3 }),
      });

      if (res.ok) {
        const data = await res.json();
        setSynthesis(data);
      } else {
        // Direct local synthesis fallback if server returned error
        const { generateGroundedInterpretation } = await import("@/lib/synthesis");
        const fallback = await generateGroundedInterpretation(query, top3);
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
    <main className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      {/* Top Navigation / Brand */}
      <header className="border-b border-slate-800 bg-[#0a0f1d]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/40">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">IGNIS</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  NASA Space Apps 2026
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ✨ Team Twinkle Twinkle
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NASA Microgravity Combustion Evidence & Fire Safety Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedForCompare.length === 2 && (
              <button
                onClick={() => setIsCompareOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
              >
                <Scale className="w-4 h-4" />
                Compare (2 Selected)
              </button>
            )}

            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Methodology & Provenance
            </button>
          </div>
        </div>
      </header>

      {/* Scientific Boundary Banner (Mandatory Validity Rule) */}
      <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <p>
            <strong>NASA Scientific Boundary:</strong> Indexed empirical records represent sustained microgravity (0g). Microgravity alters buoyancy and transport; these findings are not a quantitative predictive model for Lunar (0.16g) or Martian (0.38g) partial gravity flammability.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* Preset Inquiry Chips */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            One-Click Demonstrations for Judges:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset("pmma")}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              🔹 PMMA in Low Airflow (BASS-II)
            </button>
            <button
              onClick={() => applyPreset("saffire-fabric")}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              🔹 Vehicle-Scale Fabric Fire (Saffire-I)
            </button>
            <button
              onClick={() => applyPreset("smoke-detection")}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              🔹 Spacecraft Smoke Particle Sizing (SAME-R)
            </button>
            <button
              onClick={() => applyPreset("cool-flame")}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              🔹 Cool Flame Discovery & Extinction (FLEX)
            </button>
            <button
              onClick={() => applyPreset("exploration-atm")}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
            >
              🔹 Exploration Atmospheres (26-34% O₂)
            </button>
          </div>
        </div>

        {/* View Switcher: 4 Views */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("evidence")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "evidence"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Evidence Ranking ({rankedResults.length})
            </button>

            <button
              onClick={() => setActiveTab("chart")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "chart"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              Empirical Flame Dynamics (Recharts)
            </button>

            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "table"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Master Comparison Table (TanStack)
            </button>

            <button
              onClick={() => setActiveTab("gap-matrix")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "gap-matrix"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Evidence Gap Matrix
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline font-mono">
            Fuse.js Fuzzy Search · NVIDIA Nemotron 30B
          </span>
        </div>

        {/* View Routing */}
        {activeTab === "chart" && <FlameDynamicsChart />}
        {activeTab === "table" && (
          <MasterComparisonTable
            data={allExperiments}
            selectedForCompare={selectedForCompare}
            onToggleCompare={toggleCompare}
          />
        )}
        {activeTab === "gap-matrix" && <GapMatrix />}

        {activeTab === "evidence" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Filter Column (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  Evidence Query & Filters
                </h3>
                <button
                  onClick={resetFilters}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Natural Language Question (with Fuse.js) */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Fuzzy Search (Fuse.js Powered)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="e.g. acrylic, low airflow, soot particle"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition pl-8"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Material Filter */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Material
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
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

              {/* Atmosphere: Oxygen Concentration */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span className="uppercase tracking-wider font-semibold">Oxygen Concentration</span>
                  <span className="font-mono text-cyan-400">{oxygenPct ? `${oxygenPct}%` : "Any"}</span>
                </div>
                <div className="flex gap-1.5">
                  {[null, 18, 21, 26, 34].map((pct, i) => (
                    <button
                      key={i}
                      onClick={() => setOxygenPct(pct)}
                      className={`flex-1 py-1 text-[11px] rounded border transition ${
                        oxygenPct === pct
                          ? "bg-blue-600 text-white border-blue-500 font-bold"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {pct ? `${pct}%` : "All"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Airflow Velocity */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span className="uppercase tracking-wider font-semibold">Ventilation Airflow</span>
                  <span className="font-mono text-cyan-400">{airflowCmS !== null ? `${airflowCmS} cm/s` : "Any"}</span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: "All", val: null },
                    { label: "0 cm/s", val: 0 },
                    { label: "2-5", val: 3.5 },
                    { label: "15-20", val: 20 },
                  ].map((flow, i) => (
                    <button
                      key={i}
                      onClick={() => setAirflowCmS(flow.val)}
                      className={`flex-1 py-1 text-[11px] rounded border transition ${
                        airflowCmS === flow.val
                          ? "bg-blue-600 text-white border-blue-500 font-bold"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {flow.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phenomenon */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Phenomenon / Measurement
                </label>
                <select
                  value={phenomenon}
                  onChange={(e) => setPhenomenon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">All Phenomena</option>
                  <option value="flame_spread">Flame Spread Velocity</option>
                  <option value="extinction">Extinction & Quenching Limits</option>
                  <option value="smoke">Smoke & Aerosol Generation</option>
                  <option value="cool_flame">Cool Flame Behavior</option>
                  <option value="radiation">Radiation & Soot Emission</option>
                </select>
              </div>

              {/* Programme Selector */}
              <div>
                <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  NASA Flight Programme
                </label>
                <select
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="ALL">All Flight Programmes</option>
                  <option value="Saffire">Saffire (Cygnus Large Scale)</option>
                  <option value="BASS">BASS / BASS-II (ISS Glovebox)</option>
                  <option value="FLEX">FLEX (Droplet CIR)</option>
                  <option value="SAME">SAME-R (Smoke Aerosol)</option>
                  <option value="SPICE">SPICE (Laminar Burner)</option>
                  <option value="SoFIE">SoFIE (Exploration Atmosphere)</option>
                </select>
              </div>

              {/* Active Filters Summary */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Displaying:</span>
                <span className="font-semibold text-white">
                  {rankedResults.length} NASA Investigations
                </span>
              </div>
            </div>

            {/* Right Content Area (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Grounded AI Interpretation Panel */}
              <InterpretationPanel
                synthesis={synthesis}
                loading={synthesisLoading}
                onGenerate={handleGenerateInterpretation}
              />

              {/* Evidence Cards List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase tracking-wider font-bold">
                    Ranked NASA Microgravity Investigations
                  </span>
                  <span>Deterministic Physics Score + Fuzzy Relevance</span>
                </div>

                {rankedResults.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                    <FileQuestion className="w-8 h-8 mx-auto text-slate-600 mb-2" />
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
      </div>

      {/* Compare Modal */}
      {isCompareOpen && exp1 && exp2 && (
        <CompareModal exp1={exp1} exp2={exp2} onClose={() => setIsCompareOpen(false)} />
      )}

      {/* Methodology Modal */}
      {isMethodologyOpen && (
        <MethodologyModal onClose={() => setIsMethodologyOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            IGNIS: Intelligent Guidance from NASA Investigation Studies · Team Twinkle Twinkle · NASA Space Apps Ulaanbaatar 2026
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>License: Apache-2.0</span>
            <span>Data: NASA PSI & NTRS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
