"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  ArrowRight,
  Eye,
  Filter,
  Cpu,
  Zap,
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
  IngestResearchPaperArgs,
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
  onRunPipeline?: (steps: Array<() => void>) => void;
  onOpenIngestion?: () => void;
  onConsumeInitialPrompt?: () => void;
}

const TOOL_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  build_hypothesis_tree: { label: "Hypothesis tree", icon: BrainCircuit, color: "amber" },
  run_combustion_simulation: { label: "Combustion simulation", icon: Sparkles, color: "cyan" },
  inspect_optical_diagnostics: { label: "Optical diagnostics", icon: Eye, color: "blue" },
  filter_research_explorer: { label: "Research explorer filter", icon: Filter, color: "purple" },
  open_primary_evidence: { label: "Primary source inspection", icon: FileCheck, color: "emerald" },
  ingest_research_paper: { label: "Paper Ingestion & Gatekeeper Audit", icon: ShieldCheck, color: "cyan" },
};

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
  onRunPipeline,
  onOpenIngestion,
  onConsumeInitialPrompt,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const sentPromptRef = useRef<string | null>(null);

  const handleSend = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      try {
        // 1. Try Live Route Handler (/api/chat with NVIDIA Nemotron 3.5)
        let grounded: NemotronResponse;

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: trimmed }],
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
            const localFallback = generateGroundedAssistantResponse(trimmed, targetCorpus);
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
          const localFallback = generateGroundedAssistantResponse(trimmed, targetCorpus);
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
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [corpus, selectedRecordIds]
  );

  // Auto-send initial prompt if passed (strictly at most once per prompt)
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      const promptToSend = initialPrompt.trim();
      if (sentPromptRef.current !== promptToSend) {
        sentPromptRef.current = promptToSend;
        onConsumeInitialPrompt?.();
        handleSend(promptToSend);
      }
    } else if (!isOpen) {
      sentPromptRef.current = null;
    }
  }, [isOpen, initialPrompt, handleSend, onConsumeInitialPrompt]);

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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildPipelineSteps = useCallback(
    (msg: ChatMessage): Array<() => void> => {
      const steps: Array<() => void> = [];
      for (const call of msg.response?.toolCalls ?? []) {
        if (call.name === "filter_research_explorer" && onFilterExplorer) {
          steps.push(() => onFilterExplorer(call.args as FilterResearchExplorerArgs));
        } else if (call.name === "build_hypothesis_tree" && onAddToWhiteboard) {
          steps.push(() =>
            onAddToWhiteboard((call.args as BuildHypothesisTreeArgs).question?.title || msg.content, msg.response?.citations, call.args as BuildHypothesisTreeArgs)
          );
        } else if (call.name === "run_combustion_simulation" && onRunSimulation) {
          steps.push(() => onRunSimulation(call.args as RunCombustionSimulationArgs));
        } else if (call.name === "run_combustion_simulation" && onOpenSimulator) {
          steps.push(() =>
            onOpenSimulator((call.args as RunCombustionSimulationArgs).gravity === "0.16g" ? "orion-lunar" : "iss")
          );
        } else if (call.name === "inspect_optical_diagnostics" && onOpenDiagnostics) {
          steps.push(() => onOpenDiagnostics((call.args as InspectOpticalDiagnosticsArgs).plateId, (call.args as InspectOpticalDiagnosticsArgs).filterMode));
        } else if (call.name === "open_primary_evidence" && (call.args as OpenPrimaryEvidenceArgs).recordId) {
          steps.push(() => onInspectClaim((call.args as OpenPrimaryEvidenceArgs).recordId));
        } else if (call.name === "ingest_research_paper" && onOpenIngestion) {
          steps.push(() => onOpenIngestion());
        }
      }
      return steps;
    },
    [onFilterExplorer, onAddToWhiteboard, onRunSimulation, onOpenSimulator, onOpenDiagnostics, onInspectClaim, onOpenIngestion]
  );

  const renderToolCard = useCallback(
    (tc: AgentToolCall, tcIdx: number, msg: ChatMessage) => {
      const info = TOOL_LABELS[tc.name] ?? { label: tc.name, icon: Sparkles, color: "slate" };
      const isMulti = (msg.response?.toolCalls?.length ?? 0) > 1;
      const label = isMulti ? `Step ${tcIdx + 1}: ${info.label}` : info.label;
      const color = info.color;
      const colorMap: Record<string, string> = {
        amber: "bg-amber-500/10 border border-amber-500/20 text-amber-300",
        cyan: "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300",
        blue: "bg-blue-500/10 border border-blue-500/20 text-blue-300",
        purple: "bg-purple-500/10 border border-purple-500/20 text-purple-300",
        emerald: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300",
        slate: "bg-slate-700/10 border border-slate-700/20 text-slate-300",
      };
      const chipColor = `bg-${color === "slate" ? "slate-700" : color}-500/[0.12] border border-${color}-500/[0.25] text-${color === "slate" ? "slate-400" : color}-300`;

      let onRun: (() => void) | undefined;
      let buttonVariant: "amber" | "cyan" | "blue" | "purple" | "emerald" | "slate" = color as any;
      let btnLabel: string;
      let BtnIcon: React.ElementType;

      if (tc.name === "build_hypothesis_tree") {
        const args = tc.args as BuildHypothesisTreeArgs;
        onRun = () => {
          if (onAddToWhiteboard) {
            onAddToWhiteboard(args.question?.title || msg.content, msg.response!.citations, args);
          }
          onClose?.();
        };
        btnLabel = "Open & Inspect Modeler";
        BtnIcon = Sparkles;
        buttonVariant = "amber";
      } else if (tc.name === "run_combustion_simulation") {
        const args = tc.args as RunCombustionSimulationArgs;
        onRun = () => {
          if (onRunSimulation) {
            onRunSimulation(args);
          } else if (onOpenSimulator) {
            onOpenSimulator(args.gravity === "0.16g" ? "orion-lunar" : "iss");
          }
          onClose?.();
        };
        btnLabel = "Launch & View Simulation";
        BtnIcon = ArrowRight;
        buttonVariant = "blue";
      } else if (tc.name === "inspect_optical_diagnostics") {
        const args = tc.args as InspectOpticalDiagnosticsArgs;
        onRun = () => {
          if (onOpenDiagnostics) {
            onOpenDiagnostics(args.plateId, args.filterMode);
          }
          onClose?.();
        };
        btnLabel = "Inspect Optical Plate";
        BtnIcon = Eye;
        buttonVariant = "blue";
      } else if (tc.name === "filter_research_explorer") {
        const args = tc.args as FilterResearchExplorerArgs;
        onRun = () => {
          if (onFilterExplorer) {
            onFilterExplorer(args);
          }
          onClose?.();
        };
        btnLabel = "View Filtered Records";
        BtnIcon = Filter;
        buttonVariant = "purple";
      } else if (tc.name === "open_primary_evidence") {
        const args = tc.args as OpenPrimaryEvidenceArgs;
        onRun = () => {
          if (onInspectClaim && args.recordId) {
            onInspectClaim(args.recordId);
          }
          onClose?.();
        };
        btnLabel = "Inspect Source Details";
        BtnIcon = FileCheck;
        buttonVariant = "emerald";
      } else if (tc.name === "ingest_research_paper") {
        onRun = () => {
          if (onOpenIngestion) {
            onOpenIngestion();
          }
          onClose?.();
        };
        btnLabel = "Audit & Ingest Paper";
        BtnIcon = ShieldCheck;
        buttonVariant = "cyan";
      } else {
        return null;
      }

      const btnColorMap: Record<string, string> = {
        amber: "bg-amber-400 hover:bg-amber-300 text-slate-950",
        cyan: "bg-cyan-400 hover:bg-cyan-300 text-slate-950",
        blue: "bg-blue-400 hover:bg-blue-300 text-slate-950",
        purple: "bg-purple-400 hover:bg-purple-300 text-slate-950",
        emerald: "bg-emerald-400 hover:bg-emerald-300 text-slate-950",
        slate: "bg-slate-400 hover:bg-slate-300 text-slate-950",
      };

      return (
        <div key={tcIdx} className="p-3 rounded-lg border hairline flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
              <info.icon className={`w-3.5 h-3.5 ${colorMap[color]}`} />
              <span>{label}</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium border hairline {chipColor}">
              Ready to run
            </span>
          </div>
          {onRun && (
            <button
              onClick={onRun}
              className={`w-full py-1.5 px-3 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnColorMap[buttonVariant]}`}
            >
              <BtnIcon className="w-3.5 h-3.5" />
              <span>{btnLabel}</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>
      );
    },
    [onAddToWhiteboard, onRunSimulation, onOpenSimulator, onOpenDiagnostics, onFilterExplorer, onInspectClaim, onOpenIngestion, onClose]
  );

  // Early return is placed AFTER ALL HOOKS to strictly preserve hook ordering
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
      aria-label="Research assistant"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-[#0a0d14] border-l border-white/[0.1] flex flex-col h-full shadow-2xl relative z-10 animate-in slide-in-from-right duration-200"
        style={{ outline: "none" }}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0d111a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-100">
                <span>Research intelligence assistant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                  <Cpu className="w-2.5 h-2.5" /> Nemotron 30B
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
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
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-white/[0.06] transition-colors"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close assistant"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Viewport */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 space-y-5 font-sans text-sm bg-[#0a0d14]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 px-1">
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
                className={`p-4 rounded-2xl max-w-[92%] leading-relaxed shadow-lg ${
                  msg.role === "user"
                    ? "bg-cyan-950/30 border border-cyan-500/30 text-slate-100 rounded-tr-sm"
                    : "bg-[#11151f] border border-white/[0.08] text-slate-200 rounded-tl-sm space-y-3"
                }`}
              >
                {/* Nemotron Thinking / Reasoning Process Dropdown */}
                {msg.response?.reasoning && (
                  <div className="mb-3 rounded-lg border border-white/[0.08] bg-[#0c0f16] overflow-hidden text-[11px] font-mono">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full px-3 py-2 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 transition-colors text-left border-b border-white/[0.06]"
                      aria-expanded={expandedReasoning[msg.id]}
                      aria-label="Toggle response details"
                    >
                      <span className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold">
                        <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Response details</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.1] font-semibold">
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
                      <div className="p-3 text-slate-300 text-[10px] leading-relaxed max-h-72 overflow-y-auto font-mono space-y-1 bg-black/40">
                        {msg.response.reasoning.split("\n").map((line, idx) => {
                          if (line.startsWith("[")) {
                            return (
                              <div key={idx} className="text-cyan-400 font-bold mt-2 pt-1 border-t border-white/[0.06]">
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
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Citation Pills on Assistant Responses */}
                {msg.response && msg.response.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08] space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 block">
                      Verified flight sources (select to inspect):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.response.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onInspectClaim(c.recordId);
                            onClose();
                          }}
                          className="text-[11px] font-mono font-medium px-2 py-1 rounded bg-white/[0.04] hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 border border-white/[0.08] hover:border-cyan-500/30 transition-colors flex items-center gap-1"
                          title={c.quote}
                          aria-label={`Inspect source ${c.claimId} page ${c.pageNumber}`}
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>{c.claimId}</span>
                          <span className="text-slate-500 text-[10px]">(p.{c.pageNumber})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boundary Warnings */}
                {msg.response && msg.response.boundaryWarnings.length > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-[11px] font-mono text-amber-300 space-y-1">
                    <div className="flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Physical boundary guard</span>
                    </div>
                    {msg.response.boundaryWarnings.map((w, i) => (
                      <p key={i} className="text-slate-300 text-[10px]">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* AI Agent Tool-Call Execution Cards */}
                {msg.role === "assistant" && msg.id !== "init" && msg.response && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08] space-y-2">
                    {msg.response.toolCalls && msg.response.toolCalls.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                            <Zap className="w-3 h-3 fill-current text-cyan-400" />
                            <span>Suggested research steps ({msg.response.toolCalls.length}):</span>
                          </span>
                          <span className="text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20 text-[9px]">
                            {msg.response.toolCalls.length > 1 ? "Guided sequence" : "Single action"}
                          </span>
                        </div>

                        {msg.response.toolCalls.length > 1 && onRunPipeline && (
                          <button
                            type="button"
                            onClick={() => {
                              const steps = buildPipelineSteps(msg);
                              onRunPipeline(steps);
                              onClose();
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Start guided sequence</span>
                          </button>
                        )}

                        {msg.response.toolCalls.map((tc, tcIdx) => renderToolCard(tc, tcIdx, msg))}
                      </>
                    ) : (
                      /* Fallback Manual Launch Actions if no specific tool calls were emitted */
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono text-cyan-400 block flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Research shortcuts:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                          {onAddToWhiteboard && (
                            <button
                              onClick={() => {
                                const userQuery =
                                  messages.slice(0, messages.findIndex((m) => m.id === msg.id)).reverse().find((m) => m.role === "user")?.content ||
                                  msg.content;
                                onAddToWhiteboard(userQuery, msg.response!.citations);
                              }}
                              className="px-2.5 py-1 rounded-md bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 transition-colors text-xs"
                            >
                              <span>Open in Modeler</span>
                            </button>
                          )}
                          {onOpenSimulator && (
                            <button
                              onClick={() => onOpenSimulator(msg.content.toLowerCase().includes("lunar") ? "orion-lunar" : "iss")}
                              className="px-2.5 py-1 rounded-md bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1 transition-colors text-xs"
                            >
                              <span>Open Simulation</span>
                            </button>
                          )}
                          {onOpenDiagnostics && (
                            <button
                              onClick={() => onOpenDiagnostics(msg.content.toLowerCase().includes("pmma") ? "sofie" : "rtdfs")}
                              className="px-2.5 py-1 rounded-md bg-blue-400/10 hover:bg-blue-400/20 text-blue-300 border border-blue-400/30 flex items-center gap-1 transition-colors text-xs"
                            >
                              <span>Diagnostics</span>
                            </button>
                          )}
                          {onOpenCoverageMap && (
                            <button
                              onClick={onOpenCoverageMap}
                              className="px-2.5 py-1 rounded-md bg-purple-400/10 hover:bg-purple-400/20 text-purple-300 border border-purple-400/30 flex items-center gap-1 transition-colors text-xs"
                            >
                              <span>Coverage Gaps</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Copy */}
                {msg.role === "assistant" && msg.id !== "init" && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500 text-[11px]">Review cited sources and limitations</span>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label={copiedId === msg.id ? "Copied to clipboard" : "Copy message"}
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
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-[#10141d] w-fit shadow-md">
              <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="flex flex-col">
                <span className="text-cyan-400 font-semibold text-xs font-mono">Searching and preparing an answer…</span>
                <span className="text-[11px] text-slate-400 font-sans">Thinking and grounding against NASA PSI flight records</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#0c0f16] overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-mono">
            <span className="text-slate-400 text-[10px] flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Prompts:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-slate-100 transition-colors text-xs"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0d111a] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              aria-label="Ask a research question"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask combustion questions (e.g. Saffire flame spread rates)..."
              className="flex-1 bg-[#131722] border border-white/[0.12] rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500 font-sans"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
            <span>NVIDIA Nemotron 30B • RAG Grounding</span>
            <span>Check sources and limitations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
