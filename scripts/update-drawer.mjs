import fs from 'node:fs';

const filePath = 'src/components/GroundedChatDrawer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the return statement starting around "if (!isOpen) return null;"
const marker = '  // Early return placed AFTER ALL HOOKS to strictly preserve hook ordering\r\n  if (!isOpen) return null;';
const markerLF = '  // Early return placed AFTER ALL HOOKS to strictly preserve hook ordering\n  if (!isOpen) return null;';

const useLF = !content.includes('\r\n');
const activeMarker = content.includes(marker) ? marker : markerLF;

if (!content.includes(activeMarker)) {
  console.error('Marker not found!');
  process.exit(1);
}

const replacement = `  // Early return placed AFTER ALL HOOKS to strictly preserve hook ordering
  if (!isOpen) return null;

  const chatContent = (
    <>
      {/* Message Thread Viewport */}
      <div
        className={\`flex-1 overflow-y-auto \${isFullPage ? "px-4 sm:px-6 md:px-10 py-6" : "px-5 py-6 sm:px-7"} space-y-6 font-sans text-sm select-text\`}
        style={{ backgroundColor: "#0a0d14" }}
      >
        <div className={isFullPage ? "max-w-4xl mx-auto space-y-6" : "space-y-6"}>
          {isFullPage && messages.length === 1 && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">IGNIS Research Intelligence Copilot</h2>
                <p className="text-xs text-slate-400 max-w-xl mx-auto">
                  Chief AI Research Officer grounded in 50 NASA Physical Sciences Informatics (PSI) flight records across microgravity, Lunar (0.16g), and Martian (0.38g) regimes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {quickPrompts.slice(0, 4).map((qp, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSend(qp.query)}
                    className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
                  >
                    <div className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                      <span>{qp.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{qp.query}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={\`flex flex-col space-y-2 \${msg.role === "user" ? "items-end" : "items-start"}\`}
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
                    <span className="text-emerald-400 font-semibold">
                      {msg.response?.model?.includes("deterministic") ? "Deterministic AI" : "Nemotron 3.5 AI"}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/20">
                      PSI Grounded
                    </span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={\`p-4 rounded-2xl \${isFullPage ? "max-w-[85%]" : "max-w-[94%]"} leading-relaxed shadow-lg \${
                  msg.role === "user"
                    ? "border border-cyan-500/35 text-slate-100 rounded-tr-sm ml-auto"
                    : "border border-white/[0.09] text-slate-200 rounded-tl-sm space-y-3.5"
                }\`}
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
                      <div className="p-3.5 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap font-mono border-t border-white/[0.04] bg-black/40 max-h-60 overflow-y-auto">
                        {msg.response.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Formatted Content */}
                {msg.role === "assistant" ? (
                  <FormattedAssistantMessage
                    content={msg.content}
                    onInspectClaim={onInspectClaim}
                    onClose={isFullPage ? undefined : onClose}
                    corpus={corpus}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                )}

                {/* Physical Boundary Warnings */}
                {msg.response?.boundaryWarnings && msg.response.boundaryWarnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-[11px] text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Physical Boundary Warnings</span>
                    </div>
                    {msg.response.boundaryWarnings.map((w, wIdx) => (
                      <p key={wIdx} className="text-[11px] text-amber-200/90 leading-relaxed pl-5">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Autonomous Mission Control Actions */}
                {msg.response?.toolCalls && msg.response.toolCalls.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Autonomous Mission Control Actions ({msg.response.toolCalls.length})</span>
                      </span>
                    </div>

                    {msg.response.toolCalls.length > 1 && onRunPipeline && (
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3">
                        <div className="text-[11px] font-mono text-cyan-200">
                          <span className="font-bold">Guided Research Pipeline:</span> {msg.response.toolCalls.length} actions ready
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const steps = buildPipelineSteps(msg);
                            onRunPipeline(steps);
                            if (!isFullPage) onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Start Guided Sequence</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      {msg.response.toolCalls.map((tc, tcIdx) => renderToolCard(tc, tcIdx, msg))}
                    </div>
                  </div>
                )}

                {/* Grounded Citation Chips */}
                {msg.response?.citations && msg.response.citations.length > 0 && (
                  <div className="pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-emerald-400" /> Verified Claims:
                    </span>
                    {msg.response.citations.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          if (onInspectClaim && c.recordId) {
                            onInspectClaim(c.recordId);
                            if (!isFullPage) onClose?.();
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-[10px] font-mono transition-colors flex items-center gap-1"
                      >
                        <span>{c.claimId}</span>
                        <span className="text-[9px] text-emerald-400/70">P.{c.pageNumber}</span>
                      </button>
                    ))}
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
      </div>

      {/* Quick Prompts Strip */}
      <div
        className="px-5 py-2.5 border-t border-white/[0.08] overflow-x-auto shrink-0"
        style={{ backgroundColor: "#0b0e15" }}
      >
        <div className={\`flex items-center gap-2 whitespace-nowrap text-[11px] font-mono \${isFullPage ? "max-w-4xl mx-auto" : ""}\`}>
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
        <div className={isFullPage ? "max-w-4xl mx-auto" : ""}>
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
              className="flex-1 border border-white/[0.12] rounded-xl px-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500 font-sans transition-colors disabled:opacity-60 shadow-inner"
              style={{ backgroundColor: "#131722" }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || loading}
              className="px-5 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
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
            <span>{selectedModel === "nemotron" ? "NVIDIA Nemotron 30B • RAG Grounding Engine" : "Local Deterministic Grounded Engine"}</span>
            <span>Strict Zero-Hallucination Flight Verification</span>
          </div>
        </div>
      </div>
    </>
  );

  // Full-Page standalone ChatGPT-style mode
  if (isFullPage) {
    return (
      <div
        role="region"
        aria-label="Research assistant"
        className="w-full flex-1 flex flex-col h-[calc(100vh-5rem)] rounded-2xl border border-white/[0.08] bg-[#0d1117] shadow-2xl relative overflow-hidden"
      >
        {/* Full-Page Header */}
        <div
          className="px-6 py-3.5 border-b border-white/[0.08] flex items-center justify-between shrink-0"
          style={{ backgroundColor: "#0e131d" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-100">
                <span>IGNIS AI Copilot</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Cpu className="w-2.5 h-2.5" /> {selectedModel === "nemotron" ? "Nemotron 30B" : "Deterministic"}
                </span>
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  {selectedRecordIds.size > 0 ? \`\${selectedRecordIds.size} Studies Active\` : \`\${corpus.length} Flight Studies\`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-sm shadow-emerald-400" />
                <span>NVIDIA Nemotron-3.5-Lightning • NASA Physical Sciences Informatics (PSI) Grounding</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector Pill */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedModel("nemotron")}
                className={\`px-2.5 py-1 text-xs rounded-md font-mono transition-colors flex items-center gap-1.5 \${
                  selectedModel === "nemotron"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }\`}
              >
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Nemotron 30B</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel("deterministic")}
                className={\`px-2.5 py-1 text-xs rounded-md font-mono transition-colors flex items-center gap-1.5 \${
                  selectedModel === "deterministic"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }\`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Deterministic</span>
              </button>
            </div>

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

            {/* Dock to Side Panel */}
            {onToggleFullPage && (
              <button
                onClick={onToggleFullPage}
                className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/[0.06] transition-colors flex items-center gap-1 text-xs font-mono"
                title="Dock to side panel"
                aria-label="Dock to side panel"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden md:inline">Dock</span>
              </button>
            )}

            {/* Back to Overview */}
            <button
              onClick={onClose}
              aria-label="Back to overview"
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/[0.06] transition-colors"
              title="Back to overview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {chatContent}
      </div>
    );
  }

  // Slide-Out Drawer Mode
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
        className={\`w-full \${
          isExpanded ? "max-w-4xl" : "max-w-2xl"
        } flex flex-col h-full shadow-2xl relative z-10 transition-all duration-300 border-l border-white/[0.12]\`}
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
                  <Cpu className="w-2.5 h-2.5" /> {selectedModel === "nemotron" ? "Nemotron 30B" : "Deterministic"}
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
            {/* Open Full Page Toggle */}
            {onToggleFullPage && (
              <button
                onClick={onToggleFullPage}
                className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/[0.06] transition-colors"
                title="Open as full page"
                aria-label="Open as full page"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

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

        {chatContent}
      </div>
    </div>
  );
}`;

const idx = content.indexOf(activeMarker);
const before = content.slice(0, idx);
const newContent = before + (useLF ? replacement : replacement.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated GroundedChatDrawer.tsx!');
