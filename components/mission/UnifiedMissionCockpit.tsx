"use client";

import React, { useState, useMemo, useRef } from "react";
import experimentsData from "@/data/experiments.json";
import papersData from "@/data/papers.json";
import simulationCasesData from "@/data/simulation-cases.json";
import visualizationsData from "@/data/visualizations.json";
import { ExperimentRecord, SearchQuery, RankedEvidence } from "@/types/evidence";
import { SimulationCase } from "@/types/simulation";
import { VisualExperimentPackage } from "@/types/visualization";
import { rankEvidence } from "@/lib/ranking";
import { evaluateD2Simulation } from "@/lib/simulationEngine";
import { buildDeterministicSynthesis, SynthesisResponse } from "@/lib/synthesis";
import { FlameDynamicsChart } from "@/components/FlameDynamicsChart";
import { D2Chart } from "@/components/simulation/D2Chart";
import { ConceptFlameCanvas } from "@/components/simulation/ConceptFlameCanvas";
import { SolidFuelScenarioExplorer } from "@/components/simulation/SolidFuelScenarioExplorer";
import { ExperimentApparatusDiagram } from "@/components/experiment/ExperimentApparatusDiagram";
import { ImageInspector } from "@/components/experiment/ImageInspector";
import { MissionLab } from "@/components/mission/MissionLab";
import { MasterComparisonTable } from "@/components/MasterComparisonTable";
import { GapMatrix } from "@/components/GapMatrix";
import { ResearchPapersList } from "@/components/papers/ResearchPapersList";
import { CompareModal } from "@/components/CompareModal";
import {
  Flame,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  BookOpen,
  Layers,
  Sparkles,
  Cpu,
  Orbit,
  ArrowRight,
  Clipboard,
  FileText,
  Printer,
  Table2,
  Grid3X3,
  Scale,
  X,
  Compass,
  Wind,
  Gauge,
  Atom,
  ChevronRight,
  Maximize2,
} from "lucide-react";

const ALL_EXPERIMENTS = experimentsData as ExperimentRecord[];
const SIMULATION_CASES = simulationCasesData as SimulationCase[];
const VISUAL_PACKAGES = visualizationsData as VisualExperimentPackage[];

// Pre-configured mission scenarios addressing core NASA challenge requirements
interface ScenarioPreset {
  id: string;
  badge: string;
  title: string;
  description: string;
  query: SearchQuery;
  targetExpId: string;
  targetCenterTab: "dynamics" | "sandbox" | "apparatus" | "mission_flow";
}

const MISSION_PRESETS: ScenarioPreset[] = [
  {
    id: "lunar_gateway",
    badge: "🌕 Exploration Atmosphere",
    title: "Lunar Gateway Flammability (34% O₂ / 56 kPa)",
    description: "Evaluates thick solid polymers & flammability boundaries in low-pressure, high-oxygen cabin air.",
    query: { oxygenPct: 34.0, pressureKpa: 56.0, airflowCmS: 12.0, material: "PMMA" },
    targetExpId: "sofie-gel",
    targetCenterTab: "dynamics",
  },
  {
    id: "iss_standard",
    badge: "🛰️ ISS Standard",
    title: "ISS Microgravity Ventilation Baseline (21% O₂ / 101 kPa)",
    description: "Benchmark opposed-flow solid fuel flame spread in low-velocity forced cabin airflow.",
    query: { oxygenPct: 21.0, pressureKpa: 101.3, airflowCmS: 3.5, material: "PMMA" },
    targetExpId: "bass-2-pmma",
    targetCenterTab: "dynamics",
  },
  {
    id: "emergency_quench",
    badge: "🛑 Quenching & Extinction",
    title: "Zero-Ventilation Droplet Extinction & Cool Flames",
    description: "Studies isolated fuel droplet burning and transition to quasi-steady invisible cool flames at 650 K.",
    query: { oxygenPct: 18.0, airflowCmS: 0.0, phenomenon: "extinction" },
    targetExpId: "flex-droplet-1",
    targetCenterTab: "sandbox",
  },
  {
    id: "smoke_aerosol",
    badge: "⚠️ Detection Systems",
    title: "Smoke Particle Coagulation (SAME-R MSG)",
    description: "Pre-ignition pyrolysis aerosols grow larger in microgravity without buoyant updrafts.",
    query: { material: "insulation", phenomenon: "smoke" },
    targetExpId: "same-r-smoke",
    targetCenterTab: "apparatus",
  },
  {
    id: "saffire_large",
    badge: "🔥 Large-Scale Fire",
    title: "Cygnus Large-Scale Fabric Spread (Saffire-I 20 cm/s)",
    description: "0.4m x 1.0m fabric flame spread in microgravity without natural buoyancy.",
    query: { material: "cotton-fiberglass", airflowCmS: 20.0, phenomenon: "flame_spread" },
    targetExpId: "saffire-1",
    targetCenterTab: "dynamics",
  },
];

type CenterTab = "dynamics" | "sandbox" | "apparatus" | "mission_flow";
type ActiveModal = "none" | "compare" | "table" | "coverage" | "papers";

export function UnifiedMissionCockpit() {
  // Query & Filter State
  const [material, setMaterial] = useState<string>("");
  const [oxygenPct, setOxygenPct] = useState<number | null>(null);
  const [pressureKpa, setPressureKpa] = useState<number | null>(null);
  const [airflowCmS, setAirflowCmS] = useState<number | null>(null);
  const [phenomenon, setPhenomenon] = useState<string>("");
  const [programme, setProgramme] = useState<string>("ALL");
  const [freeText, setFreeText] = useState<string>("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);

  // Active Selection & Modals
  const [selectedExpId, setSelectedExpId] = useState<string>("saffire-1");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(["saffire-1", "sofie-gel"]);
  const [activeCenterTab, setActiveCenterTab] = useState<CenterTab>("dynamics");
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");

  // Physics Simulation State (for Center Sandbox Tab)
  const [sandboxMode, setSandboxMode] = useState<"droplet" | "solid">("droplet");
  const [d0, setD0] = useState<number>(3.0);
  const [k, setK] = useState<number>(0.76);
  const [simGravity, setSimGravity] = useState<number>(0);
  const [simAirflow, setSimAirflow] = useState<number>(5.0);

  // SI Synthesis State
  const [synthesis, setSynthesis] = useState<SynthesisResponse | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Build current structured query
  const query: SearchQuery = useMemo(
    () => ({
      material: material || undefined,
      oxygenPct: oxygenPct,
      pressureKpa: pressureKpa,
      airflowCmS: airflowCmS,
      phenomenon: phenomenon || undefined,
      programme: programme !== "ALL" ? programme : undefined,
      freeText: freeText || undefined,
    }),
    [material, oxygenPct, pressureKpa, airflowCmS, phenomenon, programme, freeText]
  );

  // Rank evidence using deterministic physics & fuzzy heuristics
  const rankedResults = useMemo(() => {
    let dataset = ALL_EXPERIMENTS;
    if (programme !== "ALL") {
      dataset = dataset.filter((e) => e.programme.toUpperCase() === programme.toUpperCase());
    }
    return rankEvidence(dataset, query);
  }, [query, programme]);

  // Active Experiment
  const activeExp = useMemo(() => {
    return (
      ALL_EXPERIMENTS.find((e) => e.id === selectedExpId) ||
      rankedResults[0]?.experiment ||
      ALL_EXPERIMENTS[0]
    );
  }, [selectedExpId, rankedResults]);

  // Active Simulation Case (defaults to FLEX droplet)
  const activeSimCase = useMemo(() => {
    return (
      SIMULATION_CASES.find((c) => c.experimentId === activeExp.id) ||
      SIMULATION_CASES[0]
    );
  }, [activeExp.id]);

  // Dynamic D2 calculation
  const simResult = useMemo(() => {
    if (activeSimCase.mode === "calibrated_model") {
      return evaluateD2Simulation(
        activeSimCase.measurementSeries,
        d0,
        k,
        activeSimCase.calibration
      );
    }
    return null;
  }, [activeSimCase, d0, k]);

  // Handle Preset Selection
  const applyPreset = (preset: ScenarioPreset) => {
    setMaterial(preset.query.material || "");
    setOxygenPct(preset.query.oxygenPct ?? null);
    setPressureKpa(preset.query.pressureKpa ?? null);
    setAirflowCmS(preset.query.airflowCmS ?? null);
    setPhenomenon(preset.query.phenomenon || "");
    setProgramme(preset.query.programme || "ALL");
    setFreeText(preset.query.freeText || "");
    setSelectedExpId(preset.targetExpId);
    setActiveCenterTab(preset.targetCenterTab);
    setSynthesis(null);
    setToastMessage(`Mission Scenario Loaded: ${preset.title}`);
  };

  // Reset all filters
  const resetFilters = () => {
    setMaterial("");
    setOxygenPct(null);
    setPressureKpa(null);
    setAirflowCmS(null);
    setPhenomenon("");
    setProgramme("ALL");
    setFreeText("");
    setSynthesis(null);
    setToastMessage("All atmospheric filters reset to baseline.");
  };

  // Toggle comparison tray
  const toggleCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        setToastMessage("Comparison tray limited to 3 investigations.");
        return prev;
      }
      return [...prev, id];
    });
  };

  // Generate Grounded SI Safety Brief
  const handleGenerateBrief = async () => {
    setSynthesisLoading(true);
    setToastMessage("");
    const ids = selectedForCompare.length > 0 ? selectedForCompare : [activeExp.id];
    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, experimentIds: ids }),
      });
      if (!response.ok) throw new Error("Synthesis API unavailable");
      const data: SynthesisResponse = await response.json();
      setSynthesis(data);
      setToastMessage("Mission Safety Brief generated.");
    } catch {
      // Offline deterministic fallback
      const fallbackSubset = ALL_EXPERIMENTS.filter((e) => ids.includes(e.id));
      const fallback = buildDeterministicSynthesis(query, rankEvidence(fallbackSubset, query));
      setSynthesis(fallback);
      setToastMessage("Compiled deterministic scientific safety summary (100% offline).");
    } finally {
      setSynthesisLoading(false);
    }
  };

  // Copy brief markdown
  const copyBriefMarkdown = () => {
    if (!synthesis) return;
    const text = [
      `# NASA IGNIS 2.0 Flight Safety Assessment Report (FSAR)`,
      `**Target Inquiry:** ${freeText || "Multivariate Spacecraft Fire Safety Analysis"}`,
      `**Corpus Version:** ${synthesis.corpusVersion} | **Mode:** ${synthesis.aiMode}`,
      `\n## 1. Verified Microgravity Observations & Telemetry`,
      ...synthesis.observations.map((o) => `- ${o.text} [${o.evidenceId}]`),
      `\n## 2. Spacecraft Habitation & Design Relevance`,
      ...synthesis.relevance.map((r) => `- ${r.text}`),
      `\n## 3. Operational Cautions & Unknown Boundaries`,
      ...synthesis.unknowns.map((u) => `- ${u.text}`),
      `\n## 4. Cited NASA Primary Sources`,
      ...synthesis.citedSources.map((s) => `- [${s.id}] ${s.title} — ${s.sourceLocator}: ${s.sourceUrl}`),
    ].join("\n");

    navigator.clipboard.writeText(text);
    setToastMessage("Full Flight Safety Brief copied to clipboard.");
  };

  // Compare Exp 1 & 2 for modal
  const compareExp1 = ALL_EXPERIMENTS.find((e) => e.id === selectedForCompare[0]) || ALL_EXPERIMENTS[0];
  const compareExp2 = ALL_EXPERIMENTS.find((e) => e.id === selectedForCompare[1]) || ALL_EXPERIMENTS[1];

  return (
    <div className="min-h-screen bg-[#080A0D] text-[#F8FAFC] flex flex-col font-sans">
      {/* =========================================================================
          1. TOP MISSION COMMAND BAR
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#0E1217]/95 backdrop-blur border-b border-[#222B35] px-4 lg:px-8 py-3">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#2C210F] border border-[#91601C] text-[#F8B54D]">
              <Flame className="w-5 h-5 text-[#F8B54D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">IGNIS 2.0</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C2633] text-[#78A9D8] border border-[#2D3D52]">
                  NASA SPACE APPS 2026
                </span>
              </div>
              <p className="text-[11px] text-[#A7B4C4]">
                Spacecraft Fire Safety Intelligence &amp; Microgravity Combustion Laboratory
              </p>
            </div>
          </div>

          {/* Quick Drawer Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveModal("table")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A22] border border-[#2B3542] text-[#D1DBE5] hover:border-[#DDA36B] hover:text-white transition"
              title="Open full comparison matrix table"
            >
              <Table2 className="w-3.5 h-3.5 text-[#DDA36B]" />
              <span>Full Matrix Table</span>
            </button>

            <button
              onClick={() => setActiveModal("coverage")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A22] border border-[#2B3542] text-[#D1DBE5] hover:border-[#DDA36B] hover:text-white transition"
              title="Open atmospheric & ventilation coverage map"
            >
              <Grid3X3 className="w-3.5 h-3.5 text-[#5CB59B]" />
              <span>Coverage Heatmap</span>
            </button>

            <button
              onClick={() => setActiveModal("papers")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A22] border border-[#2B3542] text-[#D1DBE5] hover:border-[#DDA36B] hover:text-white transition"
              title="Open peer-reviewed literature vault"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#78A9D8]" />
              <span>Literature Vault ({papersData.length})</span>
            </button>

            <button
              onClick={() => setActiveModal("compare")}
              disabled={selectedForCompare.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C210F] border border-[#91601C] text-[#F8B54D] hover:bg-[#3B2C15] disabled:opacity-40 disabled:pointer-events-none transition"
              title="Compare selected investigations side by side"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Tray ({selectedForCompare.length}/3)</span>
            </button>
          </div>
        </div>

        {/* Global Toast / Feedback Notice */}
        {toastMessage && (
          <div className="max-w-[1720px] mx-auto mt-2 px-3 py-1.5 bg-[#2B2416] border border-[#84682F] rounded-lg text-xs text-[#FFDE9E] flex items-center justify-between animate-fade-in">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage("")} className="text-[#FFDE9E] hover:text-white ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. MISSION SCENARIO QUICK-SELECT BAR
          ========================================================================= */}
      <section className="bg-[#10141A] border-b border-[#222B35] px-4 lg:px-8 py-2.5">
        <div className="max-w-[1720px] mx-auto flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="font-mono text-[10px] uppercase font-bold text-[#737F8C] shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#DDA36B]" />
            Mission Scenarios:
          </span>
          {MISSION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161D26] border border-[#2B3542] hover:border-[#DDA36B] text-[#D1DBE5] hover:text-white transition group"
            >
              <span className="font-semibold">{preset.badge}</span>
              <span className="text-[#737F8C] group-hover:text-[#A7B4C4] hidden xl:inline">
                {preset.title.split("(")[0]}
              </span>
              <ArrowRight className="w-3 h-3 text-[#737F8C] group-hover:text-[#DDA36B] transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. TRI-PANE WORKBENCH COCKPIT (Linear / NASA Ames Layout)
          ========================================================================= */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ===================================================================
              LEFT PANE (Col 1-4: ~33%): INVESTIGATION LEDGER & MULTI-FILTER
              =================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* Filter & Search Header Card */}
            <div className="bg-[#0E1217] border border-[#222B35] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A7B4C4] font-mono flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#DDA36B]" />
                  Investigation Ledger ({rankedResults.length})
                </span>
                <button
                  onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#DDA36B] hover:underline"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  {filterDrawerOpen ? "Hide Controls" : "Atmospheric Controls"}
                </button>
              </div>

              {/* Natural Text Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by fuel, material, flow velocity..."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="w-full bg-[#141A22] border border-[#2B3542] rounded-lg px-3 py-2 text-xs text-white placeholder-[#737F8C] focus:outline-none focus:border-[#DDA36B] transition"
                />
                {freeText && (
                  <button
                    onClick={() => setFreeText("")}
                    className="absolute right-2.5 top-2.5 text-[#737F8C] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Collapsible Atmospheric Controls Drawer */}
              {filterDrawerOpen && (
                <div className="pt-3 border-t border-[#222B35] space-y-3 animate-fade-in text-xs">
                  {/* Material */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-[#737F8C] block mb-1">
                      Material / Fuel
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PMMA, cotton, SIBAL, n-heptane"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-[#141A22] border border-[#2B3542] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#DDA36B]"
                    />
                  </div>

                  {/* Atmospheric Sliders */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#737F8C] block mb-1">
                        O₂ ({oxygenPct != null ? `${oxygenPct}%` : "Any"})
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        step={1}
                        placeholder="21"
                        value={oxygenPct ?? ""}
                        onChange={(e) => setOxygenPct(e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-[#141A22] border border-[#2B3542] rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#737F8C] block mb-1">
                        P ({pressureKpa != null ? `${pressureKpa} kPa` : "Any"})
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={120}
                        step={1}
                        placeholder="101"
                        value={pressureKpa ?? ""}
                        onChange={(e) => setPressureKpa(e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-[#141A22] border border-[#2B3542] rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-[#737F8C] block mb-1">
                        Flow ({airflowCmS != null ? `${airflowCmS} cm/s` : "Any"})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        placeholder="5"
                        value={airflowCmS ?? ""}
                        onChange={(e) => setAirflowCmS(e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-[#141A22] border border-[#2B3542] rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Flight Programme Select */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] uppercase font-mono text-[#737F8C]">Programme:</span>
                    <select
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                      className="bg-[#141A22] border border-[#2B3542] rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="ALL">All Flight Programmes</option>
                      <option value="Saffire">Saffire (Cygnus)</option>
                      <option value="BASS">BASS / BASS-II (MSG)</option>
                      <option value="FLEX">FLEX (Droplet CIR)</option>
                      <option value="SAME">SAME-R (Smoke MSG)</option>
                      <option value="SPICE">SPICE (Laminar MSG)</option>
                      <option value="SoFIE">SoFIE (GEL CIR)</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1 text-[11px] text-[#A7B4C4] hover:text-white"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Verified NASA Experiments */}
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {rankedResults.map(({ experiment, score, breakdown }) => {
                const isSelected = selectedExpId === experiment.id;
                const isCompared = selectedForCompare.includes(experiment.id);

                return (
                  <article
                    key={experiment.id}
                    onClick={() => setSelectedExpId(experiment.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-xs space-y-2.5 ${
                      isSelected
                        ? "bg-[#161D26] border-[#DDA36B] shadow-md shadow-[#DDA36B]/5"
                        : "bg-[#0E1217] border-[#222B35] hover:border-[#384656]"
                    }`}
                  >
                    {/* Card Top: Badges & Provenance */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] uppercase font-bold text-[#DDA36B]">
                            {experiment.programme}
                          </span>
                          <span className="text-[#737F8C]">·</span>
                          <span className="font-mono text-[10px] text-[#78A9D8]">
                            {experiment.psi_id || "NASA Source"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#5CB59B]/10 text-[#5CB59B] border border-[#5CB59B]/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm leading-snug">
                          {experiment.investigation}
                        </h3>
                      </div>

                      {/* Compare Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(experiment.id);
                        }}
                        className={`p-1.5 rounded text-[10px] font-semibold border transition shrink-0 ${
                          isCompared
                            ? "bg-[#DDA36B] text-black border-[#DDA36B]"
                            : "bg-[#141A22] text-[#A7B4C4] border-[#2B3542] hover:text-white"
                        }`}
                        title={isCompared ? "Remove from comparison" : "Add to comparison tray"}
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Platform & Material */}
                    <div className="flex items-center justify-between text-[11px] text-[#A7B4C4]">
                      <span>{experiment.platform}</span>
                      <span className="font-mono text-white font-medium">{experiment.material}</span>
                    </div>

                    {/* Quantitative Conditions Matrix Strip */}
                    <div className="grid grid-cols-3 gap-1 bg-[#080A0D] p-2 rounded-lg border border-[#1C242F] text-[10px] font-mono">
                      <div>
                        <span className="text-[#737F8C] block">Oxygen</span>
                        <span className="text-[#DDA36B] font-semibold">
                          {experiment.oxygen_pct != null ? `${experiment.oxygen_pct}% O₂` : "Not reported"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#737F8C] block">Pressure</span>
                        <span className="text-white">
                          {experiment.pressure_kpa != null ? `${experiment.pressure_kpa} kPa` : "Not reported"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#737F8C] block">Airflow</span>
                        <span className="text-[#78A9D8]">
                          {experiment.airflow_cm_s != null ? `${experiment.airflow_cm_s} cm/s` : "Not reported"}
                        </span>
                      </div>
                    </div>

                    {/* Finding Preview */}
                    <p className="text-[11px] text-[#A7B4C4] line-clamp-2 leading-relaxed">
                      {experiment.finding}
                    </p>

                    {/* Footer Score & Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#1C242F] text-[10px]">
                      <span className="text-[#5CB59B] font-mono">
                        Relevance: {Math.round(score)}%
                      </span>
                      <span className="text-[#DDA36B] flex items-center gap-1 group-hover:underline">
                        Inspect in Stage <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ===================================================================
              CENTER PANE (Col 5-8: ~38%): DYNAMIC ANALYTICAL & TELEMETRY STAGE
              =================================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Stage Tab Navigation */}
            <div className="bg-[#0E1217] border border-[#222B35] rounded-xl p-2 flex items-center justify-between gap-1 overflow-x-auto text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCenterTab("dynamics")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    activeCenterTab === "dynamics"
                      ? "bg-[#DDA36B] text-black font-bold"
                      : "text-[#A7B4C4] hover:text-white"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Empirical Curves</span>
                </button>

                <button
                  onClick={() => setActiveCenterTab("sandbox")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    activeCenterTab === "sandbox"
                      ? "bg-[#DDA36B] text-black font-bold"
                      : "text-[#A7B4C4] hover:text-white"
                  }`}
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span>Physics Sandbox</span>
                </button>

                <button
                  onClick={() => setActiveCenterTab("apparatus")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    activeCenterTab === "apparatus"
                      ? "bg-[#DDA36B] text-black font-bold"
                      : "text-[#A7B4C4] hover:text-white"
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Apparatus &amp; Imagery</span>
                </button>

                <button
                  onClick={() => setActiveCenterTab("mission_flow")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    activeCenterTab === "mission_flow"
                      ? "bg-[#DDA36B] text-black font-bold"
                      : "text-[#A7B4C4] hover:text-white"
                  }`}
                >
                  <Orbit className="w-3.5 h-3.5" />
                  <span>Flight Graph</span>
                </button>
              </div>
            </div>

            {/* Active Investigation Context Banner */}
            <div className="bg-[#0E1217] border border-[#222B35] rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-mono text-[10px] text-[#DDA36B] uppercase font-bold block">
                  Active Investigation: {activeExp.programme}
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">{activeExp.investigation}</h2>
                <p className="text-[11px] text-[#A7B4C4]">
                  {activeExp.platform} · {activeExp.source_locator || "NASA PSI Repository"}
                </p>
              </div>
              <a
                href={activeExp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161D26] border border-[#2B3542] text-[11px] text-[#78A9D8] hover:text-white shrink-0"
              >
                <span>NASA PSI Record</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Tab 1: Empirical Dynamics (Recharts Curves) */}
            {activeCenterTab === "dynamics" && (
              <div className="space-y-4">
                <FlameDynamicsChart />
              </div>
            )}

            {/* Tab 2: Physics What-If Sandbox (d² Law & Opposed-Flow Solver) */}
            {activeCenterTab === "sandbox" && (
              <div className="space-y-4 bg-[#0E1217] border border-[#222B35] rounded-xl p-4 text-xs">
                {/* Sandbox Sub-Mode Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#222B35]">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Atom className="w-4 h-4 text-[#DDA36B]" />
                      Microgravity Combustion Physics Sandbox
                    </h3>
                    <p className="text-[11px] text-[#A7B4C4]">
                      Compare NASA droplet d² combustion against solid polymer opposed-flow flame spread.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#141A22] p-1 rounded-lg border border-[#2B3542]">
                    <button
                      onClick={() => setSandboxMode("droplet")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        sandboxMode === "droplet"
                          ? "bg-[#DDA36B] text-black font-bold"
                          : "text-[#A7B4C4] hover:text-white"
                      }`}
                    >
                      Droplet d² Model
                    </button>
                    <button
                      onClick={() => setSandboxMode("solid")}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        sandboxMode === "solid"
                          ? "bg-[#DDA36B] text-black font-bold"
                          : "text-[#A7B4C4] hover:text-white"
                      }`}
                    >
                      Solid Fuel Opposed-Flow
                    </button>
                  </div>
                </div>

                {sandboxMode === "droplet" ? (
                  <>
                    {/* Slider Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#141A22] p-3 rounded-lg border border-[#2B3542]">
                      <div>
                        <div className="flex justify-between mb-1 text-[11px]">
                          <span className="text-[#A7B4C4]">Initial Diameter (D₀):</span>
                          <span className="font-mono text-white font-bold">{d0.toFixed(1)} mm</span>
                        </div>
                        <input
                          type="range"
                          min={1.5}
                          max={5.0}
                          step={0.1}
                          value={d0}
                          onChange={(e) => setD0(Number(e.target.value))}
                          className="w-full accent-[#DDA36B]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[11px]">
                          <span className="text-[#A7B4C4]">Burning Rate Constant (K):</span>
                          <span className="font-mono text-[#DDA36B] font-bold">{k.toFixed(2)} mm²/s</span>
                        </div>
                        <input
                          type="range"
                          min={0.4}
                          max={1.2}
                          step={0.02}
                          value={k}
                          onChange={(e) => setK(Number(e.target.value))}
                          className="w-full accent-[#DDA36B]"
                        />
                      </div>
                    </div>

                    {/* D2 Chart with empirical data & regression line */}
                    {simResult && (
                      <D2Chart
                        timeSeries={simResult.timeSeries}
                        calibration={activeSimCase.calibration}
                        burnoutTime={simResult.burnoutTime_sec}
                        rmse={simResult.rmse}
                        mae={simResult.mae}
                        d0={d0}
                        k={k}
                      />
                    )}

                    {/* Interactive Concept Flame Canvas (0g vs 1g) */}
                    <div className="pt-2 border-t border-[#222B35]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-[#78A9D8]" />
                          Flame Geometry &amp; Buoyancy Comparison Canvas
                        </span>
                        <span className="text-[10px] text-[#A7B4C4]">0g Spherical vs 1g Teardrop</span>
                      </div>
                      <ConceptFlameCanvas
                        gravityMode={simGravity}
                        airflowCmS={simAirflow}
                        onToggleGravity={setSimGravity}
                        onAirflowChange={setSimAirflow}
                      />
                    </div>
                  </>
                ) : (
                  <SolidFuelScenarioExplorer />
                )}
              </div>
            )}

            {/* Tab 3: Flight Apparatus & Visuals */}
            {activeCenterTab === "apparatus" && (
              <div className="space-y-4">
                <ExperimentApparatusDiagram />
                <div className="bg-[#0E1217] border border-[#222B35] rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        NASA SoFIE-GEL Flight Imaging (CIR MSG)
                      </h4>
                      <p className="text-[11px] text-[#A7B4C4]">
                        Spherical PMMA ignition and flame spread under Exploration Atmosphere conditions
                      </p>
                    </div>
                    <a
                      href="https://svs.gsfc.nasa.gov/31394"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#78A9D8] hover:underline flex items-center gap-1"
                    >
                      <span>NASA SVS Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ImageInspector
                    src="/nasa/sofie-gel/gel-sequence-original.jpg"
                    alt="NASA SoFIE-GEL PMMA sphere microgravity flame spread sequence"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Flight Mission Graph (React Flow) */}
            {activeCenterTab === "mission_flow" && (
              <div className="space-y-4">
                <MissionLab experiments={ALL_EXPERIMENTS} initialExpId={selectedExpId} />
              </div>
            )}
          </div>

          {/* ===================================================================
              RIGHT PANE (Col 9-12: ~29%): MISSION SAFETY COPILOT & SI SYNTHESIS
              =================================================================== */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0E1217] border border-[#222B35] rounded-xl p-4 space-y-4 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222B35]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DDA36B]" />
                  <span className="font-bold text-white text-sm">Flight Safety Copilot</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#2C210F] text-[#F8B54D] border border-[#91601C]">
                  {synthesis?.aiMode === "live_llm" ? "NVIDIA Nemotron-30B" : "Grounded Engine"}
                </span>
              </div>

              {/* Active Evaluation Context */}
              <div className="bg-[#141A22] p-3 rounded-lg border border-[#2B3542] space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-[#737F8C] block">
                  Active Evaluation Context
                </span>
                <p className="font-semibold text-white">
                  {freeText || activeExp.investigation}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[#A7B4C4]">
                  <span>Corpus: 2026.11</span>
                  <span>·</span>
                  <span>Evaluated Studies: {selectedForCompare.length || 1}</span>
                </div>
              </div>

              {/* Synthesized Brief Sections */}
              {!synthesis ? (
                <div className="p-6 text-center space-y-3 bg-[#111720]/40 rounded-lg border border-dashed border-[#2B3542]">
                  <ShieldAlert className="w-8 h-8 mx-auto text-[#DDA36B]" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs">Awaiting Evaluation Run</h4>
                    <p className="text-[11px] text-[#737F8C]">
                      Run the SI Copilot to generate a grounded Flight Safety Assessment Report (FSAR) citing authentic NASA records.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={synthesisLoading}
                    className="w-full py-2 px-3 rounded-lg bg-[#DDA36B] text-black font-bold text-xs hover:bg-[#F8B54D] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {synthesisLoading ? "Evaluating Evidence..." : "Generate Flight Safety Memo"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Section 1: Verified Telemetry Observations */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#5CB59B] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      01. Verified Flight Telemetry
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-[#D1DBE5] list-disc list-inside bg-[#141A22] p-3 rounded-lg border border-[#2B3542]">
                      {synthesis.observations.map((obs, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {obs.text}
                          <span className="text-[#78A9D8] font-mono text-[9px] ml-1">
                            [{obs.evidenceId}]
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Section 2: Spacecraft Design Relevance */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#78A9D8] flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      02. Habitability &amp; Design Impact
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-[#D1DBE5] list-disc list-inside bg-[#141A22] p-3 rounded-lg border border-[#2B3542]">
                      {synthesis.relevance.map((rel, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {rel.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Section 3: Operational Limitations & Partial Gravity Boundaries */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#F8B54D] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      03. Operational Limits &amp; Cautions
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-[#D1DBE5] list-disc list-inside bg-[#141A22] p-3 rounded-lg border border-[#2B3542]">
                      {synthesis.unknowns.map((unk, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {unk.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Section 4: Primary NASA Citations */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#A7B4C4]">
                      04. Primary NASA Citations
                    </span>
                    <div className="space-y-1 text-[10px]">
                      {synthesis.citedSources.map((source) => (
                        <a
                          key={source.id}
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded bg-[#141A22] border border-[#2B3542] text-[#A7B4C4] hover:text-white"
                        >
                          <span className="font-medium truncate max-w-[200px]">
                            {source.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-[#78A9D8] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Copilot Action Toolbar */}
                  <div className="pt-2 border-t border-[#222B35] flex items-center gap-2">
                    <button
                      onClick={copyBriefMarkdown}
                      className="flex-1 py-1.5 rounded bg-[#161D26] border border-[#2B3542] text-[#D1DBE5] hover:text-white text-xs flex items-center justify-center gap-1"
                    >
                      <Clipboard className="w-3 h-3 text-[#DDA36B]" />
                      Copy Memo
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="py-1.5 px-3 rounded bg-[#161D26] border border-[#2B3542] text-[#D1DBE5] hover:text-white text-xs flex items-center justify-center gap-1"
                      title="Print or save as PDF"
                    >
                      <Printer className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleGenerateBrief}
                      disabled={synthesisLoading}
                      className="py-1.5 px-3 rounded bg-[#2C210F] border border-[#91601C] text-[#F8B54D] text-xs hover:bg-[#3B2C15]"
                      title="Regenerate brief"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scientific Rigor & Partial Gravity Invariant Notice */}
            <div className="p-3 bg-[#111720] border border-[#222B35] rounded-xl text-[11px] text-[#A7B4C4] space-y-1">
              <span className="font-bold text-white flex items-center gap-1 font-mono uppercase text-[10px]">
                <ShieldCheck className="w-3 h-3 text-[#5CB59B]" />
                NASA Scientific Boundary
              </span>
              <p className="leading-relaxed">
                Microgravity (~0g) empirical flammability data does not quantitatively predict Lunar (0.16g) or Martian (0.38g) partial gravity spread rates without dedicated testing (e.g. FLARE / FM2).
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          4. MODAL WORKSPACES & OVERLAYS
          ========================================================================= */}
      {/* Full Comparison Matrix Modal */}
      {activeModal === "table" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141A22] border border-[#303741] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#303741] flex items-center justify-between bg-[#0E1217]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-[#DDA36B]" />
                  NASA Microgravity Combustion Master Comparison Matrix
                </h2>
                <p className="text-xs text-[#A7B4C4]">
                  TanStack table with multi-parameter sorting, atmospheric filters, and comparison selection.
                </p>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-lg bg-[#191A1D] text-[#A7B4C4] hover:text-white border border-[#303741]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <MasterComparisonTable
                data={ALL_EXPERIMENTS}
                selectedForCompare={selectedForCompare}
                onToggleCompare={toggleCompare}
              />
            </div>
          </div>
        </div>
      )}

      {/* Coverage Gap Heatmap Modal */}
      {activeModal === "coverage" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141A22] border border-[#303741] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#303741] flex items-center justify-between bg-[#0E1217]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-[#5CB59B]" />
                  NASA Indexed Evidence Coverage &amp; Gap Matrix
                </h2>
                <p className="text-xs text-[#A7B4C4]">
                  Binned across cabin atmospheric regimes (Standard Cabin vs Exploration Atmosphere) and ventilation speeds.
                </p>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-lg bg-[#191A1D] text-[#A7B4C4] hover:text-white border border-[#303741]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <GapMatrix experiments={ALL_EXPERIMENTS} />
            </div>
          </div>
        </div>
      )}

      {/* Peer-Reviewed Papers Library Modal */}
      {activeModal === "papers" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141A22] border border-[#303741] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#303741] flex items-center justify-between bg-[#0E1217]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#78A9D8]" />
                  Peer-Reviewed NASA Combustion Papers &amp; Technical Reports
                </h2>
                <p className="text-xs text-[#A7B4C4]">
                  Authentic literature from Combustion and Flame, Fire Safety Journal, and NASA NTRS.
                </p>
              </div>
              <button
                onClick={() => setActiveModal("none")}
                className="p-1.5 rounded-lg bg-[#191A1D] text-[#A7B4C4] hover:text-white border border-[#303741]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <ResearchPapersList />
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Compare Modal */}
      {activeModal === "compare" && (
        <CompareModal
          exp1={compareExp1}
          exp2={compareExp2}
          onClose={() => setActiveModal("none")}
        />
      )}
    </div>
  );
}
