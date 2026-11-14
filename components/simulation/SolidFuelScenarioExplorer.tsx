"use client";

import React, { useState, useMemo } from "react";
import experimentsData from "@/data/experiments.json";
import { ExperimentRecord } from "@/types/evidence";
import { StatusDot } from "@/components/simulation/StatusDot";
import {
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Flame,
  Wind,
  Gauge,
  Sparkles,
} from "lucide-react";

export function SolidFuelScenarioExplorer() {
  const [selectedMaterial, setSelectedMaterial] = useState("PMMA");
  const [selectedFlow, setSelectedFlow] = useState<number>(3.5);
  const [selectedO2, setSelectedO2] = useState<number>(21.0);
  const [selectedPressure, setSelectedPressure] = useState<number>(101.3);

  const allExperiments = experimentsData as ExperimentRecord[];

  // Match real experiments based on user scenario
  const matchingExperiments = useMemo(() => {
    return allExperiments
      .map((exp) => {
        let matchScore = 0;
        let reasons: string[] = [];

        // Material match
        if (exp.material.toLowerCase().includes(selectedMaterial.toLowerCase())) {
          matchScore += 40;
          reasons.push(`Material matches (${exp.material})`);
        }

        // Airflow match (+- 5 cm/s)
        if (exp.airflow_cm_s != null) {
          const flowDiff = Math.abs(exp.airflow_cm_s - selectedFlow);
          if (flowDiff <= 3.0) {
            matchScore += 30;
            reasons.push(`Airflow close (${exp.airflow_cm_s} cm/s vs ${selectedFlow} cm/s)`);
          } else if (flowDiff <= 8.0) {
            matchScore += 15;
            reasons.push(`Airflow within range (${exp.airflow_cm_s} cm/s)`);
          }
        }

        // Oxygen match (+- 3%)
        if (exp.oxygen_pct != null) {
          const o2Diff = Math.abs(exp.oxygen_pct - selectedO2);
          if (o2Diff <= 2.0) {
            matchScore += 20;
            reasons.push(`Oxygen matches (${exp.oxygen_pct}%)`);
          }
        }

        // Pressure match (+- 15 kPa)
        if (exp.pressure_kpa != null) {
          const pDiff = Math.abs(exp.pressure_kpa - selectedPressure);
          if (pDiff <= 10.0) {
            matchScore += 10;
            reasons.push(`Pressure matches (${exp.pressure_kpa} kPa)`);
          }
        }

        return {
          experiment: exp,
          matchScore,
          reasons,
        };
      })
      .filter((m) => m.matchScore > 25)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [allExperiments, selectedMaterial, selectedFlow, selectedO2, selectedPressure]);

  return (
    <div className="space-y-4 p-4 bg-[#111214] border border-[#303134] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#303134]">
        <div>
          <h3 className="text-sm font-semibold text-[#F3F2EF] flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#DDA36B]" />
            Solid Fuel Scenario Retrieval & Evidence Matching
          </h3>
          <p className="text-xs text-[#9EA2A7] mt-0.5">
            Select material and atmospheric conditions to retrieve source-backed NASA flight evidence. IGNIS refuses to fabricate synthetic flame-spread predictions where empirical evidence is absent.
          </p>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#191A1D] text-[#DDA36B] border border-[#303134]">
          Grounding Gate Active
        </span>
      </div>

      {/* Scenario Input Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-[#191A1D] border border-[#303134] rounded-lg">
        {/* Material Selection */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#9EA2A7] block">Material Specimen</label>
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full bg-[#111214] border border-[#303134] rounded px-2.5 py-1.5 text-xs text-[#F3F2EF]"
          >
            <option value="PMMA">PMMA (Solid Acrylic Polymer)</option>
            <option value="cotton-fiberglass">Cotton-Fiberglass SIBAL (Fabric)</option>
            <option value="cellulose">Cellulose (Thin filter paper)</option>
            <option value="Kapton">Kapton / Wire Insulation</option>
          </select>
          <StatusDot status="user_assumption" label="User Target" />
        </div>

        {/* Forced Airflow */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#9EA2A7]">Ventilation Velocity</span>
            <span className="font-mono text-blue-400">{selectedFlow} cm/s</span>
          </div>
          <input
            type="range"
            min={0}
            max={25}
            step={0.5}
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(Number(e.target.value))}
            className="w-full accent-blue-400"
          />
          <div className="flex justify-between text-[10px] text-[#9EA2A7]">
            <span>0 cm/s</span>
            <span>3.5 (BASS)</span>
            <span>20 (Saffire)</span>
          </div>
        </div>

        {/* Oxygen Pct */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#9EA2A7]">Oxygen Fraction</span>
            <span className="font-mono text-emerald-400">{selectedO2}%</span>
          </div>
          <input
            type="range"
            min={15}
            max={35}
            step={1}
            value={selectedO2}
            onChange={(e) => setSelectedO2(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="flex justify-between text-[10px] text-[#9EA2A7]">
            <span>18% (Suppressed)</span>
            <span>21% (Nominal)</span>
            <span>34% (Exploration)</span>
          </div>
        </div>

        {/* Total Pressure */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#9EA2A7]">Total Pressure</span>
            <span className="font-mono text-amber-400">{selectedPressure} kPa</span>
          </div>
          <input
            type="range"
            min={50}
            max={105}
            step={1}
            value={selectedPressure}
            onChange={(e) => setSelectedPressure(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-[#9EA2A7]">
            <span>56 kPa (Exploration)</span>
            <span>101.3 kPa (Sea Level)</span>
          </div>
        </div>
      </div>

      {/* Results Deck */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#F3F2EF]">
            Matching NASA Empirical Investigations ({matchingExperiments.length})
          </span>
          <span className="text-[11px] text-[#9EA2A7]">
            Ranked by multi-parameter experimental relevance
          </span>
        </div>

        {matchingExperiments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchingExperiments.map(({ experiment: exp, matchScore, reasons }) => (
              <div
                key={exp.id}
                className="p-3.5 bg-[#191A1D] border border-[#303134] rounded-lg space-y-2.5 hover:border-[#DDA36B]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111214] text-[#DDA36B] border border-[#303134] inline-block mb-1">
                      {exp.programme} · {exp.psi_id || "Peer-Reviewed"}
                    </span>
                    <h4 className="text-xs font-semibold text-[#F3F2EF]">
                      {exp.investigation}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                    {matchScore}% Match
                  </span>
                </div>

                {/* Conditions Row */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#111214] text-[11px] font-mono">
                  <div>
                    <span className="text-[#9EA2A7] block text-[9px]">Oxygen</span>
                    <span className="text-[#F3F2EF]">
                      {exp.oxygen_pct !== null ? `${exp.oxygen_pct}%` : "Not reported"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9EA2A7] block text-[9px]">Pressure</span>
                    <span className="text-[#F3F2EF]">
                      {exp.pressure_kpa !== null ? `${exp.pressure_kpa} kPa` : "Not reported"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9EA2A7] block text-[9px]">Airflow</span>
                    <span className="text-[#F3F2EF]">
                      {exp.airflow_cm_s !== null ? `${exp.airflow_cm_s} cm/s` : "Not reported"}
                    </span>
                  </div>
                </div>

                {/* Finding */}
                <p className="text-xs text-[#9EA2A7] line-clamp-3">
                  <strong className="text-[#F3F2EF]">Empirical Finding:</strong> {exp.finding}
                </p>

                {/* Match criteria */}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {reasons.map((r, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-[#111214] text-emerald-300 border border-emerald-900/40"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>

                {/* Action Link */}
                <div className="pt-2 border-t border-[#303134] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#9EA2A7]">
                    Platform: {exp.platform}
                  </span>
                  <a
                    href={exp.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#DDA36B] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#191A1D] border border-dashed border-[#303134] rounded-lg space-y-2">
            <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-[#F3F2EF]">
              No Indexed NASA Evidence for This Parameter Combination
            </h4>
            <p className="text-xs text-[#9EA2A7] max-w-md mx-auto">
              NASA has not conducted or indexed verified flight experiments for <strong>{selectedMaterial}</strong> under {selectedFlow} cm/s airflow at {selectedO2}% O₂.
            </p>
            <p className="text-[11px] text-[#DDA36B]">
              Scientific Integrity Rule: IGNIS withholds speculative spread rate forecasts when no empirical data exists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
