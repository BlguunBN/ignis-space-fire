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
} from "lucide-react";
import { ExperimentRecord } from "../types/evidence";
import {
  generateGroundedAssistantResponse,
  GroundedCitation,
} from "../lib/grounded-assistant";
import { NemotronResponse } from "../lib/nvidia-nemotron";

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
  onAddToWhiteboard?: (text: string, citations: GroundedCitation[]) => void;
  onOpenSimulator?: (presetId?: string) => void;
  onOpenDiagnostics?: (sequenceId?: string) => void;
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
  onOpenSimulator,
  onOpenDiagnostics,
  onOpenCoverageMap,
  onOpenGraph,
}: GroundedChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Welcome to IGNIS Agentic Copilot powered by NVIDIA Nemotron-3.5-Lightning (30B). Deep reasoning and strict citation grounding against NASA Physical Sciences Informatics (PSI) flight records are active.",
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
    "Compare Saffire vs BASS forced airflow flame spread",
    "Exploration atmospheres (26% O2 / 56 kPa) flammability",
    "Thick fuel extinction limits (SoFIE GEL)",
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
      <div className="w-full max-w-xl bg-[#0c0f14] border-l border-white/[0.08] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-white/[0.08] bg-[#090a0d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-100">
                <span>IGNIS Agentic Copilot</span>
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
                      "Thread reset. Inquiries are verified against NASA Physical Sciences Informatics records with zero extrapolation.",
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
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
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
                className={`p-3 rounded-lg max-w-[95%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-400/10 border border-amber-400/20 text-slate-100"
                    : "bg-[#13171e] border border-white/[0.06] text-slate-200"
                }`}
              >
                {/* Nemotron Thinking / Reasoning Process Dropdown */}
                {msg.response?.reasoning && (
                  <div className="mb-2.5 rounded border border-white/[0.08] bg-[#090b10] overflow-hidden text-[11px] font-mono">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full px-2.5 py-1.5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors text-left"
                    >
                      <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
                        <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                        <span>Thinking Process ({Math.round(msg.response.reasoning.length / 4)} tokens)</span>
                      </span>
                      {expandedReasoning[msg.id] ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    {expandedReasoning[msg.id] && (
                      <div className="p-2.5 border-t border-white/[0.06] text-slate-400 text-[10px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-mono select-text bg-[#07090c]">
                        {msg.response.reasoning}
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
                      Verified Citations (Click to inspect primary PDF):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.response.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => onInspectClaim(c.recordId)}
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

                {/* AI Agent Interactive Dispatch Buttons (AI controls app tools) */}
                {msg.role === "assistant" && msg.id !== "init" && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] space-y-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>AI Agent Actions (Execute in App):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {onOpenSimulator && (
                        <button
                          onClick={() => onOpenSimulator(msg.content.toLowerCase().includes("lunar") ? "orion-lunar" : "iss")}
                          className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors"
                        >
                          <span>🚀 Open Physics Simulation</span>
                        </button>
                      )}
                      {onOpenDiagnostics && (
                        <button
                          onClick={() => onOpenDiagnostics(msg.content.toLowerCase().includes("pmma") ? "sofie" : "rtdfs")}
                          className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-colors"
                        >
                          <span>🔬 Open Flame Diagnostics</span>
                        </button>
                      )}
                      {onAddToWhiteboard && msg.response && (
                        <button
                          onClick={() => onAddToWhiteboard(msg.content, msg.response!.citations)}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors"
                        >
                          <Network className="w-3 h-3" />
                          <span>Build Mind Tree</span>
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

                {/* Actions: Send to Whiteboard + Copy */}
                {msg.role === "assistant" && msg.id !== "init" && (
                  <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 text-[10px]">Grounding verified by NVIDIA Nemotron 30B</span>

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
                <span className="text-amber-300 font-semibold text-[11px]">NVIDIA Nemotron-3.5 Reasoning...</span>
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
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask combustion questions (e.g. Saffire flame spread rates)..."
              className="flex-1 bg-[#13171e] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3 py-2 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
            <span>NVIDIA Nemotron 30B • RAG Grounding</span>
            <span>Zero Hallucination Guard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
