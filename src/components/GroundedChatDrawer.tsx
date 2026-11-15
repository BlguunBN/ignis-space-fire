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
  Maximize2,
  Minimize2,
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

/**
 * Rich Formatter for Assistant Responses:
 * Renders TL;DR into high-visibility executive callouts, formats flight citations
 * into interactive inspection chips, and cleanly styles physical combustion mechanisms.
 */
function FormattedAssistantMessage({
  content,
  onInspectClaim,
  onClose,
  corpus,
}: {
  content: string;
  onInspectClaim?: (recordId: string) => void;
  onClose?: () => void;
  corpus?: ExperimentRecord[];
}) {
  if (!content) return null;

  // Extract TL;DR if present
  const tldrMatch = content.match(/\*\*TL;?DR:?\*\*\s*([\s\S]*?)(?=\n\s*\n|###|$)/i);
  const tldrText = tldrMatch ? tldrMatch[1].trim() : null;
  const remainingText = tldrMatch ? content.replace(tldrMatch[0], "").trim() : content;

  const sections = remainingText.split(/\n\s*\n/);

  const resolveClaimRecordId = (claimStr: string): string | null => {
    if (!corpus) return null;
    const clean = claimStr.replace(/\[|\]/g, "").split(/[\s(]/)[0].toUpperCase();
    const found = corpus.find(
      (r) =>
        r.claim_locator_details?.claimId?.toUpperCase() === clean ||
        `CLM-${r.id.toUpperCase()}` === clean ||
        r.id.toUpperCase() === clean.replace("CLM-", "")
    );
    return found ? found.id : null;
  };

  return (
    <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed font-sans">
      {/* Featured Executive TL;DR Callout */}
      {tldrText && (
        <div
          className="p-3.5 rounded-xl border border-cyan-500/35 text-slate-100 shadow-md relative overflow-hidden"
          style={{
            backgroundColor: "#0d1b2a",
            backgroundImage: "linear-gradient(to bottom right, rgba(6, 182, 212, 0.12), rgba(15, 23, 42, 0.75))",
          }}
        >
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Key Finding · Executive TL;DR</span>
          </div>
          <p className="text-[12px] leading-relaxed text-cyan-50/95 font-sans font-medium">{tldrText}</p>
        </div>
      )}

      {/* Structured Content Sections */}
      {sections.map((section, sIdx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        // Section Headings
        if (trimmed.startsWith("###") || trimmed.startsWith("##")) {
          const headingText = trimmed.replace(/^#+\s*/, "").replace(/^[📌🔬📊⚠️🚀]\s*/, "");
          return (
            <div
              key={sIdx}
              className="pt-2 pb-1 border-b border-white/[0.08] flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{headingText}</span>
            </div>
          );
        }

        // Bulleted lists (evidence citations)
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const lines = trimmed.split("\n");
          return (
            <div key={sIdx} className="space-y-2">
              {lines.map((line, lIdx) => {
                const lineTrim = line.trim();
                if (!lineTrim) return null;

                const claimMatch = lineTrim.match(/\[(CLM-[A-Z0-9-]+)(?:\s*\((?:Page\s*)?(\d+)\))?\]/i);
                if (claimMatch) {
                  const claimId = claimMatch[1];
                  const pageNo = claimMatch[2];
                  const recordId = resolveClaimRecordId(claimId);
                  const findingText = lineTrim
                    .replace(/^[•\-*]\s*/, "")
                    .replace(/\*\*/g, "")
                    .replace(/\[CLM-[^\]]+\]:?\s*/i, "")
                    .trim();

                  return (
                    <div
                      key={lIdx}
                      className="p-2.5 rounded-lg border border-white/[0.08] flex flex-col gap-1 transition-colors hover:border-cyan-500/30"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (recordId && onInspectClaim) {
                              onInspectClaim(recordId);
                              onClose?.();
                            }
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors ${
                            recordId
                              ? "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 cursor-pointer"
                              : "bg-white/[0.05] text-slate-300 border-white/[0.1]"
                          }`}
                          title={recordId ? "Click to inspect primary source PDF in Flight Evidence Viewer" : undefined}
                        >
                          <FileCheck className="w-3 h-3 text-cyan-400" />
                          <span>{claimId}</span>
                          {pageNo && <span className="text-slate-400 font-normal">p.{pageNo}</span>}
                        </button>
                        {recordId && (
                          <button
                            type="button"
                            onClick={() => {
                              onInspectClaim?.(recordId);
                              onClose?.();
                            }}
                            className="text-[10px] font-mono text-cyan-400/90 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            Inspect PDF <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal font-sans pl-0.5">
                        {findingText}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={lIdx} className="flex items-start gap-2 text-[11px] text-slate-300 pl-1">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{lineTrim.replace(/^[•\-*]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <p key={sIdx} className="text-[12px] text-slate-300 leading-relaxed font-sans">
            {trimmed.replace(/\*\*(.*?)\*\*/g, "$1")}
          </p>
        );
      })}
    </div>
  );
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
      timestamp: "Ready",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const sentPromptRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Prevent background scrolling while chat drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scrollToBottom]);

  // Auto-scroll when new messages arrive or loading state changes
  useEffect(() => {
    if (isOpen) {
      scrollToBottom(true);
    }
  }, [isOpen, messages.length, loading, scrollToBottom]);

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

  // Auto-send initial prompt if passed
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
    { label: "🌙 Artemis Lunar (0.16g / 56 kPa)", query: "Formulate Artemis Lunar (0.16g / 56kPa) hypothesis tree" },
    { label: "💧 Droplet Cool-Flame Extinction", query: "Model droplet cool-flame extinction in microgravity" },
    { label: "💨 Saffire vs BASS Flame Spread", query: "Compare Saffire vs BASS forced airflow flame spread" },
    { label: "🔬 SoFIE GEL Conduction Sink", query: "Thick fuel conduction heat sink (SoFIE GEL)" },
    { label: "🪐 Martian 0.38g Combustion", query: "Can we predict Martian 0.38g combustion from this data?" },
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
        <div
          key={tcIdx}
          className="p-3.5 rounded-xl border border-white/[0.09] flex flex-col gap-2.5 shadow-sm"
          style={{ backgroundColor: "#131824" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
              <info.icon className={`w-3.5 h-3.5 ${colorMap[color]}`} />
              <span>{label}</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium border ${chipColor}`}>
              Ready to run
            </span>
          </div>
          {onRun && (
            <button
              onClick={onRun}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow ${btnColorMap[buttonVariant]}`}
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

  // Early return placed AFTER ALL HOOKS to strictly preserve hook ordering
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(3, 7, 18, 0.85)" }}
      aria-modal="true"
      role="dialog"
      aria-label="Research assistant"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${
          isExpanded ? "max-w-4xl" : "max-w-2xl"
        } flex flex-col h-full shadow-2xl relative z-10 transition-all duration-300 border-l border-white/[0.12]`}
        style={{
          backgroundColor: "#0d1117",
          boxShadow: "-16px 0 48px rgba(0, 0, 0, 0.92), -1px 0 0 rgba(255, 255, 255, 0.08)",
          outline: "none",
        }}
      >
        {/* Aerospace Telemetry Drawer Header */}
        <div
          className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0"
          style={{ backgroundColor: "#0e131d" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-100">
                <span>Research Intelligence Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Cpu className="w-2.5 h-2.5" /> Nemotron 30B
                </span>
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  50 Flight Studies
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-sm shadow-emerald-400" />
                <span>NVIDIA Nemotron-3.5-Lightning • NASA Physical Sciences Informatics (PSI)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Maximize / Collapse Width Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/[0.06] transition-colors"
              title={isExpanded ? "Collapse to standard width" : "Expand to wide view"}
              aria-label={isExpanded ? "Collapse width" : "Expand width"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Clear Conversation */}
            <button
              onClick={() =>
                setMessages([
                  {
                    id: "init",
                    role: "assistant",
                    content:
                      "Conversation cleared. Ask a question about the research library to begin.",
                    timestamp: "Ready",
                  },
                ])
              }
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/[0.06] transition-colors"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close Drawer */}
            <button
              onClick={onClose}
              aria-label="Close assistant"
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Viewport */}
        <div
          className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 space-y-6 font-sans text-sm select-text"
          style={{ backgroundColor: "#0a0d14" }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {/* Message Meta Info */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 px-1">
                {msg.role === "user" ? (
                  <>
                    <span className="text-cyan-300 font-medium">Researcher</span>
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Nemotron 3.5 AI</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20">
                      PSI Grounded
                    </span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl max-w-[94%] leading-relaxed shadow-lg ${
                  msg.role === "user"
                    ? "border border-cyan-500/35 text-slate-100 rounded-tr-sm"
                    : "border border-white/[0.09] text-slate-200 rounded-tl-sm space-y-3.5"
                }`}
                style={{
                  backgroundColor: msg.role === "user" ? "#0c1d2e" : "#111622",
                }}
              >
                {/* Nemotron Thinking / Reasoning Process Dropdown */}
                {msg.response?.reasoning && (
                  <div
                    className="mb-3 rounded-xl border border-white/[0.08] overflow-hidden text-[11px] font-mono shadow-sm"
                    style={{ backgroundColor: "#080c14" }}
                  >
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 transition-colors text-left border-b border-white/[0.06]"
                      aria-expanded={expandedReasoning[msg.id]}
                      aria-label="Toggle response details"
                    >
                      <span className="flex items-center gap-2 text-[11px] text-slate-200 font-semibold">
                        <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Chain-of-Thought Reasoning & Grounding Audit</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.1] font-semibold">
                          Nemotron 30B CoT
                        </span>
                        {expandedReasoning[msg.id] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    </button>
                    {expandedReasoning[msg.id] && (
                      <div
                        className="p-3.5 text-slate-300 text-[10px] leading-relaxed max-h-72 overflow-y-auto font-mono space-y-1.5"
                        style={{ backgroundColor: "#060910" }}
                      >
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
                {msg.role === "assistant" ? (
                  <FormattedAssistantMessage
                    content={msg.content}
                    onInspectClaim={onInspectClaim}
                    onClose={onClose}
                    corpus={corpus}
                  />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed text-sm font-sans">{msg.content}</div>
                )}

                {/* Citation Pills on Assistant Responses */}
                {msg.response && msg.response.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2">
                    <span className="text-[11px] font-mono font-medium text-slate-400 block flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified NASA PSI Flight Sources (Select to inspect PDF):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.response.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onInspectClaim(c.recordId);
                            onClose();
                          }}
                          className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/15 text-cyan-300 hover:text-cyan-200 border border-white/[0.09] hover:border-cyan-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
                          title={c.quote}
                          aria-label={`Inspect source ${c.claimId} page ${c.pageNumber}`}
                        >
                          <FileCheck className="w-3 h-3 text-cyan-400" />
                          <span>{c.claimId}</span>
                          <span className="text-slate-400 text-[10px]">(p.{c.pageNumber})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Physical Boundary Warnings */}
                {msg.response && msg.response.boundaryWarnings.length > 0 && (
                  <div
                    className="mt-3 p-3 rounded-xl border border-amber-500/25 text-[11px] font-mono text-amber-300 space-y-1.5"
                    style={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Physical Boundary Guard</span>
                    </div>
                    {msg.response.boundaryWarnings.map((w, i) => (
                      <p key={i} className="text-slate-200 text-[11px] font-sans pl-1">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* AI Agent Tool-Call Execution Cards */}
                {msg.role === "assistant" && msg.id !== "init" && msg.response && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.08] space-y-2.5">
                    {msg.response.toolCalls && msg.response.toolCalls.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 fill-current text-cyan-400" />
                            <span>Suggested Research Actions ({msg.response.toolCalls.length}):</span>
                          </span>
                          <span className="text-cyan-400/90 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30 text-[9px] font-bold">
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
                            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow"
                          >
                            <Zap className="w-4 h-4 fill-current" />
                            <span>Execute Guided Sequence ({msg.response.toolCalls.length} Steps)</span>
                          </button>
                        )}

                        {msg.response.toolCalls.map((tc, tcIdx) => renderToolCard(tc, tcIdx, msg))}
                      </>
                    ) : (
                      /* Fallback Manual Launch Actions if no specific tool calls were emitted */
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono text-cyan-400 block flex items-center gap-1 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Research Tool Shortcuts:</span>
                        </span>
                        <div className="flex flex-wrap gap-2 font-mono text-[10px]">
                          {onAddToWhiteboard && (
                            <button
                              onClick={() => {
                                const userQuery =
                                  messages.slice(0, messages.findIndex((m) => m.id === msg.id)).reverse().find((m) => m.role === "user")?.content ||
                                  msg.content;
                                onAddToWhiteboard(userQuery, msg.response!.citations);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 transition-colors text-xs font-semibold"
                            >
                              <span>Open in Modeler</span>
                            </button>
                          )}
                          {onOpenSimulator && (
                            <button
                              onClick={() => onOpenSimulator(msg.content.toLowerCase().includes("lunar") ? "orion-lunar" : "iss")}
                              className="px-3 py-1.5 rounded-lg bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 transition-colors text-xs font-semibold"
                            >
                              <span>Physics Simulator</span>
                            </button>
                          )}
                          {onOpenDiagnostics && (
                            <button
                              onClick={() => onOpenDiagnostics(msg.content.toLowerCase().includes("pmma") ? "sofie" : "rtdfs")}
                              className="px-3 py-1.5 rounded-lg bg-blue-400/15 hover:bg-blue-400/25 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 transition-colors text-xs font-semibold"
                            >
                              <span>Flame Diagnostics</span>
                            </button>
                          )}
                          {onOpenCoverageMap && (
                            <button
                              onClick={onOpenCoverageMap}
                              className="px-3 py-1.5 rounded-lg bg-purple-400/15 hover:bg-purple-400/25 text-purple-300 border border-purple-400/30 flex items-center gap-1.5 transition-colors text-xs font-semibold"
                            >
                              <span>Coverage Matrix</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Copy & Verification Info */}
                {msg.role === "assistant" && msg.id !== "init" && (
                  <div className="mt-2 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 text-[10px]">
                      Grounded against NASA PSI flight records
                    </span>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors px-2 py-0.5 rounded hover:bg-white/[0.05]"
                      aria-label={copiedId === msg.id ? "Copied to clipboard" : "Copy message"}
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy answer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/[0.1] w-fit shadow-xl"
              style={{ backgroundColor: "#111622" }}
            >
              <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
              <div className="flex flex-col">
                <span className="text-cyan-400 font-semibold text-xs font-mono">
                  Synthesizing and grounding against NASA PSI flight records…
                </span>
                <span className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Analyzing flammability boundaries, heat transfer limits, and flight citations
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Strip */}
        <div
          className="px-5 py-3 border-t border-white/[0.08] overflow-x-auto shrink-0"
          style={{ backgroundColor: "#0b0e15" }}
        >
          <div className="flex items-center gap-2 whitespace-nowrap text-[11px] font-mono">
            <span className="text-slate-400 text-[10px] flex items-center gap-1 mr-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Quick Inquiries:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.query)}
                className="px-3 py-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-slate-100 transition-colors text-xs shrink-0 flex items-center gap-1.5"
              >
                <span>{qp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div
          className="p-4 sm:p-5 border-t border-white/[0.08] shrink-0"
          style={{ backgroundColor: "#0e131d" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2.5"
          >
            <input
              ref={inputRef}
              aria-label="Ask a research question"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask combustion research questions (e.g., Saffire flame spread rates)..."
              disabled={loading}
              className="flex-1 border border-white/[0.12] rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500 font-sans transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#131722" }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Thinking</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2.5 px-1">
            <span>NVIDIA Nemotron 30B • RAG Grounding Engine</span>
            <span>Strict Zero-Hallucination Flight Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
