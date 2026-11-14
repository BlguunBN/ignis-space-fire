"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Network,
  Cpu,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  Eye,
  Filter,
} from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import {
  generateGroundedAssistantResponse,
  GroundedCitation,
} from "../lib/grounded-assistant";
import { NemotronResponse } from "../lib/nvidia-nemotron";
import {
  AgentToolCall,
  BuildHypothesisTreeArgs,
  RunCombustionSimulationArgs,
  InspectOpticalDiagnosticsArgs,
  FilterResearchExplorerArgs,
  OpenPrimaryEvidenceArgs,
} from "../lib/agent-tools";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: NemotronResponse;
  timestamp: string;
}

interface GroundedChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectClaim: (recordId: string) => void;
  corpus: ExperimentRecord[];
  selectedRecordIds: Set<string>;
  initialPrompt?: string | null;
  onAddToWhiteboard?: (
    text: string,
    citations?: GroundedCitation[],
    customTree?: BuildHypothesisTreeArgs
  ) => void;
  onRunSimulation?: (args: RunCombustionSimulationArgs) => void;
  onOpenSimulator?: (presetId?: string) => void;
  onOpenDiagnostics?: (plateId?: string, filterMode?: string) => void;
  onFilterExplorer?: (args: FilterResearchExplorerArgs) => void;
  onOpenCoverageMap?: () => void;
  onOpenGraph?: () => void;
}

export function GroundedChatDrawer({
  isOpen,
  onClose,
  onInspectClaim,
  corpus,
  selectedRecordIds,
  initialPrompt,
  onAddToWhiteboard,
  onRunSimulation,
  onOpenSimulator,
  onOpenDiagnostics,
  onFilterExplorer,
  onOpenCoverageMap,
  onOpenGraph,
}: GroundedChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Welcome to Research assistant powered by NVIDIA Nemotron-3.5-Lightning (30B). Deep reasoning and strict citation grounding against NASA Physical Sciences Informatics (PSI) flight records are active.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  // Auto-send initial prompt if passed
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const quickPrompts = [
    "Formulate Artemis Lunar (0.16g / 56kPa) hypothesis tree",
    "Model droplet cool-flame extinction in microgravity",
    "Compare Saffire vs BASS forced airflow flame spread",
    "Thick fuel conduction heat sink (SoFIE GEL)",
    "Can we predict Martian 0.38g combustion from this data?",
  ];

  const toggleReasoning = (id: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 1. Try Live Route Handler (/api/chat with NVIDIA Nemotron 3.5)
      let grounded: NemotronResponse;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: queryText.trim() }],
            selectedRecordIds: Array.from(selectedRecordIds),
          }),
        });

        if (res.ok) {
          grounded = await res.json();
        } else {
          // Fallback to local deterministic generator
          let targetCorpus = corpus;
          if (selectedRecordIds.size > 0) {
            const filtered = corpus.filter((r) => selectedRecordIds.has(r.id));
            if (filtered.length > 0) targetCorpus = filtered;
          }
          const localFallback = generateGroundedAssistantResponse(queryText, targetCorpus);
          grounded = {
            ...localFallback,
            model: "ignis-deterministic-grounded-fallback",
          };
        }
      } catch (e) {
        let targetCorpus = corpus;
        if (selectedRecordIds.size > 0) {
          const filtered = corpus.filter((r) => selectedRecordIds.has(r.id));
          if (filtered.length > 0) targetCorpus = filtered;
        }
        const localFallback = generateGroundedAssistantResponse(queryText, targetCorpus);
        grounded = {
          ...localFallback,
          model: "ignis-deterministic-grounded-fallback",
        };
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: grounded.answer,
        response: grounded,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Error: Unable to verify citations against the NASA PSI corpus.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#101216] border-l border-white/[0.08] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-[#101216] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-100">
                <span>Research assistant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" /> Nemotron 30B
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>NVIDIA Nemotron-3.5-Lightning • NASA PSI Grounded</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setMessages([
                  {
                    id: "init",
                    role: "assistant",
                    content:
                      "Conversation cleared. Ask a question about the research library to begin.",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ])
              }
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-white/[0.04] transition-colors"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close assistant"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Viewport */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 space-y-6 font-sans text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 px-1">
                {msg.role === "user" ? (
                  <>
                    <span>Researcher</span>
                    <User className="w-3 h-3 text-slate-400" />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400/90 font-medium">Nemotron 3.5 AI</span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[95%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-400/10 border border-amber-400/20 text-slate-100"
                    : "bg-[#13171e] border border-white/[0.06] text-slate-200"
                }`}
              >
                {/* Nemotron Thinking / Reasoning Process Dropdown */}
                {msg.response?.reasoning && (
                  <div className="mb-2.5 rounded-lg border border-amber-500/20 bg-[#07090e] overflow-hidden text-[11px] font-mono shadow-inner">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full px-3 py-2 flex items-center justify-between bg-amber-500/[0.05] hover:bg-amber-500/[0.08] text-slate-300 transition-colors text-left border-b border-amber-500/10"
                    >
                      <span className="flex items-center gap-2 text-[11px] text-amber-300 font-semibold">
                        <BrainCircuit className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Response details</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Model output
                        </span>
                        {expandedReasoning[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    </button>
                    {expandedReasoning[msg.id] && (
                      <div className="p-3 text-slate-300 text-[10px] leading-relaxed max-h-72 overflow-y-auto font-mono select-text bg-[#05070a] border-t border-white/[0.04] space-y-1">
                        {msg.response.reasoning.split("\n").map((line, idx) => {
                          if (line.startsWith("[")) {
                            return (
                              <div key={idx} className="text-cyan-300 font-bold mt-2 pt-1 border-t border-white/[0.04] tracking-wide">
                                {line}
                              </div>
                            );
                          }
                          if (line.startsWith("•") || line.startsWith("-")) {
                            return (
                              <div key={idx} className="text-slate-300 pl-2">
                                {line}
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="text-slate-400">
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Synthesis Answer */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citation Pills on Assistant Responses */}
                {msg.response && msg.response.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Sources (select to inspect):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.response.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onInspectClaim(c.recordId);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition-colors cursor-pointer"
                          title={`Click to inspect primary source for ${c.investigation} on page ${c.pageNumber}`}
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>{c.claimId} (p.{c.pageNumber})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boundary Warnings */}
                {msg.response && msg.response.boundaryWarnings.length > 0 && (
                  <div className="mt-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300 space-y-1">
                    <div className="flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Physical Boundary Guard</span>
                    </div>
                    {msg.response.boundaryWarnings.map((w, i) => (
                      <p key={i} className="text-slate-300 text-[10px]">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* AI Agent Interactive Execution Cards (Option A: Choose an action) */}
                {msg.role === "assistant" && msg.id !== "init" && msg.response && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-2.5">
                    {/* Render Structured Tool Call Execution Cards */}
                    {msg.response.toolCalls && msg.response.toolCalls.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3 h-3 fill-current text-emerald-400" />
                            <span>Autonomous Research Pipeline ({msg.response.toolCalls.length} Steps):</span>
                          </span>
                          <span className="text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 text-[9px]">
                            {msg.response.toolCalls.length > 1 ? "Multi-Step Sequence" : "Single Action"}
                          </span>
                        </div>

                        {msg.response.toolCalls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const filterCall = msg.response?.toolCalls?.find((c) => c.name === "filter_research_explorer");
                              const treeCall = msg.response?.toolCalls?.find((c) => c.name === "build_hypothesis_tree");
                              const simCall = msg.response?.toolCalls?.find((c) => c.name === "run_combustion_simulation");
                              const diagCall = msg.response?.toolCalls?.find((c) => c.name === "inspect_optical_diagnostics");
                              const claimCall = msg.response?.toolCalls?.find((c) => c.name === "open_primary_evidence");

                              if (filterCall && onFilterExplorer) {
                                onFilterExplorer(filterCall.args as any);
                              }
                              if (treeCall && onAddToWhiteboard) {
                                onAddToWhiteboard((treeCall.args as any).question?.title || msg.content, msg.response!.citations, treeCall.args as any);
                              }
                              if (simCall && onRunSimulation) {
                                onRunSimulation(simCall.args as any);
                              } else if (simCall && onOpenSimulator) {
                                onOpenSimulator((simCall.args as any).gravity === "0.16g" ? "orion-lunar" : "iss");
                              }
                              if (diagCall && onOpenDiagnostics) {
                                onOpenDiagnostics((diagCall.args as any).plateId, (diagCall.args as any).filterMode);
                              }
                              if (claimCall && onInspectClaim && (claimCall.args as any).recordId) {
                                onInspectClaim((claimCall.args as any).recordId);
                              }

                              onClose();
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 transition-all shadow-md text-xs cursor-pointer active:scale-95 group mb-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                            <span>⚡ Run Autonomous Pipeline ({msg.response.toolCalls.length} Steps)</span>
                          </button>
                        )}

                        {msg.response.toolCalls.map((tc, tcIdx) => {
                          if (tc.name === "build_hypothesis_tree") {
                            const args = tc.args as BuildHypothesisTreeArgs;
                            return (
                              <div
                                key={tcIdx}
                                className="p-3 rounded-lg bg-amber-400/[0.08] border border-amber-400/30 flex flex-col gap-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                    <Network className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{msg.response.toolCalls.length > 1 ? `Step ${tcIdx + 1}: Hypothesis tree formulated` : "Hypothesis tree suggested"}</span>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Ready to open
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 space-y-1 font-mono">
                                  <div>
                                    <span className="text-slate-500">Hypothesis:</span>{" "}
                                    <span className="text-slate-100 font-semibold">{args.hypothesis?.title || "Thermodynamic Mechanism"}</span>
                                  </div>
                                  <div className="truncate">
                                    <span className="text-slate-500">Facility:</span>{" "}
                                    <span className="text-cyan-300">{args.validationExperiment?.facility}</span> •{" "}
                                    <span className="text-amber-300">{args.validationExperiment?.airflow}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (onAddToWhiteboard) {
                                      onAddToWhiteboard(args.question?.title || msg.content, msg.response!.citations, args);
                                    }
                                    onClose();
                                  }}
                                  className="w-full py-1.5 px-3 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs cursor-pointer active:scale-95"
                                >
                                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                                  <span>Open & Inspect Modeler (Stage 3)</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            );
                          }

                          if (tc.name === "run_combustion_simulation") {
                            const args = tc.args as RunCombustionSimulationArgs;
                            return (
                              <div
                                key={tcIdx}
                                className="p-3 rounded-lg bg-cyan-500/[0.08] border border-cyan-500/30 flex flex-col gap-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{msg.response.toolCalls.length > 1 ? `Step ${tcIdx + 1}: Simulation parameters configured` : "Simulation parameters suggested"}</span>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Ready to open
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono space-y-0.5">
                                  <div>
                                    <span className="text-slate-500">Regime:</span>{" "}
                                    <span className="text-cyan-300 font-semibold">{args.gravity}</span> •{" "}
                                    <span className="text-amber-300">{args.oxygenPct}% O₂</span> •{" "}
                                    <span className="text-slate-200">{args.pressureAtm} atm</span> •{" "}
                                    <span className="text-emerald-300">{args.fuel}</span>
                                  </div>
                                  <div className="text-slate-400 truncate">
                                    {args.description}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (onRunSimulation) {
                                      onRunSimulation(args);
                                    } else if (onOpenSimulator) {
                                      onOpenSimulator(args.gravity === "0.16g" ? "orion-lunar" : "iss");
                                    }
                                    onClose();
                                  }}
                                  className="w-full py-1.5 px-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs cursor-pointer active:scale-95"
                                >
                                  <span>🚀 Launch & View Simulation</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            );
                          }

                          if (tc.name === "inspect_optical_diagnostics") {
                            const args = tc.args as InspectOpticalDiagnosticsArgs;
                            return (
                              <div
                                key={tcIdx}
                                className="p-3 rounded-lg bg-blue-500/[0.08] border border-blue-500/30 flex flex-col gap-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                                    <span>{msg.response.toolCalls.length > 1 ? `Step ${tcIdx + 1}: Optical diagnostics calibrated` : "Optical diagnostics suggested"}</span>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Ready to open
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono">
                                  <span>Target:</span>{" "}
                                  <span className="text-blue-300 font-semibold">{args.plateId?.toUpperCase()} Flight Plate</span> •{" "}
                                  <span className="text-cyan-300 font-semibold">{args.filterMode} Mode</span>
                                  <div className="text-slate-400 truncate mt-0.5">{args.rationale}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (onOpenDiagnostics) {
                                      onOpenDiagnostics(args.plateId, args.filterMode);
                                    }
                                    onClose();
                                  }}
                                  className="w-full py-1.5 px-3 rounded-md bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs cursor-pointer active:scale-95"
                                >
                                  <span>🔬 Inspect Optical Plate & CV Filter</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            );
                          }

                          if (tc.name === "filter_research_explorer") {
                            const args = tc.args as FilterResearchExplorerArgs;
                            return (
                              <div
                                key={tcIdx}
                                className="p-3 rounded-lg bg-purple-500/[0.08] border border-purple-500/30 flex flex-col gap-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                                    <span>{msg.response.toolCalls.length > 1 ? `Step ${tcIdx + 1}: Research explorer filters isolated` : "Research filters suggested"}</span>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Ready to apply
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono">
                                  <span>Filters:</span>{" "}
                                  {args.searchQuery && <span className="text-purple-300 font-semibold">"{args.searchQuery}" </span>}
                                  {args.gravityRegimes && <span className="text-cyan-300">[{args.gravityRegimes.join(", ")}] </span>}
                                  {args.materialClasses && <span className="text-amber-300">{args.materialClasses.join(", ")}</span>}
                                </div>
                                <button
                                  onClick={() => {
                                    if (onFilterExplorer) {
                                      onFilterExplorer(args);
                                    }
                                    onClose();
                                  }}
                                  className="w-full py-1.5 px-3 rounded-md bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs cursor-pointer active:scale-95"
                                >
                                  <span>📊 View Filtered Records in Explorer</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            );
                          }

                          if (tc.name === "open_primary_evidence") {
                            const args = tc.args as OpenPrimaryEvidenceArgs;
                            return (
                              <div
                                key={tcIdx}
                                className="p-3 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/30 flex flex-col gap-2 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>{msg.response.toolCalls.length > 1 ? `Step ${tcIdx + 1}: Primary evidence source grounded` : "Source inspection suggested"}</span>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Ready to inspect
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 font-mono">
                                  <span>Claim ID:</span>{" "}
                                  <span className="text-emerald-300 font-semibold">{args.claimId}</span> •{" "}
                                  <span className="text-slate-400">Record: {args.recordId}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    if (onInspectClaim && args.recordId) {
                                      onInspectClaim(args.recordId);
                                    }
                                    onClose();
                                  }}
                                  className="w-full py-1.5 px-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs cursor-pointer active:scale-95"
                                >
                                  <span>Inspect source details</span>
                                  <ArrowRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    ) : (
                      /* Fallback Manual Launch Actions if no specific tool calls were emitted */
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Research shortcuts:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                          {onAddToWhiteboard && (
                            <button
                              onClick={() => {
                                const userQuery = messages.slice(0, messages.findIndex(m => m.id === msg.id)).reverse().find(m => m.role === "user")?.content || msg.content;
                                onAddToWhiteboard(userQuery, msg.response!.citations);
                              }}
                              className="px-2 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 transition-colors"
                            >
                              <span>🚀 Open in Modeler</span>
                            </button>
                          )}
                          {onOpenSimulator && (
                            <button
                              onClick={() => onOpenSimulator(msg.content.toLowerCase().includes("lunar") ? "orion-lunar" : "iss")}
                              className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors"
                            >
                              <span>🚀 Open Simulation</span>
                            </button>
                          )}
                          {onOpenDiagnostics && (
                            <button
                              onClick={() => onOpenDiagnostics(msg.content.toLowerCase().includes("pmma") ? "sofie" : "rtdfs")}
                              className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-colors"
                            >
                              <span>🔬 Diagnostics</span>
                            </button>
                          )}
                          {onOpenCoverageMap && (
                            <button
                              onClick={onOpenCoverageMap}
                              className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-colors"
                            >
                              <span>🗺️ Coverage Gaps</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Send to Whiteboard + Copy */}

                {/* Actions: Send to Whiteboard + Copy */}
                {msg.role === "assistant" && msg.id !== "init" && (
                  <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 text-[10px]">Review cited sources and limitations</span>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs font-mono text-slate-300 bg-[#13171e] p-3 rounded-lg border border-amber-400/20 w-fit animate-pulse">
              <Bot className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="flex flex-col">
                <span className="text-amber-300 font-semibold text-[11px]">Searching and preparing an answer…</span>
                <span className="text-[10px] text-slate-400">Thinking and grounding against NASA PSI flight records</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-2 border-t border-white/[0.04] bg-[#090a0d] overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-mono">
            <span className="text-slate-400 text-[10px] flex items-center gap-0.5 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Prompts:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-slate-100 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0c0f14]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              aria-label="Ask a research question"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask combustion questions (e.g. Saffire flame spread rates)..."
              className="flex-1 bg-[#13171e] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 font-sans"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || loading}
              className="px-3 py-2 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
            <span>NVIDIA Nemotron 30B • RAG Grounding</span>
            <span>Check sources and limitations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
