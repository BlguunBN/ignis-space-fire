"use client";

import React, { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { X, Network, Filter, RotateCcw, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import { buildKnowledgeGraph, GraphNode, NodeType } from "../lib/graph";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#090a0d] text-slate-400 font-mono text-xs">
      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin mr-2" />
      <span>Loading 2D Physics Relationship Graph...</span>
    </div>
  ),
});

interface RelationshipGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  corpus: ExperimentRecord[];
  onSelectInvestigation: (recordId: string) => void;
}

export function RelationshipGraphModal({
  isOpen,
  onClose,
  corpus,
  onSelectInvestigation,
}: RelationshipGraphModalProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterTypes, setFilterTypes] = useState<Record<NodeType, boolean>>({
    investigation: true,
    material: true,
    regime: true,
    platform: true,
  });

  const fullGraphData = useMemo(() => buildKnowledgeGraph(corpus), [corpus]);

  const filteredGraphData = useMemo(() => {
    const activeNodeIds = new Set<string>();
    const filteredNodes = fullGraphData.nodes.filter((node) => {
      const active = filterTypes[node.type];
      if (active) activeNodeIds.add(node.id);
      return active;
    });

    const filteredLinks = fullGraphData.links.filter((link) => {
      const srcId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tgtId = typeof link.target === "object" ? (link.target as any).id : link.target;
      return activeNodeIds.has(srcId) && activeNodeIds.has(tgtId);
    });

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [fullGraphData, filterTypes]);

  const fgRef = useRef<any>(null);

  if (!isOpen) return null;

  const toggleFilter = (type: NodeType) => {
    setFilterTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    if (node.meta?.recordId) {
      onSelectInvestigation(node.meta.recordId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0c0f14] border border-white/[0.08] rounded-xl w-full max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.08] bg-[#090a0d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  STAGE 4 GLOBAL KNOWLEDGE NETWORK
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Obsidian-Style Force-Directed Cross-Study Graph
                </span>
              </div>
              <h2 className="text-sm md:text-base font-semibold text-slate-100 font-sans mt-0.5">
                Microgravity Investigation & Regime Ontology Map
              </h2>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => toggleFilter("investigation")}
              className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                filterTypes.investigation
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-white/[0.02] text-slate-500 border-white/[0.06]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span>Investigations ({corpus.length})</span>
            </button>

            <button
              onClick={() => toggleFilter("material")}
              className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                filterTypes.material
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-white/[0.02] text-slate-500 border-white/[0.06]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Materials</span>
            </button>

            <button
              onClick={() => toggleFilter("regime")}
              className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                filterTypes.regime
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-white/[0.02] text-slate-500 border-white/[0.06]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
              <span>Regimes</span>
            </button>

            <button
              onClick={() => toggleFilter("platform")}
              className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                filterTypes.platform
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-white/[0.02] text-slate-500 border-white/[0.06]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              <span>Platforms</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Viewport with Canvas and Node Inspector Drawer */}
        <div className="flex-1 relative bg-[#090a0d] overflow-hidden flex">
          {/* Main 2D Force Graph */}
          <div className="flex-1 h-full">
            <ForceGraph2D
              ref={fgRef}
              graphData={filteredGraphData}
              backgroundColor="#090a0d"
              nodeLabel={(node: any) => `${node.label} (${node.type})`}
              nodeColor={(node: any) => node.color}
              nodeRelSize={4}
              linkColor={(link: any) => link.color || "rgba(255, 255, 255, 0.15)"}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              onNodeClick={handleNodeClick}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.label;
                const fontSize = 11 / globalScale;
                ctx.font = `${fontSize}px monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Draw node circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val ? node.val / 2.5 : 5, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color;
                ctx.fill();

                if (selectedNode?.id === node.id) {
                  ctx.lineWidth = 2 / globalScale;
                  ctx.strokeStyle = "#f59e0b";
                  ctx.stroke();
                }

                // Draw label when zoomed or selected
                if (globalScale > 0.8 || selectedNode?.id === node.id) {
                  ctx.fillStyle = "#f8fafc";
                  ctx.fillText(label, node.x, node.y + (node.val ? node.val / 2 : 6) + fontSize);
                }
              }}
            />
          </div>

          {/* Side Inspector Drawer */}
          {selectedNode && (
            <div className="w-80 border-l border-white/[0.08] bg-[#0c0f14] p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border"
                    style={{
                      borderColor: selectedNode.color,
                      color: selectedNode.color,
                      backgroundColor: `${selectedNode.color}15`,
                    }}
                  >
                    {selectedNode.type}
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  {selectedNode.label}
                </h3>

                {selectedNode.details && (
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#13171e] p-2.5 rounded border border-white/[0.06]">
                    {selectedNode.details}
                  </p>
                )}

                {selectedNode.meta && (
                  <div className="space-y-1.5 font-mono text-xs pt-2 border-t border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Physical Parameters:
                    </div>
                    {selectedNode.meta.oxygen != null && (
                      <div className="flex justify-between text-slate-300">
                        <span>Oxygen Index:</span>
                        <span className="text-cyan-400 font-semibold">{selectedNode.meta.oxygen}% O₂</span>
                      </div>
                    )}
                    {selectedNode.meta.airflow != null && (
                      <div className="flex justify-between text-slate-300">
                        <span>Flow Speed:</span>
                        <span className="text-cyan-400 font-semibold">{selectedNode.meta.airflow} cm/s</span>
                      </div>
                    )}
                    {selectedNode.meta.pressure != null && (
                      <div className="flex justify-between text-slate-300">
                        <span>Pressure:</span>
                        <span className="text-slate-200">{selectedNode.meta.pressure} kPa</span>
                      </div>
                    )}
                    {selectedNode.meta.platform && (
                      <div className="flex justify-between text-slate-300">
                        <span>Platform:</span>
                        <span className="text-slate-200">{selectedNode.meta.platform}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedNode.meta?.recordId && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <button
                    onClick={() => {
                      onSelectInvestigation(selectedNode.meta!.recordId!);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Focus in Workspace</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
