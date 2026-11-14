"use client";

import React, { useState, useCallback } from "react";
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
  Plus,
} from "lucide-react";
import {
  QuestionNode,
  EvidenceNode,
  HypothesisNode,
  ExperimentNode,
} from "./CustomNodes";
import { ExperimentRecord } from "../../types/evidence";

const nodeTypes = {
  question: QuestionNode,
  evidence: EvidenceNode,
  hypothesis: HypothesisNode,
  experiment: ExperimentNode,
};

const initialNodes: Node[] = [
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
    position: { x: 100, y: 160 },
    data: {
      claimId: "CLM-SAFFIRE-1",
      investigation: "Saffire-I Flight Experiment",
      conditions: "21% O₂ • 20 cm/s Flow • 101.3 kPa",
      quote:
        "Large-scale flame spread in microgravity without buoyancy proceeds steadily under forced airflow. 0.4 m x 1.0 m solid burns continuously.",
    },
  },
  {
    id: "ev-2",
    type: "evidence",
    position: { x: 550, y: 160 },
    data: {
      claimId: "CLM-BASS-2",
      investigation: "BASS-II Opposed Flow PMMA",
      conditions: "21% O₂ • 3.5 cm/s Flow • 101.3 kPa",
      quote:
        "Narrow glovebox flow duct causes accelerated radiative extinction near low-speed boundary for 1-2 cm thick PMMA slabs.",
    },
  },
  {
    id: "hyp-1",
    type: "hypothesis",
    position: { x: 340, y: 380 },
    data: {
      title: "Radiative Preheating & Thermal Scale Invariant",
      prediction:
        "Large-scale Saffire fuel experiences cumulative radiative feedback from upstream flame zone that sustains pyrolysis at higher airflow velocities.",
      rationale:
        "Downstream sample geometry absorbs unburned radiation that is lost to cold walls in glovebox scale apparatus.",
    },
  },
  {
    id: "exp-1",
    type: "experiment",
    position: { x: 340, y: 560 },
    data: {
      facility: "ISS CIR / ACME",
      objective: "Intermediate-Scale Radiative Feedback Duct Test",
      airflow: "10 – 25 cm/s flow",
      oxygen: "21% – 26% O₂",
      pressure: "56 – 101 kPa",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-q1-ev1",
    source: "q-1",
    target: "ev-1",
    animated: true,
    style: { stroke: "#38bdf8", strokeWidth: 2 },
  },
  {
    id: "e-q1-ev2",
    source: "q-1",
    target: "ev-2",
    animated: true,
    style: { stroke: "#38bdf8", strokeWidth: 2 },
  },
  {
    id: "e-ev1-hyp1",
    source: "ev-1",
    target: "hyp-1",
    style: { stroke: "#10b981", strokeWidth: 2 },
  },
  {
    id: "e-ev2-hyp1",
    source: "ev-2",
    target: "hyp-1",
    style: { stroke: "#10b981", strokeWidth: 2 },
  },
  {
    id: "e-hyp1-exp1",
    source: "hyp-1",
    target: "exp-1",
    animated: true,
    style: { stroke: "#c084fc", strokeWidth: 2 },
  },
];

interface StructuredWhiteboardProps {
  activeRecord: ExperimentRecord | null;
  onExportBrief?: (markdown: string) => void;
}

export function StructuredWhiteboard({
  activeRecord,
  onExportBrief,
}: StructuredWhiteboardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  const handleReset = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  const handleAddQuestion = () => {
    const newNode: Node = {
      id: `q-${Date.now()}`,
      type: "question",
      position: { x: 300 + Math.random() * 80, y: 50 + Math.random() * 50 },
      data: {
        label: "New Research Inquiry",
        details: "Specify combustion parameter hypothesis or gap...",
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddEvidence = () => {
    const rec = activeRecord;
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
        title: "Microgravity Flammability Boundary Hypothesis",
        prediction: "Flammability threshold shifts with reduced gravity and ambient pressure.",
        rationale: "Buoyant momentum suppression increases local gas residence time.",
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
        facility: "ISS CIR / Glovebox",
        objective: "Validation of Opposed Flow Flame Extinction Boundary",
        airflow: "0 – 20 cm/s flow",
        oxygen: "18% – 30% O₂",
        pressure: "56 – 101.3 kPa",
      },
    };
    setNodes((nds) => [...nds, newNode]);
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
        `- **${exp.data.objective}** [Facility: ${exp.data.facility}]\n  - Airflow: ${exp.data.airflow}\n  - Oxygen: ${exp.data.oxygen}\n  - Pressure: ${exp.data.pressure}`
      );
    });

    const markdown = lines.join("\n");
    if (onExportBrief) {
      onExportBrief(markdown);
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative rounded-lg overflow-hidden border border-white/[0.08] bg-[#090a0d]">
      {/* Control Bar Overlay */}
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
          <span>+ Experiment</span>
        </button>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 font-mono text-xs">
        <button
          onClick={handleReset}
          className="px-2.5 py-1 bg-[#13171e] hover:bg-white/[0.06] text-slate-300 rounded border border-white/10 flex items-center gap-1 transition-colors"
          title="Reset to default template"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>

        <button
          onClick={handleSerializeToBrief}
          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded flex items-center gap-1 transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export to Brief</span>
        </button>
      </div>

      {/* Canvas Viewport */}
      <div className="h-[600px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
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
      </div>
    </div>
  );
}
