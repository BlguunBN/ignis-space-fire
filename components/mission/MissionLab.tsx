"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { ImgComparisonSlider } from "@img-comparison-slider/react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ImageInspector } from "@/components/experiment/ImageInspector";
import { ResearchPapersList } from "@/components/papers/ResearchPapersList";
import { ExperimentRecord } from "@/types/evidence";
import defaultExperiments from "@/data/experiments.json";
import visualizationsData from "@/data/visualizations.json";
import { sourceReviewedRecords } from "@/lib/sourceReviewedRecords";
import { VisualExperimentPackage } from "@/types/visualization";
import {
  BookOpen,
  Orbit,
  ExternalLink,
  ShieldAlert,
  Flame,
  Layers,
  Activity,
  Sliders,
} from "lucide-react";

interface MissionLabProps {
  experiments?: ExperimentRecord[];
  initialExpId?: string;
}

export function MissionLab({
  experiments,
  initialExpId = "sofie-gel",
}: MissionLabProps) {
  const records = useMemo(() => {
    return experiments || sourceReviewedRecords(defaultExperiments as ExperimentRecord[]);
  }, [experiments]);

  const visualPackages = visualizationsData as VisualExperimentPackage[];

  const [selectedExpId, setSelectedExpId] = useState<string>(initialExpId);
  const [activeStep, setActiveStep] = useState<number>(0);

  const selectedExp = useMemo(() => {
    return records.find((e) => e.id === selectedExpId) || records[0];
  }, [records, selectedExpId]);

  const activeVisualPackage = useMemo(() => {
    return visualPackages.find((p) => p.experimentId === selectedExp.id);
  }, [visualPackages, selectedExp.id]);

  // Dynamic 5-step investigation path for the selected experiment
  const steps = useMemo(() => {
    const number = (v: number | null | undefined, unit: string) =>
      v == null ? "Not reported" : `${v} ${unit}`;

    return [
      {
        title: "Research Context",
        badge: "01. Objective",
        text: `${selectedExp.programme} investigation (${selectedExp.investigation}) addresses spacecraft fire safety by quantifying combustion physics without buoyancy-driven convection.`,
      },
      {
        title: "Platform & Hardware",
        badge: "02. Configuration",
        text: `Conducted on ${selectedExp.platform}. Material tested: ${selectedExp.material} (${selectedExp.material_class.replaceAll("_", " ")}). Environment: Forced airflow ${number(selectedExp.airflow_cm_s, "cm/s")}, Oxygen ${number(selectedExp.oxygen_pct, "%")}, Pressure ${number(selectedExp.pressure_kpa, "kPa")}.`,
      },
      {
        title: "Flight Observation",
        badge: "03. Telemetry & Spread",
        text: `${selectedExp.finding} Monitored parameters: ${selectedExp.measurements.join(", ").replaceAll("_", " ")}.`,
      },
      {
        title: "Safety Limits & Boundaries",
        badge: "04. Domain Cautions",
        text: `NASA Caution: ${selectedExp.limitations.join(" ")} Fire Safety Impact: ${selectedExp.fire_safety_relevance}`,
      },
      {
        title: "NASA Primary Provenance",
        badge: "05. Citation",
        text: `Verified by ${selectedExp.verified_by || "NASA GRC"}. Source locator: ${selectedExp.source_locator || "NASA PSI repository"}.`,
      },
    ];
  }, [selectedExp]);

  // Reset active step when experiment changes
  useEffect(() => {
    setActiveStep(0);
  }, [selectedExpId]);

  const nodes = useMemo(() => {
    return steps.map((s, i) => ({
      id: String(i),
      position: { x: i * 200, y: 30 },
      data: { label: s.title },
      draggable: false,
    }));
  }, [steps]);

  const edges = useMemo(() => {
    return steps.slice(1).map((_, i) => ({
      id: `${i}-${i + 1}`,
      source: String(i),
      target: String(i + 1),
      animated: true,
    }));
  }, [steps]);

  // Markdown outline for markmap
  const outline = useMemo(() => {
    return `# ${selectedExp.investigation} (${selectedExp.programme})
## Platform & Material
- Platform: ${selectedExp.platform}
- Material: ${selectedExp.material}
## Conditions
- Oxygen: ${selectedExp.oxygen_pct ?? "Not reported"}%
- Airflow: ${selectedExp.airflow_cm_s ?? "Not reported"} cm/s
- Pressure: ${selectedExp.pressure_kpa ?? "Not reported"} kPa
## Key Finding
- ${selectedExp.finding}
## Limitations
- ${selectedExp.limitations.join("\n- ")}
## Source
- [NASA Source Record](${selectedExp.source_url})`;
  }, [selectedExp]);

  // Mindmap Container
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let element: HTMLElement | undefined;
    import("@markmap/element")
      .then(() => {
        if (!active || !container.current) return;
        container.current.innerHTML = "";
        element = document.createElement("markmap-view");
        element.setAttribute("theme", "minimal");
        element.setAttribute("color-scheme", "dark");
        element.setAttribute("toolbar", "");
        element.style.height = "320px";
        (element as HTMLElement & { markdown: string }).markdown = outline;
        container.current.appendChild(element);
      })
      .catch(() => {});
    return () => {
      active = false;
      element?.remove();
    };
  }, [outline]);

  const verifiedAsset = activeVisualPackage?.assets.find(
    (a) => a.experimentId === selectedExp.id && a.localPath
  );

  return (
    <div className="space-y-6">
      {/* Header with Multi-Experiment Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#191A1D] border border-[#303134] rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Orbit className="w-5 h-5 text-[#DDA36B]" />
            <h1 className="text-2xl font-bold text-[#F3F2EF]">Mission Lab</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#111214] border border-[#303134] text-[#DDA36B] font-mono">
              {records.length} Investigations Available
            </span>
          </div>
          <p className="text-xs text-[#9EA2A7] mt-1">
            Explore flight footage, telemetry apparatus diagrams, and mission research across all indexed NASA microgravity investigations.
          </p>
        </div>

        {/* Experiment Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#9EA2A7] flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#DDA36B]" />
            <span>Select Investigation:</span>
            <select
              aria-label="Select active mission experiment"
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="bg-[#111214] border border-[#303134] text-[#F3F2EF] rounded-xl px-3 py-2 text-xs font-medium outline-none cursor-pointer max-w-[280px] sm:max-w-[340px]"
            >
              {records.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.programme}: {exp.investigation}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Investigation Details Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-3 py-1 rounded-lg bg-[#111214] border border-[#303134] text-[#F3F2EF]">
          <strong>Programme:</strong> {selectedExp.programme}
        </span>
        <span className="px-3 py-1 rounded-lg bg-[#111214] border border-[#303134] text-[#F3F2EF]">
          <strong>Platform:</strong> {selectedExp.platform}
        </span>
        <span className="px-3 py-1 rounded-lg bg-[#111214] border border-[#303134] text-[#F3F2EF]">
          <strong>Fuel:</strong> {selectedExp.material}
        </span>
        <span className="px-3 py-1 rounded-lg bg-[#111214] border border-[#303134] text-[#DDA36B]">
          <strong>Status:</strong> {selectedExp.verification_status.toUpperCase()}
        </span>
      </div>

      {/* Primary Visual Media / Telemetry Section */}
      {selectedExp.id === "sofie-gel" ? (
        /* Specialized Visual Suite for SoFIE-GEL / RTDFS */
        <div className="grid xl:grid-cols-2 gap-4">
          <section className="studio-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">NASA 24-Frame Flight Montage Inspector</h2>
              <span className="text-[10px] text-[#9EA2A7]">Zoom & Pan</span>
            </div>
            <ImageInspector
              src="/nasa/rtdfs/nasa-montage.png"
              alt="NASA montage of thin fabric burning in microgravity"
            />
            <p className="text-xs text-[#9EA2A7]">
              Original NASA flight montage; NASA states images are 0.2 seconds apart.{" "}
              <a
                href={selectedExp.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#DDA36B] hover:underline"
              >
                NASA source ↗
              </a>
            </p>
          </section>

          <section className="studio-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Compare Flame Montage Tiles</h2>
              <span className="text-[10px] text-[#9EA2A7]">Split-Slider</span>
            </div>
            <p className="text-xs text-[#9EA2A7]">
              Two crops from the top row of the NASA flight montage. Observe flame boundary luminosity shifts during the 0.2s pulse.
            </p>
            <ImgComparisonSlider
              className="w-full rounded-lg overflow-hidden border border-[#303134]"
              aria-label="Compare two NASA montage tiles"
            >
              <img
                slot="first"
                src="/nasa/rtdfs/tile-1.png"
                alt="First tile in the top row of NASA's thin-fabric montage"
                style={{ width: "100%" }}
              />
              <img
                slot="second"
                src="/nasa/rtdfs/tile-2.png"
                alt="Second tile in the top row of NASA's thin-fabric montage"
                style={{ width: "100%" }}
              />
            </ImgComparisonSlider>
            <p className="text-xs text-[#9EA2A7]">
              Crops: original 1920 × 1080 montage, top row. NASA credit.{" "}
              <a
                href={selectedExp.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#DDA36B] hover:underline"
              >
                Original image and caption ↗
              </a>
            </p>
          </section>
        </div>
      ) : verifiedAsset?.localPath ? (
        /* Visual Apparatus Schematic for Saffire or BASS */
        <div className="grid xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 studio-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{verifiedAsset.title}</h2>
              <span className="text-[10px] text-[#DDA36B] font-mono">
                {verifiedAsset.representation.toUpperCase()}
              </span>
            </div>
            <div className="bg-black rounded-xl p-2 border border-[#303134]">
              <img
                src={verifiedAsset.localPath}
                alt={verifiedAsset.title}
                className="w-full h-80 object-contain rounded-lg"
              />
            </div>
            <p className="text-xs text-[#9EA2A7]">
              {verifiedAsset.processingNotes} · {verifiedAsset.nasaCredit} ·{" "}
              <a
                href={verifiedAsset.locator.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#DDA36B] hover:underline"
              >
                Inspect NASA record ↗
              </a>
            </p>
          </section>

          <section className="xl:col-span-4 studio-panel p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b border-[#303134] pb-2 text-[#F3F2EF]">
                Flight Investigation Telemetry
              </h3>
              <p className="text-xs text-[#d3d2cf] leading-relaxed">
                {selectedExp.finding}
              </p>
              <div className="p-3 bg-[#0B0C0E] rounded-xl border border-[#303134] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#9EA2A7]">Oxygen Level:</span>
                  <span className="font-mono text-[#F3F2EF]">
                    {selectedExp.oxygen_pct != null ? `${selectedExp.oxygen_pct}%` : "Not reported"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9EA2A7]">Forced Airflow:</span>
                  <span className="font-mono text-[#F3F2EF]">
                    {selectedExp.airflow_cm_s != null ? `${selectedExp.airflow_cm_s} cm/s` : "Quiescent"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9EA2A7]">Chamber Pressure:</span>
                  <span className="font-mono text-[#F3F2EF]">
                    {selectedExp.pressure_kpa != null ? `${selectedExp.pressure_kpa} kPa` : "Not reported"}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={selectedExp.source_url}
              target="_blank"
              rel="noreferrer"
              className="studio-link w-full justify-center text-xs"
            >
              Open Full NASA Investigation Data <ExternalLink size={12} className="ml-1" />
            </a>
          </section>
        </div>
      ) : (
        /* Sensor Telemetry Run */
        <div className="studio-panel p-6 flex flex-col items-center justify-center text-center space-y-3 border border-[#303134]">
          <Activity className="w-8 h-8 text-[#DDA36B]" />
          <h2 className="text-base font-semibold text-[#F3F2EF]">
            Sensor-Instrumented Flight Investigation
          </h2>
          <p className="text-xs text-[#9EA2A7] max-w-lg leading-relaxed">
            NASA documented this run through radiometers, thermocouple arrays, and gas sensors. Telemetry curves and numerical tables are available in the primary technical paper.
          </p>
          <a
            href={selectedExp.source_url}
            target="_blank"
            rel="noreferrer"
            className="studio-link text-xs mt-2"
          >
            Access Primary NASA Telemetry Report <ExternalLink size={12} className="ml-1" />
          </a>
        </div>
      )}

      {/* Dynamic ReactFlow Investigation Path */}
      <section className="studio-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#DDA36B]" />
              Investigation Path: {selectedExp.investigation}
            </h2>
            <p className="text-xs text-[#9EA2A7] mt-0.5">
              Select any step to view its verified scientific context and methodology.
            </p>
          </div>
          <span className="text-xs font-mono text-[#DDA36B]">
            Step {activeStep + 1} of {steps.length}
          </span>
        </div>

        <div className="h-56 mt-2 border border-[#303134] rounded-xl overflow-hidden" aria-label="Investigation path diagram">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setActiveStep(Number(node.id))}
            nodesConnectable={false}
            nodesDraggable={false}
            fitView
            colorMode="dark"
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {steps.map((s, i) => (
            <button
              key={s.title}
              className={`studio-link text-xs ${
                activeStep === i ? "bg-[#29231f] text-[#F3F2EF] border-[#DDA36B]" : ""
              }`}
              aria-pressed={activeStep === i}
              onClick={() => setActiveStep(i)}
            >
              {s.badge}: {s.title}
            </button>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#111214] border border-[#303134] mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#DDA36B] uppercase">
              {steps[activeStep].badge}
            </span>
            <a
              className="text-[#DDA36B] text-xs inline-flex items-center gap-1 hover:underline"
              href={selectedExp.source_url}
              target="_blank"
              rel="noreferrer"
            >
              NASA source <ExternalLink size={11} />
            </a>
          </div>
          <p className="text-xs text-[#F3F2EF] leading-relaxed">
            {steps[activeStep].text}
          </p>
        </div>
      </section>

      {/* Dynamic Navigable Source Mindmap */}
      <section className="studio-panel p-5">
        <h2 className="font-semibold text-base">NASA Source Architecture Map</h2>
        <p className="text-xs text-[#9EA2A7] mt-1 mb-3">
          Interactive outline for {selectedExp.investigation}. Expand nodes to explore variables, equipment, and limitations.
        </p>
        <div ref={container} />
      </section>

      {/* All Research Papers Section */}
      <section className="space-y-4 pt-4 border-t border-[#303134]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-[#DDA36B]" />
              NASA Mission Research Papers & Publications
            </h2>
            <p className="text-xs text-[#9EA2A7] mt-1">
              All 12 peer-reviewed scientific papers and NASA Technical Reports Server (NTRS) records.
            </p>
          </div>
        </div>
        <ResearchPapersList />
      </section>
    </div>
  );
}
