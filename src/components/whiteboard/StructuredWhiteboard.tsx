"use client";

import React, { useState, useCallback, useEffect } from "react";
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
    label: "Exploration Atmospheres (26% O₂ / 56 kPa)",
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
          investigation: "Saffire-IV Exploration Atmosphere",
          conditions: "26% O₂ • 20 cm/s Flow • 57 kPa",
          quote: "Elevated oxygen concentration significantly accelerates thick PMMA and composite flame propagation.",
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
}

export function StructuredWhiteboard({
  activeRecord,
  onExportBrief,
}: StructuredWhiteboardProps) {
  const [activeTemplate, setActiveTemplate] = useState("ventilation");
  const [nodes, setNodes, onNodesChange] = useNodesState(TEMPLATES.ventilation.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(TEMPLATES.ventilation.edges);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

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

  // AI Agent: Auto-Generate complete grounded tree based on user prompt or active record
  const handleAiGenerateTree = (customTopic?: string) => {
    setIsAiGenerating(true);
    const topic = customTopic || aiPrompt || (activeRecord ? `${activeRecord.material} combustion in ${activeRecord.gravity}` : "Exploration Atmosphere Flammability Boundaries");
    
    const records = experimentsData as any[];
    const matchingRecords = records.filter(r => 
      topic.toLowerCase().split(" ").some((w: string) => w.length > 3 && (r.investigation.toLowerCase().includes(w) || r.material.toLowerCase().includes(w)))
    );
    const rec1 = matchingRecords[0] || records[0];
    const rec2 = matchingRecords[1] || records[1] || records[0];

    const qId = `q-${Date.now()}`;
    const ev1Id = `ev1-${Date.now()}`;
    const ev2Id = `ev2-${Date.now()}`;
    const hypId = `hyp-${Date.now()}`;
    const expId = `exp-${Date.now()}`;

    const newNodes: Node[] = [
      {
        id: qId,
        type: "question",
        position: { x: 420, y: 30 },
        data: {
          label: `${topic} Inquiry`,
          details: `How do oxygen enrichment and convective velocity variations alter steady flame spread and radiative extinction thresholds?`,
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: ev1Id,
        type: "evidence",
        position: { x: 140, y: 190 },
        data: {
          claimId: rec1?.claim_locator_details?.claimId || "CLM-NASA-01",
          investigation: rec1?.investigation || "NASA Flight Dataset",
          conditions: `${rec1?.oxygen_pct ?? 21}% O₂ • ${rec1?.airflow_cm_s ?? 0} cm/s Flow • ${rec1?.pressure_kpa ?? 101.3} kPa`,
          quote: rec1?.finding || "Empirical boundary measurement from flight archive.",
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: ev2Id,
        type: "evidence",
        position: { x: 700, y: 190 },
        data: {
          claimId: rec2?.claim_locator_details?.claimId || "CLM-NASA-02",
          investigation: rec2?.investigation || "Comparative Flight Investigation",
          conditions: `${rec2?.oxygen_pct ?? 28}% O₂ • ${rec2?.airflow_cm_s ?? 15} cm/s Flow • ${rec2?.pressure_kpa ?? 56} kPa`,
          quote: rec2?.finding || "Comparative empirical flight observation.",
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: hypId,
        type: "hypothesis",
        position: { x: 420, y: 380 },
        data: {
          title: "Thermal Preheating vs Convective Strain Equilibrium",
          prediction: "Low-velocity convective airflow expands flammability limits by sustaining residence time while suppressing upstream heat leakage.",
          rationale: "Buoyant suppression stabilizes a thicker diffusive boundary layer, concentrating radical intermediate species.",
          onChange: handleUpdateNodeData,
          onDelete: handleDeleteNode,
        },
      },
      {
        id: expId,
        type: "experiment",
        position: { x: 420, y: 560 },
        data: {
          facility: "ISS CIR / Saffire Duct",
          objective: "High-O₂ Low-Speed Depressurization Extinction Validation",
          airflow: "0 – 25 cm/s controlled convective flow",
          oxygen: "16% – 34% O₂ exploration envelope",
          pressure: "56 – 101.3 kPa (0.56 – 1.0 atm)",
          geometry: "0.2m x 0.5m sample with dual-wavelength radiometer array",
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
    setTimeout(() => setIsAiGenerating(false), 400);
  };

  // AI Agent: Add Counter-Hypothesis Node
  const handleAiAddCounterHypothesis = () => {
    const hypCount = nodes.filter((n) => n.type === "hypothesis").length;
    const hypNode: Node = {
      id: `hyp-counter-${Date.now()}`,
      type: "hypothesis",
      position: { x: 740, y: 380 + (hypCount - 1) * 60 },
      data: {
        title: "Counter-Hypothesis: Radiative Wall Cooling Dominance",
        prediction: "Sample extinction is primarily governed by conductive/radiative heat loss to cold chamber boundaries rather than chemical kinetic quenching.",
        rationale: "Small-scale glovebox hardware geometry accelerates wall quenching at low velocities (<5 cm/s).",
        onChange: handleUpdateNodeData,
        onDelete: handleDeleteNode,
      },
    };

    setNodes((nds) => [...nds, hypNode]);

    const qNode = nodes.find((n) => n.type === "question");
    if (qNode) {
      setEdges((eds) => [
        ...eds,
        {
          id: `e-${qNode.id}-${hypNode.id}`,
          source: qNode.id,
          target: hypNode.id,
          animated: true,
          style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" },
        },
      ]);
    }
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

  const handleSaveToLocal = () => {
    try {
      const state = { nodes, edges };
      localStorage.setItem("ignis_whiteboard_state", JSON.stringify(state));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadFromLocal = () => {
    try {
      const raw = localStorage.getItem("ignis_whiteboard_state");
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
      console.error(e);
    }
  };

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
          title="Save mind tree locally"
        >
          <Save className="w-3 h-3 text-cyan-400" />
          <span>{savedFeedback ? "Saved!" : "Save"}</span>
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAiAddCounterHypothesis}
              className="px-2.5 py-1.5 bg-[#171b26] hover:bg-[#202534] text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
              title="AI adds an opposing physical mechanism node"
            >
              <BrainCircuit className="w-3 h-3 text-amber-400" />
              <span>+ Counter-Hypothesis</span>
            </button>
            <button
              onClick={() => handleAiGenerateTree("Droplet Cool-Flame Extinction Boundaries")}
              className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>+ Droplet Tree</span>
            </button>
            <button
              onClick={() => handleAiGenerateTree("Exploration High-O2 56kPa Flammability")}
              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>+ Exploration Tree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
