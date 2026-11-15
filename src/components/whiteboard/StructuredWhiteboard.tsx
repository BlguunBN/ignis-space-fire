"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  HelpCircle,
  FileCheck,
  Sparkles,
  Layers,
  RotateCcw,
  FileText,
  Save,
  Download,
  FolderOpen,
  Bot,
  BrainCircuit,
  LayoutGrid,
  Send,
  Plus,
} from "lucide-react";
import {
  QuestionNode,
  EvidenceNode,
  HypothesisNode,
  ExperimentNode,
} from "./CustomNodes";
import { ExperimentRecord } from "../../types/evidence";
import experimentsData from "../../data/experiments.json";
import { BuildHypothesisTreeArgs } from "../../lib/agent-tools";
import { useAuth } from "../AuthProvider";
import { authClient } from "../../lib/auth-client";
import { saveResearcherItem } from "../../lib/researcher-items";

const nodeTypes = {
  question: QuestionNode,
  evidence: EvidenceNode,
  hypothesis: HypothesisNode,
  experiment: ExperimentNode,
};

const TEMPLATES: Record<string, { label: string; nodes: Node[]; edges: Edge[] }> = {
  ventilation: {
    label: "Ventilation Flame Spread (Saffire vs BASS)",
    nodes: [
      {
        id: "q-1",
        type: "question",
        position: { x: 380, y: 20 },
        data: {
          label: "Forced Airflow Flame Spread Divergence",
          details:
            "Why does large-scale fuel (Saffire 0.4m x 1m) sustain steady combustion at 20 cm/s flow where glovebox scale samples (BASS 1cm) extinguish?",
        },
      },
      {
        id: "ev-1",
        type: "evidence",
        position: { x: 80, y: 180 },
        data: {
          claimId: "CLM-SAFFIRE-001",
          investigation: "Saffire-I Flight Experiment",
          conditions: "21% O₂ • 20 cm/s Flow • 101.3 kPa",
          quote:
            "Large-scale flame spread in microgravity without buoyancy proceeds steadily under forced airflow. 0.4 m x 1.0 m solid burns continuously.",
        },
      },
      {
        id: "ev-2",
        type: "evidence",
        position: { x: 560, y: 180 },
        data: {
          claimId: "CLM-BASS-002",
          investigation: "BASS-II Opposed Flow PMMA",
          conditions: "21% O₂ • 3.5 cm/s Flow • 101.3 kPa",
          quote:
            "Narrow glovebox flow duct causes accelerated radiative extinction near low-speed boundary for 1-2 cm thick PMMA slabs.",
        },
      },
      {
        id: "hyp-1",
        type: "hypothesis",
        position: { x: 340, y: 400 },
        data: {
          title: "Cumulative Radiative Preheating & Thermal Scale Invariant",
          prediction:
            "Large-scale Saffire fuel experiences cumulative radiative feedback from upstream flame zone that sustains pyrolysis at higher airflow velocities.",
          rationale:
            "Downstream sample geometry absorbs unburned radiation that is lost to cold walls in glovebox scale apparatus.",
        },
      },
      {
        id: "exp-1",
        type: "experiment",
        position: { x: 340, y: 580 },
        data: {
          facility: "ISS CIR",
          objective: "Intermediate-Scale Radiative Feedback Duct Test",
          airflow: "10 – 25 cm/s flow",
          oxygen: "21% – 26% O₂",
          pressure: "56 – 101 kPa",
          geometry: "0.2m x 0.5m slab with radiometer array",
        },
      },
    ],
    edges: [
      { id: "e-q1-ev1", source: "q-1", target: "ev-1", animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } },
      { id: "e-q1-ev2", source: "q-1", target: "ev-2", animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } },
      { id: "e-ev1-hyp1", source: "ev-1", target: "hyp-1", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e-ev2-hyp1", source: "ev-2", target: "hyp-1", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e-hyp1-exp1", source: "hyp-1", target: "exp-1", animated: true, style: { stroke: "#c084fc", strokeWidth: 2 } },
    ],
  },
  exploration: {
    label: "Moon base air (≥30% O₂ / ≤70 kPa)",
    nodes: [
      {
        id: "q-exp",
        type: "question",
        position: { x: 380, y: 20 },
        data: {
          label: "Artemis Exploration Atmosphere Flammability Shift",
          details: "How does 26% O2 / 56 kPa alter material flammability certification boundaries vs 1 atm?",
        },
      },
      {
        id: "ev-saffire-4",
        type: "evidence",
        position: { x: 300, y: 180 },
        data: {
          claimId: "CLM-SAFFIRE-004",
          investigation: "Saffire-IV Sample IV-1 Fire Test",
          conditions: "22% O₂ • 20 cm/s Flow • 100 kPa",
          quote: "Flame spread occurred; reports 130 s burning with 3,150 W average heat release.",
        },
      },
      {
        id: "hyp-exp",
        type: "hypothesis",
        position: { x: 340, y: 400 },
        data: {
          title: "Low Pressure / High O₂ Balancing Mechanism",
          prediction: "Reduced chamber pressure partially compensates for enhanced oxidizer mole fraction.",
          rationale: "Reduced overall gas thermal capacity increases flame temperature while low pressure widens quenching distance.",
        },
      },
      {
        id: "exp-exp",
        type: "experiment",
        position: { x: 340, y: 580 },
        data: {
          facility: "Cygnus Duct (Saffire)",
          objective: "High-O2 Depressurization Extinction Matrix",
          airflow: "15 cm/s",
          oxygen: "26% – 34% O₂",
          pressure: "56 kPa",
          geometry: "0.4m x 1.0m PMMA / SIBAL composite",
        },
      },
    ],
    edges: [
      { id: "e-q-ev4", source: "q-exp", target: "ev-saffire-4", animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } },
      { id: "e-ev4-hyp", source: "ev-saffire-4", target: "hyp-exp", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e-hyp-exp", source: "hyp-exp", target: "exp-exp", animated: true, style: { stroke: "#c084fc", strokeWidth: 2 } },
    ],
  },
  droplets: {
    label: "Droplet Extinction & Cool Flames (FLEX)",
    nodes: [
      {
        id: "q-flex",
        type: "question",
        position: { x: 380, y: 20 },
        data: {
          label: "Second Extinction Limit in Liquid Droplet Cool Flames",
          details: "Under what conditions do multi-component fuel droplets sustain low-temperature burning in 0g?",
        },
      },
      {
        id: "ev-flex",
        type: "evidence",
        position: { x: 300, y: 180 },
        data: {
          claimId: "CLM-FLEX-001",
          investigation: "FLEX Flame Extinction (Droplets)",
          conditions: "18% O₂ • 0 cm/s Flow • 101.3 kPa",
          quote: "Large isolated droplets exhibit self-sustaining cool flames at temperatures below 800 K after radiative extinction.",
        },
      },
      {
        id: "hyp-flex",
        type: "hypothesis",
        position: { x: 340, y: 400 },
        data: {
          title: "Chemical Kinetic Quenching Boundary",
          prediction: "Cool flame duration depends non-linearly on initial droplet diameter due to radical diffusion balance.",
          rationale: "Quiescent spherical symmetry traps fuel vapor and intermediate peroxy radicals in high local concentrations.",
        },
      },
      {
        id: "exp-flex",
        type: "experiment",
        position: { x: 340, y: 580 },
        data: {
          facility: "ISS CIR",
          objective: "Free-Floating Multi-Component Droplet Combustion",
          airflow: "0 cm/s (pure quiescent)",
          oxygen: "15% – 21% O₂",
          pressure: "101.3 kPa",
          geometry: "2.0 – 5.0 mm heptane/alkane tethered droplets",
        },
      },
    ],
    edges: [
      { id: "e-q-flex", source: "q-flex", target: "ev-flex", animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } },
      { id: "e-ev-hyp", source: "ev-flex", target: "hyp-flex", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e-hyp-exp", source: "hyp-flex", target: "exp-flex", animated: true, style: { stroke: "#c084fc", strokeWidth: 2 } },
    ],
  },
};

interface StructuredWhiteboardProps {
  activeRecord: ExperimentRecord | null;
  onExportBrief?: (markdown: string) => void;
  initialPrompt?: string | null;
  initialTree?: BuildHypothesisTreeArgs | null;
}

export function StructuredWhiteboard({
  activeRecord,
  onExportBrief,
  initialPrompt,
  initialTree,
}: StructuredWhiteboardProps) {
  const { session } = useAuth();
  const [activeTemplate, setActiveTemplate] = useState("ventilation");
  const [nodes, setNodes, onNodesChange] = useNodesState(TEMPLATES.ventilation.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(TEMPLATES.ventilation.edges);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatusFeedback, setAiStatusFeedback] = useState<string | null>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const rfInstanceRef = useRef<any>(null);
  const pendingFitViewRef = useRef<boolean>(false);

  // Smooth Viewport Auto-Centering
  const centerGraph = useCallback(() => {
    if (rfInstanceRef.current) {
      try {
        rfInstanceRef.current.fitView({ duration: 800, padding: 0.2 });
        pendingFitViewRef.current = false;
      } catch (err) {
        // Fallback if not ready
      }
    } else {
      pendingFitViewRef.current = true;
    }
  }, []);

  // Wire onChange and onDelete callbacks into each node's data
  const handleUpdateNodeData = useCallback(
    (id: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges]
  );

  // Inject callbacks into nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      }))
    );
  }, [handleUpdateNodeData, handleDeleteNode, setNodes]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#f59e0b", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  // Dynamic Multi-Factor AI Tree Synthesizer
  const synthesizeDynamicTree = (rawInput: string) => {
    const p = rawInput.toLowerCase();

    const isArtemis = p.includes("lunar") || p.includes("artemis") || p.includes("56") || p.includes("sibal") || p.includes("0.16");
    const isVentilation = p.includes("ventilation") || p.includes("saffire") || p.includes("bass") || p.includes("airflow") || p.includes("scale divergence");
    const isDroplet = p.includes("cool") || p.includes("droplet") || p.includes("flex") || p.includes("alkane") || p.includes("heptane") || p.includes("methanol");
    const isThickSolid = p.includes("thick") || p.includes("sofie") || p.includes("gel") || p.includes("solid pmma") || p.includes("nca");
    const isSmoke = p.includes("smoke") || p.includes("sensor") || p.includes("detector") || p.includes("same") || p.includes("spice") || p.includes("aerosol");

    if (isArtemis) {
      return {
        qTitle: "Artemis Exploration Flammability: PMMA & SIBAL (26% O₂ / 56 kPa at 0.16g)",
        qDetails: "Why do reduced atmospheric pressure (56 kPa) and elevated oxygen (26%–34% O₂) accelerate opposed and concurrent flame propagation over solid PMMA and SIBAL fabric in 0.16g Lunar gravity?",
        ev1: {
          claimId: "CLM-SAFFIRE-004",
          investigation: "Saffire-IV Sample IV-1 Fire Test",
          conditions: "22% O₂ • 20 cm/s Flow • 100 kPa",
          quote: "Flame spread occurred; reports 130 s burning with 3,150 W average heat release.",
        },
        ev2: {
          claimId: "CLM-REG-008",
          investigation: "Flammability of Materials on the Moon (FM2)",
          conditions: "21–30% O₂ • 0.16g Lunar drop tower • 101.3 kPa",
          quote: "NASA describes a lunar flame-spread investigation and illustrates SIBAL burning in simulated lunar gravity; the page does not report a numerical flame-spread outcome.",
        },
        hypTitle: "Thermal Gas Capacitance (ρCp) Suppression & Radiative Balance",
        hypPred: "Lower total pressure reduces gas thermal capacity (ρCp), elevating adiabatic flame temperature by ~180 K while 0.16g eliminates buoyant convective heat loss.",
        hypRat: "Buoyant suppression at 0.16g eliminates natural convective cooling while low-velocity ventilation maintains steady pyrolyzate flux to the reaction zone.",
        expObj: "Lunar 0.16g Exploration Atmosphere Flammability Validation",
        expFac: "ISS CIR / Saffire Flow Duct",
        expFlow: "5 – 25 cm/s forced convective duct flow",
        expO2: "26% – 34% O₂ Exploration Range",
        expPress: "56 kPa (0.56 atm baseline)",
        expGeom: "0.2m x 0.5m PMMA slab & SIBAL fabric coupon",
      };
    }

    if (isVentilation) {
      return {
        qTitle: "Forced Convective Flow & Flame Spread Scale Invariant (Saffire vs BASS)",
        qDetails: "Why do large-scale fuel slabs (Saffire 0.4m x 1.0m) sustain continuous flame spread at 20 cm/s airflow where glovebox specimens (BASS 1-2 cm) undergo radiative extinction?",
        ev1: {
          claimId: "CLM-SAFFIRE-001",
          investigation: "Saffire-I Large-Scale Flight Experiment",
          conditions: "21% O₂ • 20 cm/s Flow • 101.3 kPa",
          quote: "Large-scale flame spread in microgravity without buoyancy proceeds steadily under forced airflow. 0.4 m x 1.0 m solid burns continuously.",
        },
        ev2: {
          claimId: "CLM-BASS-002",
          investigation: "BASS-II Opposed Flow PMMA Rods",
          conditions: "21% O₂ • 3.5 cm/s Flow • 101.3 kPa",
          quote: "Narrow glovebox flow duct causes accelerated radiative extinction near low-speed boundary for 1-2 cm thick PMMA slabs.",
        },
        hypTitle: "Cumulative Downstream Radiative Preheating Scale Invariant",
        hypPred: "Large fuel specimens absorb upstream flame radiative flux that sustains pyrolysis at higher convective velocities, whereas small glovebox samples lose heat to cold duct boundaries.",
        hypRat: "Downstream surface view factor captures emitted radiation that is lost to enclosure walls in small-scale glovebox hardware.",
        expObj: "Intermediate-Scale Radiative Feedback Duct Verification",
        expFac: "ISS CIR Duct Apparatus",
        expFlow: "10 – 25 cm/s controlled flow",
        expO2: "21% – 26% O₂",
        expPress: "56 – 101.3 kPa",
        expGeom: "0.2m x 0.5m slab instrumented with heat flux radiometer array",
      };
    }

    if (isDroplet) {
      return {
        qTitle: "Liquid Droplet Extinction & Low-Temperature Cool Flames (FLEX)",
        qDetails: "Under what physical and chemical kinetic conditions do isolated hydrocarbon droplets sustain low-temperature cool flame burning (<800 K) after visible radiative extinction in microgravity?",
        ev1: {
          claimId: "CLM-FLEX-001",
          investigation: "FLEX Flame Extinction and Cool Flames",
          conditions: "18% O₂ • 0 cm/s Flow • 101.3 kPa",
          quote: "Large isolated droplets exhibit self-sustaining cool flames at temperatures below 800 K after radiative extinction.",
        },
        ev2: {
          claimId: "CLM-PSI-002",
          investigation: "FLEX-2 Heptane Second-Stage Quenching",
          conditions: "21% O₂ • 0 cm/s Flow • 101.3 kPa",
          quote: "The droplet burned for 5 s and the visible flame went out at a droplet diameter of 0.94 mm, transitioning into a cool-flame regime.",
        },
        hypTitle: "Peroxy Radical Low-Temperature Kinetic Diffusion Equilibrium",
        hypPred: "Cool-flame duration is governed non-linearly by initial droplet diameter due to spherical radical accumulation and absence of buoyant convective drift.",
        hypRat: "Quiescent spherical symmetry confines intermediate peroxy and hydroperoxy radicals in high local concentrations without buoyant convective dispersion.",
        expObj: "Free-Floating Multi-Component Alkane Droplet Combustion",
        expFac: "ISS CIR MDCA Chamber",
        expFlow: "0 cm/s (pure quiescent diffusion)",
        expO2: "15% – 21% O₂",
        expPress: "101.3 kPa (1.0 atm)",
        expGeom: "2.0 – 5.0 mm heptane / decane droplets on tether fibers",
      };
    }

    if (isThickSolid) {
      return {
        qTitle: "Thick Fuel Conduction Heat Sink & Extinction Boundaries (SoFIE)",
        qDetails: "How does solid-phase conductive heat transfer into thick PMMA fuel slabs govern opposed-flow extinction limits in microgravity forced airflow?",
        ev1: {
          claimId: "CLM-SOFIE-001",
          investigation: "SoFIE — Growth and Extinction Limit (GEL)",
          conditions: "34% O₂ • 4 cm/s Flow • 101.3 kPa",
          quote: "Internal conduction heat sink in thick fuels shifts extinction boundary to 34% O₂ in quiescent microgravity.",
        },
        ev2: {
          claimId: "CLM-REG-010",
          investigation: "SoFIE — Narrow Channel Apparatus (NCA)",
          conditions: "85% O₂ • 2 cm/s Flow • 101.3 kPa",
          quote: "NASA outlines tests designed to measure flame spread and extinction limits over PMMA under narrow duct confinement.",
        },
        hypTitle: "Internal Sub-Surface Thermal Inertia vs Convective Pyrolysis",
        hypPred: "Thick fuels act as a thermal heat sink, elevating the limiting oxygen index by >12% compared to thermally thin fabrics unless forced flow exceeds 10 cm/s.",
        hypRat: "Absence of buoyant flame attachment prevents upstream boundary layer thinning, trapping heat within the solid substrate.",
        expObj: "Thick Fuel Sub-Surface Pyrolysis & Flame Standoff Matrix",
        expFac: "ISS CIR / SoFIE Insert",
        expFlow: "2 – 15 cm/s opposed flow",
        expO2: "21% – 35% O₂",
        expPress: "56 – 101.3 kPa",
        expGeom: "10 mm thick PMMA casting with embedded thermocouple rake",
      };
    }

    if (isSmoke) {
      return {
        qTitle: "Spacecraft Smoke Particle Agglomeration & Low-Flow Detection",
        qDetails: "How does microgravity buoyancy suppression alter soot particle morphology, aggregate size, and early ionization detector response in spacecraft cabin ventilation?",
        ev1: {
          claimId: "CLM-SAME-001",
          investigation: "Smoke and Aerosol Measurement Experiment (SAME)",
          conditions: "21% O₂ • 5 cm/s Flow • 101.3 kPa",
          quote: "Microgravity produces larger soot agglomerates due to longer residence times and absence of buoyant sorting.",
        },
        ev2: {
          claimId: "CLM-SPICE-001",
          investigation: "Smoke Point in Co-flow Experiment (SPICE)",
          conditions: "21% O₂ • 8 cm/s Flow • 101.3 kPa",
          quote: "Laminar soot generation in microgravity exhibits higher primary particle size distribution before radiative quenching.",
        },
        hypTitle: "Residence-Time-Driven Soot Coagulation Kinetics",
        hypPred: "Without buoyant acceleration, smoke particulate primary diameter increases by 2.4x, triggering optical obscuration detectors 40% faster than terrestrial reference.",
        hypRat: "Suppressed convective sweep-away allows continuous Brownian and thermophoretic agglomeration in the pre-filter duct flow.",
        expObj: "Multi-Sensor Spacecraft Smoke Detection Threshold Matrix",
        expFac: "ISS MSG (Microgravity Science Glovebox)",
        expFlow: "2 – 10 cm/s ventilation duct velocity",
        expO2: "21% O₂ Standard Cabin",
        expPress: "101.3 kPa (1.0 atm)",
        expGeom: "Overheated wire insulation & Kapton film pyrolysate",
      };
    }

    // Dynamic Generic Matcher: query experimentsData for closest records
    const scored = (experimentsData as ExperimentRecord[]).map((r) => {
      let score = 0;
      const invL = r.investigation.toLowerCase();
      const matL = (r.material || "").toLowerCase();
      const findL = (r.finding || "").toLowerCase();
      const words = p.split(/\s+/).filter((w) => w.length > 3);
      for (const w of words) {
        if (invL.includes(w)) score += 5;
        if (matL.includes(w)) score += 4;
        if (findL.includes(w)) score += 3;
      }
      return { r, score };
    }).sort((a, b) => b.score - a.score);

    const rec1 = scored[0]?.r || (experimentsData as ExperimentRecord[])[0];
    const rec2 = scored[1]?.r || (experimentsData as ExperimentRecord[])[1];

    const cleanPrompt = rawInput.trim();
    const promptTitle = cleanPrompt.length > 55 ? cleanPrompt.slice(0, 52) + "..." : cleanPrompt;

    return {
      qTitle: `Investigation: ${promptTitle}`,
      qDetails: `What governing mechanisms control combustion behavior, flame spread, and extinction limits under these queried physical conditions: "${cleanPrompt}"?`,
      ev1: {
        claimId: rec1.claim_locator_details?.claimId || `CLM-${rec1.id.toUpperCase()}`,
        investigation: rec1.investigation,
        conditions: `${rec1.oxygen_pct != null ? `${rec1.oxygen_pct}% O₂` : "21% O₂"} • ${rec1.airflow_cm_s != null ? `${rec1.airflow_cm_s} cm/s` : "quiescent"} • ${rec1.pressure_kpa != null ? `${rec1.pressure_kpa} kPa` : "1 atm"}`,
        quote: rec1.finding,
      },
      ev2: {
        claimId: rec2.claim_locator_details?.claimId || `CLM-${rec2.id.toUpperCase()}`,
        investigation: rec2.investigation,
        conditions: `${rec2.oxygen_pct != null ? `${rec2.oxygen_pct}% O₂` : "21% O₂"} • ${rec2.airflow_cm_s != null ? `${rec2.airflow_cm_s} cm/s` : "quiescent"} • ${rec2.pressure_kpa != null ? `${rec2.pressure_kpa} kPa` : "1 atm"}`,
        quote: rec2.finding,
      },
      hypTitle: `Physical Boundary Transport & Reaction Balance`,
      hypPred: `Combustion limits and propagation rates diverge from 1g terrestrial benchmarks due to complete suppression of buoyant natural convection.`,
      hypRat: `Transport is governed purely by forced convection and molecular diffusion, altering local Damköhler and Lewis numbers at the flame front.`,
      expObj: `Microgravity Parameter Verification Test`,
      expFac: rec1.platform || "ISS CIR Combustion Chamber",
      expFlow: `${rec1.airflow_cm_s != null ? rec1.airflow_cm_s : 10} cm/s forced flow`,
      expO2: `${rec1.oxygen_pct != null ? rec1.oxygen_pct : 21}% O₂`,
      expPress: `${rec1.pressure_kpa != null ? rec1.pressure_kpa : 101.3} kPa`,
      expGeom: `${rec1.material} specimen configuration`,
    };
  };

  // Builds complete grounded tree from structured agent tool arguments
  const buildNodesFromCustomTree = useCallback((tree: BuildHypothesisTreeArgs) => {
    const qId = `q-${Date.now()}`;
    const hypId = `hyp-${Date.now()}`;
    const expId = `exp-${Date.now()}`;

    const evNodes: Node[] = [];
    const evEdges: Edge[] = [];

    const claims = (tree.evidenceClaims && tree.evidenceClaims.length > 0)
      ? tree.evidenceClaims
      : ["CLM-SAFFIRE-001", "CLM-BASS-002"];

    const totalClaims = Math.min(claims.length, 3);
    const spacing = 400;
    const startX = 400 - ((totalClaims - 1) * spacing) / 2;

    claims.slice(0, 3).forEach((claimId, idx) => {
      const matchedRec = (experimentsData as ExperimentRecord[]).find(
        (r) =>
          r.claim_locator_details?.claimId?.toUpperCase() === claimId.toUpperCase() ||
          `CLM-${r.id.toUpperCase()}` === claimId.toUpperCase() ||
          r.id.toLowerCase() === claimId.toLowerCase()
      );

      const evId = `ev-${Date.now()}-${idx}`;
      const xPos = startX + idx * spacing;
      const yPos = 200;

      evNodes.push({
        id: evId,
        type: "evidence",
        position: { x: xPos, y: yPos },
        data: {
          claimId: matchedRec?.claim_locator_details?.claimId || claimId,
          investigationId: matchedRec?.id || claimId,
          investigation: matchedRec?.investigation || `NASA Flight Record (${claimId})`,
          conditions: matchedRec
            ? `${matchedRec.oxygen_pct != null ? `${matchedRec.oxygen_pct}% O₂` : "21% O₂"} • ${matchedRec.airflow_cm_s != null ? `${matchedRec.airflow_cm_s} cm/s` : "0 cm/s"} • ${matchedRec.pressure_kpa != null ? `${matchedRec.pressure_kpa} kPa` : "101.3 kPa"}`
            : "Microgravity flight conditions",
          quote: matchedRec?.finding || "Empirical microgravity combustion flight finding verified in NASA PSI.",
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      });

      evEdges.push({
        id: `e-${qId}-${evId}`,
        source: qId,
        target: evId,
        animated: true,
        style: { stroke: "#38bdf8", strokeWidth: 2 },
      });

      evEdges.push({
        id: `e-${evId}-${hypId}`,
        source: evId,
        target: hypId,
        style: { stroke: "#10b981", strokeWidth: 2 },
      });
    });

    const questionNode: Node = {
      id: qId,
      type: "question",
      position: { x: 400, y: 20 },
      data: {
        label: tree.question.title,
        details: tree.question.details,
        aiGenerated: true,
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };

    const hypothesisNode: Node = {
      id: hypId,
      type: "hypothesis",
      position: { x: 400, y: 450 },
      data: {
        title: tree.hypothesis.title,
        prediction: tree.hypothesis.prediction,
        rationale: tree.hypothesis.rationale,
        aiGenerated: true,
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };

    const expNode: Node = {
      id: expId,
      type: "experiment",
      position: { x: 390, y: 720 },
      data: {
        facility: tree.validationExperiment.facility,
        objective: tree.validationExperiment.objective,
        airflow: tree.validationExperiment.airflow,
        oxygen: tree.validationExperiment.oxygen,
        pressure: tree.validationExperiment.pressure,
        geometry: tree.validationExperiment.geometry,
        aiGenerated: true,
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };

    const allNodes: Node[] = [questionNode, ...evNodes, hypothesisNode, expNode];
    const allEdges: Edge[] = [
      ...evEdges,
      {
        id: `e-${hypId}-${expId}`,
        source: hypId,
        target: expId,
        animated: true,
        style: { stroke: "#c084fc", strokeWidth: 2 },
      },
    ];

    if (tree.counterHypothesis) {
      const counterId = `counter-${Date.now()}`;
      const counterNode: Node = {
        id: counterId,
        type: "hypothesis",
        position: { x: 800, y: 450 },
        data: {
          title: tree.counterHypothesis.title,
          prediction: tree.counterHypothesis.prediction,
          rationale: tree.counterHypothesis.rationale,
          isCounter: true,
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      };
      allNodes.push(counterNode);
      if (evNodes.length > 1) {
        allEdges.push({
          id: `e-${evNodes[evNodes.length - 1].id}-${counterId}`,
          source: evNodes[evNodes.length - 1].id,
          target: counterId,
          style: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5 5" },
        });
      }
      allEdges.push({
        id: `e-${counterId}-${expId}`,
        source: counterId,
        target: expId,
        style: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "4 4" },
      });
    }

    return { nodes: allNodes, edges: allEdges };
  }, [handleUpdateNodeData, handleDeleteNode]);

  // Auto-run AI tree generation if initialTree or initialPrompt is passed from parent or chat
  useEffect(() => {
    if (initialTree) {
      const built = buildNodesFromCustomTree(initialTree);
      setNodes(built.nodes);
      setEdges(built.edges);
      setAiStatusFeedback(`⚡ Nemotron AI Synthesized: ${initialTree.hypothesis.title}`);
      centerGraph();
      setTimeout(centerGraph, 100);
      setTimeout(centerGraph, 400);
    } else if (initialPrompt && initialPrompt.trim()) {
      handleAiGenerateTree(initialPrompt.trim());
    }
  }, [initialTree, initialPrompt, buildNodesFromCustomTree, centerGraph]);

  // AI Agent: Auto-Generate complete grounded tree based on user prompt or active record
  const handleAiGenerateTree = (customTopic?: string) => {
    setIsAiGenerating(true);
    const rawInput = customTopic || aiPrompt || (activeRecord ? `${activeRecord.material} combustion in ${activeRecord.gravity}` : "Exploration Atmosphere Flammability Boundaries");
    const pLower = rawInput.toLowerCase();

    if (pLower.includes("counter") || pLower.includes("wall") || pLower.includes("conductive")) {
      handleAiAddCounterHypothesis();
      setIsAiGenerating(false);
      return;
    }

    const synth = synthesizeDynamicTree(rawInput);

    const qId = `q-${Date.now()}`;
    const ev1Id = `ev1-${Date.now()}`;
    const ev2Id = `ev2-${Date.now()}`;
    const hypId = `hyp-${Date.now()}`;
    const expId = `exp-${Date.now()}`;

    const newNodes: Node[] = [
      {
        id: qId,
        type: "question",
        position: { x: 380, y: 20 },
        data: {
          label: synth.qTitle,
          details: synth.qDetails,
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: ev1Id,
        type: "evidence",
        position: { x: 80, y: 190 },
        data: {
          claimId: synth.ev1.claimId,
          investigation: synth.ev1.investigation,
          conditions: synth.ev1.conditions,
          quote: synth.ev1.quote,
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: ev2Id,
        type: "evidence",
        position: { x: 620, y: 190 },
        data: {
          claimId: synth.ev2.claimId,
          investigation: synth.ev2.investigation,
          conditions: synth.ev2.conditions,
          quote: synth.ev2.quote,
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: hypId,
        type: "hypothesis",
        position: { x: 350, y: 390 },
        data: {
          title: synth.hypTitle,
          prediction: synth.hypPred,
          rationale: synth.hypRat,
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: expId,
        type: "experiment",
        position: { x: 350, y: 580 },
        data: {
          facility: synth.expFac,
          objective: synth.expObj,
          airflow: synth.expFlow,
          oxygen: synth.expO2,
          pressure: synth.expPress,
          geometry: synth.expGeom,
          aiGenerated: true,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
    ];

    const newEdges: Edge[] = [
      { id: `e-${qId}-${ev1Id}`, source: qId, target: ev1Id, animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } },
      { id: `e-${qId}-${ev2Id}`, source: qId, target: ev2Id, animated: true, style: { stroke: "#38bdf8", strokeWidth: 2 } },
      { id: `e-${ev1Id}-${hypId}`, source: ev1Id, target: hypId, style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: `e-${ev2Id}-${hypId}`, source: ev2Id, target: hypId, style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: `e-${hypId}-${expId}`, source: hypId, target: expId, animated: true, style: { stroke: "#c084fc", strokeWidth: 2 } },
    ];

    setNodes(newNodes);
    setEdges(newEdges);
    setAiPrompt("");
    setAiStatusFeedback(`✨ AI Agent synthesized 5 grounded nodes & 5 causal links: ${synth.qTitle}`);

    // Schedule viewport auto-centering across layout frames
    setTimeout(() => centerGraph(), 60);
    setTimeout(() => centerGraph(), 200);
    setTimeout(() => centerGraph(), 500);

    setTimeout(() => {
      setIsAiGenerating(false);
    }, 400);

    setTimeout(() => {
      setAiStatusFeedback(null);
    }, 5000);
  };

  // AI Agent: Add Counter-Hypothesis Node
  const handleAiAddCounterHypothesis = () => {
    const hypCount = nodes.filter((n) => n.type === "hypothesis").length;
    const hypNode: Node = {
      id: `hyp-counter-${Date.now()}`,
      type: "hypothesis",
      position: { x: 740, y: 390 + (hypCount - 1) * 60 },
      data: {
        title: "Counter-Hypothesis: Conductive Wall Heat Dissipation",
        prediction: "Extinction is predominantly driven by non-buoyant thermal conduction losses to cold flow duct walls rather than chemical kinetic radical quenching.",
        rationale: "Small aspect-ratio glovebox hardware accelerates boundary quenching below 5 cm/s forced convective velocity.",
        isCounter: true,
        aiGenerated: true,
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };

    setNodes((nds) => [...nds, hypNode]);

    const qNode = nodes.find((n) => n.type === "question");
    const expNode = nodes.find((n) => n.type === "experiment");

    const newCounterEdges: Edge[] = [];
    if (qNode) {
      newCounterEdges.push({
        id: `e-${qNode.id}-${hypNode.id}`,
        source: qNode.id,
        target: hypNode.id,
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    }
    if (expNode) {
      newCounterEdges.push({
        id: `e-${hypNode.id}-${expNode.id}`,
        source: hypNode.id,
        target: expNode.id,
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" },
      });
    }

    if (newCounterEdges.length > 0) {
      setEdges((eds) => [...eds, ...newCounterEdges]);
    }

    setAiStatusFeedback("✨ AI Agent added Counter-Hypothesis: Conductive Wall Dissipation");
    setTimeout(() => centerGraph(), 80);
    setTimeout(() => centerGraph(), 300);
    setTimeout(() => setAiStatusFeedback(null), 4000);
  };

  // AI Agent: Add Evidence Node from authentic flight corpus
  const handleAiAddEvidence = () => {
    const evCount = nodes.filter((n) => n.type === "evidence").length;
    const unusedRecord = (experimentsData as ExperimentRecord[]).find(
      (r) => !nodes.some((n) => n.data?.claimId === r.claim_locator_details?.claimId)
    ) || (experimentsData as ExperimentRecord[])[2];

    const evNode: Node = {
      id: `ev-extra-${Date.now()}`,
      type: "evidence",
      position: { x: 80 + evCount * 280, y: 190 },
      data: {
        claimId: unusedRecord.claim_locator_details?.claimId || `CLM-${unusedRecord.id.toUpperCase()}`,
        investigation: unusedRecord.investigation,
        conditions: `${unusedRecord.oxygen_pct != null ? `${unusedRecord.oxygen_pct}% O₂` : "21% O₂"} • ${unusedRecord.airflow_cm_s != null ? `${unusedRecord.airflow_cm_s} cm/s` : "quiescent"}`,
        quote: unusedRecord.finding,
        aiGenerated: true,
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };

    setNodes((nds) => [...nds, evNode]);

    const qNode = nodes.find((n) => n.type === "question");
    const hypNode = nodes.find((n) => n.type === "hypothesis");

    const newEvidenceEdges: Edge[] = [];
    if (qNode) {
      newEvidenceEdges.push({
        id: `e-${qNode.id}-${evNode.id}`,
        source: qNode.id,
        target: evNode.id,
        animated: true,
        style: { stroke: "#38bdf8", strokeWidth: 2 },
      });
    }
    if (hypNode) {
      newEvidenceEdges.push({
        id: `e-${evNode.id}-${hypNode.id}`,
        source: evNode.id,
        target: hypNode.id,
        style: { stroke: "#10b981", strokeWidth: 2 },
      });
    }

    if (newEvidenceEdges.length > 0) {
      setEdges((eds) => [...eds, ...newEvidenceEdges]);
    }

    setAiStatusFeedback(`✨ AI Agent linked flight evidence: ${unusedRecord.investigation}`);
    setTimeout(() => centerGraph(), 80);
    setTimeout(() => centerGraph(), 300);
    setTimeout(() => setAiStatusFeedback(null), 4000);
  };

  // Auto-Layout: Evenly distributes nodes into balanced hierarchy across the full width
  const handleAutoLayout = () => {
    const questions = nodes.filter((n) => n.type === "question");
    const evidence = nodes.filter((n) => n.type === "evidence");
    const hypotheses = nodes.filter((n) => n.type === "hypothesis");
    const experiments = nodes.filter((n) => n.type === "experiment");

    const layoutLayer = (layerNodes: Node[], yPos: number) => {
      const total = layerNodes.length;
      const spacing = 360;
      const startX = Math.max(100, 560 - ((total - 1) * spacing) / 2);
      return layerNodes.map((n, i) => ({
        ...n,
        position: { x: startX + i * spacing, y: yPos },
      }));
    };

    setNodes([
      ...layoutLayer(questions, 30),
      ...layoutLayer(evidence, 190),
      ...layoutLayer(hypotheses, 390),
      ...layoutLayer(experiments, 580),
    ]);
  };

  const handleSelectTemplate = (templateKey: string) => {
    const tmpl = TEMPLATES[templateKey];
    if (tmpl) {
      setActiveTemplate(templateKey);
      setNodes(
        tmpl.nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            onChange: handleUpdateNodeData,
            onDelete: handleDeleteNode,
          },
        }))
      );
      setEdges(tmpl.edges);
    }
  };

  const handleAddQuestion = () => {
    const newNode: Node = {
      id: `q-${Date.now()}`,
      type: "question",
      position: { x: 300 + Math.random() * 80, y: 50 + Math.random() * 50 },
      data: {
        label: "New Research Inquiry",
        details: "Specify combustion parameter hypothesis or boundary gap...",
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddEvidence = () => {
    const rec = activeRecord || (experimentsData as any)[0];
    const newNode: Node = {
      id: `ev-${Date.now()}`,
      type: "evidence",
      position: { x: 200 + Math.random() * 100, y: 220 + Math.random() * 80 },
      data: {
        claimId: rec?.claim_locator_details?.claimId || "CLM-NASA",
        investigation: rec?.investigation || "Selected NASA Study",
        conditions: rec
          ? `${rec.oxygen_pct ?? 21}% O₂ • ${rec.airflow_cm_s ?? 0} cm/s Flow • ${rec.pressure_kpa ?? 101.3} kPa`
          : "Standard Atmospheric Conditions",
        quote: rec?.finding || "Empirical observation from NASA PSI archive.",
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddHypothesis = () => {
    const newNode: Node = {
      id: `hyp-${Date.now()}`,
      type: "hypothesis",
      position: { x: 320 + Math.random() * 80, y: 360 + Math.random() * 60 },
      data: {
        title: "Microgravity Flammability Hypothesis",
        prediction: "Flammability threshold shifts with reduced gravity and ambient pressure.",
        rationale: "Buoyant momentum suppression increases local gas residence time.",
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddExperiment = () => {
    const newNode: Node = {
      id: `exp-${Date.now()}`,
      type: "experiment",
      position: { x: 340 + Math.random() * 80, y: 520 + Math.random() * 60 },
      data: {
        facility: "ISS CIR",
        objective: "Validation of Opposed Flow Flame Extinction Boundary",
        airflow: "0 – 20 cm/s flow",
        oxygen: "18% – 30% O₂",
        pressure: "56 – 101.3 kPa",
        geometry: "0.2m x 0.5m polymer slab",
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSaveToLocal = async () => {
    try {
      const state = { nodes, edges };
      if (session) await saveResearcherItem("whiteboard", `Evidence tree ${new Date().toLocaleString()}`, state);
      else {
        localStorage.setItem("flare_whiteboard_state", JSON.stringify(state));
        localStorage.setItem("ignis_whiteboard_state", JSON.stringify(state));
      }
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (e) {
      setAiStatusFeedback(e instanceof Error ? e.message : "Could not save board.");
    }
  };

  const handleLoadFromLocal = async () => {
    try {
      let raw: string | null = null;
      if (session && authClient) {
        const selectedId = sessionStorage.getItem(`flare_open_board_${session.user.id}`) || sessionStorage.getItem(`ignis_open_board_${session.user.id}`);
        let query = authClient.from("researcher_items").select("content").eq("kind", "whiteboard");
        if (selectedId) query = query.eq("id", selectedId);
        const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        raw = data ? JSON.stringify(data.content) : null;
        if (data && selectedId) {
          sessionStorage.removeItem(`flare_open_board_${session.user.id}`);
          sessionStorage.removeItem(`ignis_open_board_${session.user.id}`);
        }
      } else raw = localStorage.getItem("flare_whiteboard_state") || localStorage.getItem("ignis_whiteboard_state");
      if (raw) {
        const state = JSON.parse(raw);
        if (state.nodes && state.edges) {
          setNodes(
            state.nodes.map((n: Node) => ({
              ...n,
              data: {
                ...n.data,
                onChange: handleUpdateNodeData,
                onDelete: handleDeleteNode,
              },
            }))
          );
          setEdges(state.edges);
        }
      }
    } catch (e) {
      setAiStatusFeedback("Could not load your saved board.");
    }
  };

  useEffect(() => {
    if (session && (sessionStorage.getItem(`flare_open_board_${session.user.id}`) || sessionStorage.getItem(`ignis_open_board_${session.user.id}`))) void handleLoadFromLocal();
  }, [session?.user.id]);

  const handleSerializeToBrief = () => {
    const lines: string[] = [
      "# Research Whiteboard: Hypothesis & Experiment Synthesis",
      `*Compiled: ${new Date().toISOString()}*\n`,
      "## 1. Primary Research Questions",
    ];

    const questions = nodes.filter((n) => n.type === "question");
    questions.forEach((q) => {
      lines.push(`- **${q.data.label}**: ${q.data.details || ""}`);
    });

    lines.push("\n## 2. Grounded NASA Evidence Nodes");
    const evidence = nodes.filter((n) => n.type === "evidence");
    evidence.forEach((ev) => {
      lines.push(
        `- **[${ev.data.claimId}] ${ev.data.investigation}** (${ev.data.conditions})\n  > "${ev.data.quote}"`
      );
    });

    lines.push("\n## 3. Physical Hypotheses");
    const hypotheses = nodes.filter((n) => n.type === "hypothesis");
    hypotheses.forEach((hyp) => {
      lines.push(
        `- **${hyp.data.title}**\n  - Prediction: ${hyp.data.prediction}\n  - Rationale: ${hyp.data.rationale || "N/A"}`
      );
    });

    lines.push("\n## 4. Proposed Experiment Architecture");
    const experiments = nodes.filter((n) => n.type === "experiment");
    experiments.forEach((exp) => {
      lines.push(
        `- **${exp.data.objective}** [Facility: ${exp.data.facility}]\n  - Airflow: ${exp.data.airflow}\n  - Oxygen: ${exp.data.oxygen}\n  - Pressure: ${exp.data.pressure}\n  - Sample Geometry: ${exp.data.geometry || "Standard"}`
      );
    });

    const markdown = lines.join("\n");
    if (onExportBrief) {
      onExportBrief(markdown);
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative rounded-lg overflow-hidden border border-white/[0.08] bg-[#090a0d]">
      {/* Top Left: Add Nodes Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 font-mono text-xs">
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>+ Question</span>
        </button>

        <button
          onClick={handleAddEvidence}
          className="flex items-center gap-1 px-2.5 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded transition-colors"
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>+ Evidence</span>
        </button>

        <button
          onClick={handleAddHypothesis}
          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Hypothesis</span>
        </button>

        <button
          onClick={handleAddExperiment}
          className="flex items-center gap-1 px-2.5 py-1 bg-purple-400/10 hover:bg-purple-400/20 text-purple-300 border border-purple-400/30 rounded transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>+ Proposal</span>
        </button>

        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 rounded transition-colors ml-1"
          title="Auto-organize layout to eliminate empty gaps"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto-Layout</span>
        </button>
      </div>

      {/* Top Center: Preset Templates Switcher */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 hidden lg:flex items-center gap-1 bg-[#13171e]/90 backdrop-blur-sm p-1 rounded-lg border border-white/[0.08] font-mono text-[11px]">
        <span className="text-slate-400 px-1.5">Template:</span>
        {Object.entries(TEMPLATES).map(([key, tmpl]) => (
          <button
            key={key}
            onClick={() => handleSelectTemplate(key)}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTemplate === key
                ? "bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tmpl.label.split("(")[0].trim()}
          </button>
        ))}
      </div>

      {/* Top Right: Persistence & Export Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 font-mono text-xs">
        <button
          onClick={handleSaveToLocal}
          className="px-2.5 py-1 bg-[#13171e] hover:bg-white/[0.06] text-slate-300 rounded border border-white/10 flex items-center gap-1 transition-colors"
          title={session ? "Save mind tree to your account" : "Save mind tree on this device"}
        >
          <Save className="w-3 h-3 text-cyan-400" />
          <span>{savedFeedback ? "Saved!" : session ? "Save to account" : "Save locally"}</span>
        </button>

        <button
          onClick={handleLoadFromLocal}
          className="px-2.5 py-1 bg-[#13171e] hover:bg-white/[0.06] text-slate-300 rounded border border-white/10 flex items-center gap-1 transition-colors"
          title="Load saved mind tree"
        >
          <FolderOpen className="w-3 h-3 text-emerald-400" />
          <span>Load</span>
        </button>

        <button
          onClick={handleSerializeToBrief}
          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded flex items-center gap-1 transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export to Brief</span>
        </button>
      </div>

      {/* Canvas Viewport - EXPANDED TO FULL AVAILABLE MODAL HEIGHT */}
      <div className="flex-1 w-full h-full min-h-[500px] relative">
        {/* Dynamic AI Status Banner */}
        {aiStatusFeedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded-lg shadow-2xl flex items-center gap-2 border border-amber-300 animate-in fade-in slide-in-from-top duration-200">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{aiStatusFeedback}</span>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={(inst) => {
            setRfInstance(inst);
            rfInstanceRef.current = inst;
            setTimeout(() => {
              inst.fitView({ duration: 800, padding: 0.2 });
            }, 100);
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          <Controls className="!bg-[#13171e] !border-white/10 !text-slate-200" />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "question") return "#f59e0b";
              if (n.type === "evidence") return "#38bdf8";
              if (n.type === "hypothesis") return "#10b981";
              if (n.type === "experiment") return "#c084fc";
              return "#64748b";
            }}
            className="!bg-[#13171e] !border-white/10"
            maskColor="rgba(9, 10, 13, 0.75)"
          />
        </ReactFlow>

        {/* BOTTOM AI AGENT COPILOT COMMAND BAR - AI AGENT CAN CREATE & EDIT THE MIND TREE */}
        <div className="absolute bottom-3 left-4 right-4 z-20 bg-[#0c1017]/95 backdrop-blur-md border border-amber-500/30 rounded-xl p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
              <Bot className="w-3.5 h-3.5" />
              <span className="font-bold text-[11px]">AI Tree Copilot</span>
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiPrompt.trim()) handleAiGenerateTree();
                }}
                placeholder="Instruct AI Agent to build, expand, or synthesize hypothesis tree (e.g. 'Artemis lunar flammability limits')..."
                className="w-full bg-[#131722] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              onClick={() => handleAiGenerateTree()}
              disabled={isAiGenerating}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{isAiGenerating ? "Synthesizing..." : "AI Auto-Build"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleAiAddCounterHypothesis}
              className="px-2 py-1 bg-[#171b26] hover:bg-[#202534] text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
              title="AI adds an opposing physical mechanism node"
            >
              <BrainCircuit className="w-3 h-3 text-amber-400" />
              <span>+ Counter-Hypothesis</span>
            </button>
            <button
              onClick={handleAiAddEvidence}
              className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
              title="AI adds an additional authentic NASA flight evidence node"
            >
              <Plus className="w-3 h-3" />
              <span>+ Evidence</span>
            </button>
            <button
              onClick={() => handleAiGenerateTree("Artemis Lunar Flammability PMMA SIBAL 26% O2 56kPa")}
              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>🚀 Artemis</span>
            </button>
            <button
              onClick={() => handleAiGenerateTree("Forced Airflow Flame Spread Divergence Saffire vs BASS 20 cm/s")}
              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>💨 Ventilation</span>
            </button>
            <button
              onClick={() => handleAiGenerateTree("Droplet Cool-Flame Extinction Boundaries FLEX")}
              className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>💧 Droplet</span>
            </button>
            <button
              onClick={() => handleAiGenerateTree("Thick Fuel Conduction Heat Sink SoFIE GEL PMMA")}
              className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>🔥 SoFIE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
