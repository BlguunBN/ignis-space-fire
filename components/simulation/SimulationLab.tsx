"use client";

import React, { useState, useMemo } from "react";
import simulationCasesData from "@/data/simulation-cases.json";
import { SimulationCase, SimulationMode } from "@/types/simulation";
import { evaluateD2Simulation } from "@/lib/simulationEngine";
import { ModeBadge } from "@/components/simulation/ModeBadge";
import { StatusDot } from "@/components/simulation/StatusDot";
import { D2Chart } from "@/components/simulation/D2Chart";
import { ReplayViewer } from "@/components/simulation/ReplayViewer";
import { ConceptFlameCanvas } from "@/components/simulation/ConceptFlameCanvas";
import { ExternalDemoEmbed } from "@/components/simulation/ExternalDemoEmbed";
import { SolidFuelScenarioExplorer } from "@/components/simulation/SolidFuelScenarioExplorer";
import {
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Flame,
  Layers,
  Sparkles,
  Cpu,
  Video,
  Globe,
  Lock,
} from "lucide-react";

export function SimulationLab() {
  const cases = simulationCasesData as SimulationCase[];

  // Selected case state
  const [selectedCaseId, setSelectedCaseId] = useState<string>("flex-droplet-psi69");

  // Active view tab inside Simulation Lab
  const [activeViewMode, setActiveViewMode] = useState<
    "case_engine" | "solid_fuel_explorer" | "external_demo"
  >("case_engine");

  // Calibrated model dynamic parameters (for FLEX droplet d² model)
  const [d0, setD0] = useState<number>(3.0);
  const [k, setK] = useState<number>(0.76);

  // Conceptual model parameters
  const [conceptGravity, setConceptGravity] = useState<number>(0);
  const [conceptFlow, setConceptFlow] = useState<number>(5.0);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.caseId === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  // Reset parameters when case changes
  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    const targetCase = cases.find((c) => c.caseId === caseId);
    if (targetCase?.calibration) {
      setD0(targetCase.calibration.initial_d0_mm ?? 3.0);
      setK(targetCase.calibration.fitted_k_mm2_s ?? 0.76);
    }
    if (targetCase?.mode === "external_demo") {
      setActiveViewMode("external_demo");
    } else {
      setActiveViewMode("case_engine");
    }
  };

  // Reset to calibrated defaults
  const handleResetToBaseline = () => {
    if (activeCase.calibration) {
      setD0(activeCase.calibration.initial_d0_mm ?? 3.0);
      setK(activeCase.calibration.fitted_k_mm2_s ?? 0.76);
    }
    setConceptGravity(0);
    setConceptFlow(5.0);
  };

  // Run d² physics simulation calculation
  const simResult = useMemo(() => {
    if (activeCase.mode === "calibrated_model") {
      return evaluateD2Simulation(
        activeCase.measurementSeries,
        d0,
        k,
        activeCase.calibration
      );
    }
    return null;
  }, [activeCase, d0, k]);

  return (
    <div className="space-y-6">
      {/* Top Application Header (60-70px Midday styled) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-[#111214] border border-[#303134] rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-[#F3F2EF] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#DDA36B]" />
              Simulation Lab
            </h1>
            <ModeBadge mode={activeCase.mode} />
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#191A1D] text-[#9EA2A7] border border-[#303134]">
              {activeCase.programme} · {activeCase.citation.psiId || "NASA Investigation"}
            </span>
          </div>
          <p className="text-xs text-[#9EA2A7]">
            Source-traceable simulation engine combining authentic NASA microgravity observations, bounded d² regression, and conceptual physics.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#191A1D] p-1 rounded-lg border border-[#303134] text-xs">
          <button
            type="button"
            onClick={() => setActiveViewMode("case_engine")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeViewMode === "case_engine"
                ? "bg-[#DDA36B] text-black"
                : "text-[#9EA2A7] hover:text-[#F3F2EF]"
            }`}
          >
            Investigation Cases
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode("solid_fuel_explorer")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeViewMode === "solid_fuel_explorer"
                ? "bg-[#DDA36B] text-black"
                : "text-[#9EA2A7] hover:text-[#F3F2EF]"
            }`}
          >
            Solid Fuel Evidence Lab
          </button>
          <button
            type="button"
            onClick={() => setActiveViewMode("external_demo")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeViewMode === "external_demo"
                ? "bg-[#DDA36B] text-black"
                : "text-[#9EA2A7] hover:text-[#F3F2EF]"
            }`}
          >
            MySimulator 3D
          </button>
        </div>
      </div>

      {/* Case Navigator Bar (when in case engine mode) */}
      {activeViewMode === "case_engine" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[#9EA2A7] font-medium shrink-0 px-1">Case Studies:</span>
          {cases.map((c) => {
            const isSelected = selectedCaseId === c.caseId;
            return (
              <button
                key={c.caseId}
                type="button"
                onClick={() => handleCaseSelect(c.caseId)}
                className={`shrink-0 px-3 py-2 rounded-lg border flex items-center gap-2 transition-all ${
                  isSelected
                    ? "bg-[#191A1D] border-[#DDA36B] text-[#F3F2EF] font-medium shadow-sm"
                    : "bg-[#111214] border-[#303134] text-[#9EA2A7] hover:border-[#4B5563] hover:text-[#F3F2EF]"
                }`}
              >
                {c.mode === "calibrated_model" && <Cpu className="w-3.5 h-3.5 text-blue-400" />}
                {c.mode === "observed" && <Video className="w-3.5 h-3.5 text-emerald-400" />}
                {c.mode === "conceptual" && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                {c.mode === "external_demo" && <Globe className="w-3.5 h-3.5 text-purple-400" />}
                <span>{c.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace Display */}
      {activeViewMode === "solid_fuel_explorer" ? (
        <SolidFuelScenarioExplorer />
      ) : activeViewMode === "external_demo" ? (
        <ExternalDemoEmbed
          initialUrl={activeCase.externalEmbedUrl}
          title="MySimulator Spacecraft Fire Safety Interactive Demo"
        />
      ) : (
        /* Case Engine View (Desktop Split: Center 60% Visual, Right 40% Inspector) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Center Visual Pane (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {activeCase.mode === "calibrated_model" && simResult && (
                <div className="space-y-4">
                  <D2Chart
                    timeSeries={simResult.timeSeries}
                    calibration={activeCase.calibration}
                    burnoutTime={simResult.burnoutTime_sec}
                    rmse={simResult.rmse}
                    mae={simResult.mae}
                    d0={d0}
                    k={k}
                  />
                </div>
              )}

              {activeCase.mode === "observed" && (
                <ReplayViewer
                  framesPattern={activeCase.sourceMedia?.framesPattern}
                  frameCount={activeCase.sourceMedia?.frameCount}
                  intervalSeconds={activeCase.sourceMedia?.intervalSeconds}
                  staticPath={activeCase.sourceMedia?.localPath}
                  schematicPath={activeCase.sourceMedia?.schematicPath}
                  title={activeCase.title}
                  caption={
                    activeCase.sourceMedia?.caption ||
                    activeCase.investigation
                  }
                  nasaCredit={
                    activeCase.sourceMedia?.nasaCredit ||
                    "NASA Glenn Research Center"
                  }
                  sourceUrl={activeCase.citation.url}
                  measurementSeries={activeCase.measurementSeries}
                />
              )}

              {activeCase.mode === "conceptual" && (
                <ConceptFlameCanvas
                  gravityMode={conceptGravity}
                  airflowCmS={conceptFlow}
                  onToggleGravity={setConceptGravity}
                  onAirflowChange={setConceptFlow}
                />
              )}

              {activeCase.mode === "external_demo" && (
                <ExternalDemoEmbed
                  initialUrl={activeCase.externalEmbedUrl}
                  title={activeCase.title}
                />
              )}
            </div>

            {/* Right Inspector & Controls Pane (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 bg-[#111214] border border-[#303134] rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#303134]">
                  <div>
                    <h3 className="text-xs font-semibold text-[#F3F2EF] uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#DDA36B]" />
                      Conditions & Model Inspector
                    </h3>
                    <span className="text-[11px] text-[#9EA2A7]">
                      {activeCase.mode === "calibrated_model"
                        ? "Interactive d² model parameters"
                        : "Verified NASA flight conditions"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToBaseline}
                    className="p-1.5 rounded hover:bg-[#191A1D] text-[#9EA2A7] hover:text-[#F3F2EF]"
                    title="Reset parameters to baseline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Calibrated Model Sliders (when in calibrated_model mode) */}
                {activeCase.mode === "calibrated_model" ? (
                  <div className="space-y-4">
                    {/* Initial Diameter Slider */}
                    <div className="p-3 bg-[#191A1D] border border-[#303134] rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[#F3F2EF]">
                          Initial Droplet Diameter (D₀)
                        </span>
                        <span className="font-mono text-[#DDA36B] font-semibold">
                          {d0.toFixed(2)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1.5}
                        max={4.5}
                        step={0.1}
                        value={d0}
                        onChange={(e) => setD0(Number(e.target.value))}
                        className="w-full accent-[#DDA36B]"
                      />
                      <div className="flex items-center justify-between text-[10px]">
                        <StatusDot status="measured" label="NASA Flight Size" />
                        <span className="text-[#9EA2A7] font-mono">1.5 - 4.5 mm</span>
                      </div>
                    </div>

                    {/* Burning Rate Constant K Slider */}
                    <div className="p-3 bg-[#191A1D] border border-[#303134] rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-[#F3F2EF]">
                          Burning Rate Constant (K)
                        </span>
                        <span className="font-mono text-blue-400 font-semibold">
                          {k.toFixed(2)} mm²/s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={1.1}
                        step={0.02}
                        value={k}
                        onChange={(e) => setK(Number(e.target.value))}
                        className="w-full accent-blue-400"
                      />
                      <div className="flex items-center justify-between text-[10px]">
                        <StatusDot status="fitted" label="OLS Fitted Slope" />
                        <span className="text-[#9EA2A7] font-mono">Baseline: 0.76 mm²/s</span>
                      </div>
                    </div>

                    {/* Scientific Validation Domain Alert */}
                    {simResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                          simResult.isWithinDomain
                            ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-300"
                            : "bg-amber-950/40 border-amber-900/60 text-amber-300"
                        }`}
                      >
                        {simResult.isWithinDomain ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-semibold block">
                            {simResult.isWithinDomain ? "Within Calibration Window" : "Out-of-Domain Notice"}
                          </span>
                          <p className="text-[11px] mt-0.5">{simResult.validDomainMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Experimental Boundary Matrix (Fixed / Locked Conditions) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[#9EA2A7] uppercase tracking-wider block">
                    Fixed Experimental Boundary
                  </span>

                  <div className="space-y-1.5 text-xs">
                    {/* Gravity */}
                    <div className="p-2.5 rounded bg-[#191A1D] border border-[#303134] flex items-center justify-between">
                      <div>
                        <span className="text-[#9EA2A7] block text-[10px]">Gravitational Regime</span>
                        <span className="font-mono font-medium text-[#F3F2EF]">
                          {activeCase.observedConditions.gravity_g}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <StatusDot status="measured" label="0g Flight" />
                      </div>
                    </div>

                    {/* Oxygen */}
                    <div className="p-2.5 rounded bg-[#191A1D] border border-[#303134] flex items-center justify-between">
                      <div>
                        <span className="text-[#9EA2A7] block text-[10px]">Oxygen Fraction</span>
                        <span className="font-mono font-medium text-[#F3F2EF]">
                          {activeCase.observedConditions.oxygen_pct !== null
                            ? `${activeCase.observedConditions.oxygen_pct}%`
                            : "Not reported"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <StatusDot status="measured" />
                      </div>
                    </div>

                    {/* Pressure */}
                    <div className="p-2.5 rounded bg-[#191A1D] border border-[#303134] flex items-center justify-between">
                      <div>
                        <span className="text-[#9EA2A7] block text-[10px]">Atmospheric Pressure</span>
                        <span className="font-mono font-medium text-[#F3F2EF]">
                          {activeCase.observedConditions.pressure_kpa !== null
                            ? `${activeCase.observedConditions.pressure_kpa} kPa`
                            : "Not reported"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <StatusDot status="measured" />
                      </div>
                    </div>

                    {/* Forced Airflow */}
                    <div className="p-2.5 rounded bg-[#191A1D] border border-[#303134] flex items-center justify-between">
                      <div>
                        <span className="text-[#9EA2A7] block text-[10px]">Forced Airflow</span>
                        <span className="font-mono font-medium text-[#F3F2EF]">
                          {activeCase.observedConditions.airflow_cm_s !== null
                            ? `${activeCase.observedConditions.airflow_cm_s} cm/s`
                            : "Not reported"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <StatusDot status="measured" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grounding rule reminder */}
                <div className="flex items-start gap-2 p-2.5 rounded bg-[#191A1D] text-[11px] text-[#9EA2A7]">
                  <ShieldAlert className="w-4 h-4 text-[#DDA36B] shrink-0 mt-0.5" />
                  <p>
                    <strong>Integrity Guardrail:</strong> Conditions with status <em>Measured</em> cannot be arbitrarily modified in calibrated mode. Altering oxygen or gravity without multi-point calibration is locked to prevent speculative hazard scores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Analytical Deck (Conclusions & Provenance) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Lower-left: What Can Be Concluded? */}
            <div className="p-4 bg-[#111214] border border-[#303134] rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-[#F3F2EF] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                What Can Be Concluded?
              </h3>

              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <span className="text-emerald-400 font-semibold block">
                    ✓ Validated Scientific Insights
                  </span>
                  <ul className="space-y-1 text-[#F3F2EF] pl-3 list-disc list-outside text-[11px]">
                    {activeCase.conclusions.allowed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#303134]">
                  <span className="text-amber-400 font-semibold block">
                    ⚠ Disallowed Extrapolations & Bounds
                  </span>
                  <ul className="space-y-1 text-[#9EA2A7] pl-3 list-disc list-outside text-[11px]">
                    {activeCase.conclusions.disallowed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Lower-right: NASA Provenance & Source Citation */}
            <div className="p-4 bg-[#111214] border border-[#303134] rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-[#F3F2EF] uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#DDA36B]" />
                NASA Provenance & Citation
              </h3>

              <div className="p-3 rounded-lg bg-[#191A1D] border border-[#303134] text-xs space-y-1.5 font-mono">
                <div className="text-[#F3F2EF] font-semibold">
                  {activeCase.citation.title}
                </div>
                {activeCase.citation.authors && (
                  <div className="text-[11px] text-[#9EA2A7]">
                    Authors: {activeCase.citation.authors} ({activeCase.citation.year})
                  </div>
                )}
                <div className="text-[11px] text-[#DDA36B]">
                  Locator: {activeCase.citation.sourceLocator}
                </div>
                {activeCase.citation.psiId && (
                  <div className="text-[11px] text-emerald-400">
                    NASA PSI Repository ID: {activeCase.citation.psiId}
                  </div>
                )}
                {activeCase.citation.doi && (
                  <div className="text-[11px] text-blue-400">
                    DOI: {activeCase.citation.doi}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#9EA2A7]">
                  Verified NASA Physical Science Record
                </span>
                <a
                  href={activeCase.citation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded bg-[#191A1D] hover:bg-[#23262A] text-[#DDA36B] border border-[#303134] flex items-center gap-1.5 font-medium transition-colors"
                >
                  <span>Open Primary Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
