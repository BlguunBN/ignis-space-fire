"use client";

import React, { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import experimentsData from "../data/experiments.json";
import { ExperimentRecord, SearchQuery } from "../types/evidence";
import { Header } from "../components/Header";
import { SearchAndFilters } from "../components/SearchAndFilters";
import { ComparisonTable } from "../components/ComparisonTable";
import { InvestigationDetail } from "../components/InvestigationDetail";
import { TelemetryChart } from "../components/TelemetryChart";
import { GroundedBriefDrawer } from "../components/GroundedBriefDrawer";
import { CompareModal } from "../components/CompareModal";
import { PDFEvidenceViewer } from "../components/PDFEvidenceViewer";
import { CoverageMapModal } from "../components/CoverageMapModal";
import { SourcesModal } from "../components/SourcesModal";
import { WhiteboardStudioModal } from "../components/WhiteboardStudioModal";
import { GroundedChatDrawer } from "../components/GroundedChatDrawer";
import { RelationshipGraphModal } from "../components/RelationshipGraphModal";
import { IngestionReviewModal } from "../components/IngestionReviewModal";
import { CombustionSimulatorModal } from "../components/CombustionSimulatorModal";
import { ResearchExplorerGrid } from "../components/ResearchExplorerGrid";
import { ExecutiveAnalyticsDashboard } from "../components/ExecutiveAnalyticsDashboard";
import { PaperUploadModal } from "../components/PaperUploadModal";
import { GuidedResearchStepper, GuidedStep } from "../components/GuidedResearchStepper";
import { generateDeterministicBrief } from "../lib/synthesis";
import { resolveActiveStudy } from "../lib/active-study";
import { takeNextAction } from "../lib/guided-actions";

import {
  BuildHypothesisTreeArgs,
  RunCombustionSimulationArgs,
  InspectOpticalDiagnosticsArgs,
  FilterResearchExplorerArgs,
} from "../lib/agent-tools";

export default function UnifiedWorkspace() {
  const [corpus, setCorpus] = useState<ExperimentRecord[]>(experimentsData as ExperimentRecord[]);
  const [query, setQuery] = useState<SearchQuery>({});
  const [activeId, setActiveId] = useState<string | null>(corpus[0]?.id || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(corpus.map((r) => r.id))
  );

  // View States: Executive Dashboard vs Research Explorer vs Split Workspace
  const [viewMode, setViewMode] = useState<"dashboard" | "explorer" | "split">("dashboard");
  const [guidedStep, setGuidedStep] = useState<GuidedStep>("explore");
  const [pendingActions, setPendingActions] = useState<Array<() => void>>([]);
  const [explorerResetKey, setExplorerResetKey] = useState(0);

  // Modal States
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedStagedIdForReview, setSelectedStagedIdForReview] = useState<string | null>(null);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string | null>(null);
  const [whiteboardInitialPrompt, setWhiteboardInitialPrompt] = useState<string | null>(null);
  const [whiteboardInitialTree, setWhiteboardInitialTree] = useState<BuildHypothesisTreeArgs | null>(null);
  const [whiteboardSynthesis, setWhiteboardSynthesis] = useState<string | null>(null);
  const [simulatorInitialTab, setSimulatorInitialTab] = useState<"physics" | "diagnostics">("physics");
  const [simulatorInitialConfig, setSimulatorInitialConfig] = useState<RunCombustionSimulationArgs | null>(null);
  const [simulatorInitialDiagConfig, setSimulatorInitialDiagConfig] = useState<InspectOpticalDiagnosticsArgs | null>(null);
  const [explorerFilters, setExplorerFilters] = useState<{
    searchQuery?: string;
    gravity?: "all" | "microgravity" | "partial_gravity" | "lunar" | "martian" | "terrestrial";
    material?: "all" | "liquid_droplets" | "pmma" | "fabrics_cellulose" | "wire_insulation" | "gaseous_fuels" | "other_solids";
    oxygenRange?: [number, number];
  }>({});

  // Configure Fuse.js for fuzzy retrieval
  const fuse = useMemo(() => {
    return new Fuse(corpus, {
      keys: [
        "investigation",
        "programme",
        "material",
        "material_class",
        "finding",
        "platform",
        "fire_safety_relevance",
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [corpus]);

  // Filter records based on freeText + structured physics conditions + facility + sorting
  const filteredRecords = useMemo(() => {
    let result = [...corpus];

    // Free text fuzzy filter
    if (query.freeText && query.freeText.trim() !== "") {
      const fuseResults = fuse.search(query.freeText.trim());
      result = fuseResults.map((fr) => fr.item);
    }

    // Material filter
    if (query.material && query.material.trim() !== "") {
      const qMat = query.material.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.material.toLowerCase().includes(qMat) ||
          r.material_class.toLowerCase().includes(qMat)
      );
    }

    // Facility filter
    if (query.facility) {
      const fac = query.facility.toLowerCase();
      result = result.filter((r) => {
        const plat = r.platform.toLowerCase();
        const inv = r.investigation.toLowerCase();
        if (fac === "saffire") return plat.includes("cygnus") || inv.includes("saffire");
        if (fac === "cir") return plat.includes("cir") || inv.includes("flex");
        if (fac === "msg") return plat.includes("msg") || inv.includes("bass");
        return true;
      });
    }

    // Tolerance values based on mode
    const tolMode = query.toleranceMode || "standard";
    const o2Tol = tolMode === "strict" ? 0.5 : tolMode === "wide" ? 3.0 : 1.5;
    const airflowTol = tolMode === "strict" ? 1.5 : tolMode === "wide" ? 6.0 : 3.0;
    const pressTol = tolMode === "strict" ? 5.0 : tolMode === "wide" ? 20.0 : 10.0;

    // Oxygen filter
    if (query.oxygenPct != null) {
      result = result.filter((r) => {
        if (r.oxygen_pct == null) return false;
        return Math.abs(r.oxygen_pct - (query.oxygenPct as number)) <= o2Tol;
      });
    }

    // Airflow filter
    if (query.airflowCmS != null) {
      result = result.filter((r) => {
        if (r.airflow_cm_s == null) return false;
        return Math.abs(r.airflow_cm_s - (query.airflowCmS as number)) <= airflowTol;
      });
    }

    // Pressure filter
    if (query.pressureKpa != null) {
      result = result.filter((r) => {
        if (r.pressure_kpa == null) return false;
        return Math.abs(r.pressure_kpa - (query.pressureKpa as number)) <= pressTol;
      });
    }

    // Gravity filter
    if (query.gravity) {
      if (query.gravity === "microgravity") {
        result = result.filter((r) => r.gravity === "microgravity");
      } else if (query.gravity === "partial_gravity") {
        result = result.filter(
          (r) =>
            r.gravity === "partial_gravity" ||
            r.investigation.toLowerCase().includes("lunar") ||
            r.investigation.toLowerCase().includes("martian")
        );
      } else {
        result = result.filter((r) => r.gravity === query.gravity);
      }
    }

    // Sorting
    const sort = query.sortBy || "relevance";
    if (sort === "oxygen_desc") {
      result.sort((a, b) => (b.oxygen_pct ?? -1) - (a.oxygen_pct ?? -1));
    } else if (sort === "oxygen_asc") {
      result.sort((a, b) => (a.oxygen_pct ?? 999) - (b.oxygen_pct ?? 999));
    } else if (sort === "airflow_desc") {
      result.sort((a, b) => (b.airflow_cm_s ?? -1) - (a.airflow_cm_s ?? -1));
    } else if (sort === "airflow_asc") {
      result.sort((a, b) => (a.airflow_cm_s ?? 999) - (b.airflow_cm_s ?? 999));
    } else if (sort === "pressure_desc") {
      result.sort((a, b) => (b.pressure_kpa ?? -1) - (a.pressure_kpa ?? -1));
    } else if (sort === "pressure_asc") {
      result.sort((a, b) => (a.pressure_kpa ?? 999) - (b.pressure_kpa ?? 999));
    } else if (sort === "name_asc") {
      result.sort((a, b) => a.investigation.localeCompare(b.investigation));
    } else if (sort === "name_desc") {
      result.sort((a, b) => b.investigation.localeCompare(a.investigation));
    }

    return result;
  }, [query, fuse, corpus]);

  // Keep the analysis selection within its filtered results.
  useEffect(() => {
    const nextId = resolveActiveStudy(viewMode, isSourceModalOpen, activeId, filteredRecords.map((record) => record.id));
    if (nextId !== activeId) setActiveId(nextId);
  }, [viewMode, isSourceModalOpen, filteredRecords, activeId]);

  const activeRecord = useMemo(() => {
    return corpus.find((r) => r.id === activeId) || null;
  }, [activeId, corpus]);

  // Selected records for brief and compare modal
  const selectedRecords = useMemo(() => {
    return corpus.filter((r) => selectedIds.has(r.id));
  }, [selectedIds, corpus]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleReset = () => {
    setQuery({});
    setExplorerFilters({});
    setExplorerResetKey((key) => key + 1);
  };

  // Commit new user-uploaded record into active corpus
  const handleCommitNewRecord = (newRec: ExperimentRecord) => {
    setCorpus((prev) => {
      if (prev.some((r) => r.id === newRec.id)) return prev;
      return [newRec, ...prev];
    });
    setSelectedIds((prev) => new Set([newRec.id, ...Array.from(prev)]));
    setActiveId(newRec.id);
  };

  // Guided Stepper Navigation
  const handleSelectGuidedStep = (step: GuidedStep) => {
    setGuidedStep(step);
    if (step === "explore") {
      setViewMode("explorer");
    } else if (step === "simulate") {
      setIsSimulatorOpen(true);
    } else if (step === "gaps") {
      setIsCoverageOpen(true);
    } else if (step === "agent") {
      setIsAssistantOpen(true);
    } else if (step === "whiteboard") {
      setIsWhiteboardOpen(true);
    }
  };

  const brief = useMemo(() => {
    const baseBrief = generateDeterministicBrief(
      query,
      selectedRecords.length > 0 ? selectedRecords : filteredRecords
    );

    if (whiteboardSynthesis) {
      return {
        ...baseBrief,
        markdownContent: `${baseBrief.markdownContent}\n\n---\n\n${whiteboardSynthesis}`,
      };
    }

    return baseBrief;
  }, [query, selectedRecords, filteredRecords, whiteboardSynthesis]);

  return (
    <div className="min-h-screen bg-[#0b0d10] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Telemetry Header */}
      <Header
        corpusCount={corpus.length}
        onReset={handleReset}
        onOpenBrief={() => setIsBriefOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenCoverage={() => setIsCoverageOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenGraph={() => setIsGraphOpen(true)}
        onOpenIngestion={() => setIsIngestionOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        selectedCount={selectedIds.size}
        activeView="workspace"
        activeMainView={viewMode}
        onSelectView={setViewMode}
      />

      <main className="min-w-0 flex-1 w-full max-w-[1750px] mx-auto px-4 py-7 md:px-8 lg:px-10 md:py-10 space-y-6">
        {pendingActions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-slate-200" role="status">
            <span>{pendingActions.length} suggested {pendingActions.length === 1 ? "step" : "steps"} remaining</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { const { next, remaining } = takeNextAction(pendingActions); setPendingActions(() => remaining); next?.(); }} className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300">Open next step</button>
              <button type="button" onClick={() => setPendingActions([])} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06]">Dismiss</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-slate-400">Microgravity research</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{viewMode === "dashboard" ? "Overview" : viewMode === "explorer" ? "Explore research" : "Analysis"}</h1>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">{viewMode === "split" ? `${filteredRecords.length} of ${corpus.length}` : corpus.length} studies</span>
        </div>
        <details className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <summary className="cursor-pointer px-4 py-3 text-sm text-slate-300 hover:text-white">Research pathway</summary>
          <GuidedResearchStepper currentStep={guidedStep} onSelectStep={handleSelectGuidedStep} />
        </details>
        {/* Content View: Dashboard vs Research Explorer vs Split Workspace */}
        {viewMode === "dashboard" ? (
          <ExecutiveAnalyticsDashboard
            records={corpus}
            onSelectRecord={(id) => {
              setActiveId(id);
              setIsSourceModalOpen(true);
            }}
            onFilterRegime={(grav) => {
              setQuery({ ...query, gravity: grav as any });
              setViewMode("split");
            }}
            onOpenExplorer={() => setViewMode("explorer")}
            onOpenAssistant={(prompt) => {
              setAssistantInitialPrompt(prompt);
              setIsAssistantOpen(true);
            }}
          />
        ) : viewMode === "split" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT PANE (40% width on large screens) */}
            <section className="lg:col-span-5 space-y-3 flex flex-col">
              {/* Search & Physical Filters */}
              <SearchAndFilters
                query={query}
                onChange={setQuery}
                onSelectPreset={(p) => setQuery(p)}
                totalCount={corpus.length}
                filteredCount={filteredRecords.length}
              />

              {/* Quiet Header for Table Actions */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5">
                <span>
                  Showing <strong className="text-slate-200">{filteredRecords.length}</strong> studies
                </span>

                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-white/10">•</span>
                  <button
                    onClick={handleClearSelection}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Comparison Data Grid (TanStack Table) */}
              <ComparisonTable
                records={filteredRecords}
                query={query}
                activeId={activeId}
                onSelectActive={setActiveId}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onSortChange={(sort) => setQuery((prev) => ({ ...prev, sortBy: sort }))}
              />
            </section>

            {/* RIGHT PANE (60% width on large screens) */}
            <section className="lg:col-span-7 space-y-3.5 flex flex-col">
              {/* Telemetry Parameter Space (Recharts) */}
              <TelemetryChart
                records={filteredRecords}
                activeId={activeId}
                onSelectRecord={setActiveId}
              />

              {/* Active Investigation Detail & Provenance Inspector */}
              <InvestigationDetail
                record={activeRecord}
                query={query}
                onInspectSource={() => setIsSourceModalOpen(true)}
              />
            </section>
          </div>
        ) : null}
        <div hidden={viewMode !== "explorer"}>
          <ResearchExplorerGrid
            key={explorerResetKey}
            records={corpus}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onInspect={(rec) => {
              setActiveId(rec.id);
              setIsSourceModalOpen(true);
            }}
            onOpenPdf={(rec) => {
              setActiveId(rec.id);
              setIsSourceModalOpen(true);
            }}
            onAskAI={(prompt) => {
              setAssistantInitialPrompt(prompt);
              setIsAssistantOpen(true);
            }}
            initialSearchQuery={explorerFilters.searchQuery}
            initialGravity={explorerFilters.gravity}
            initialMaterial={explorerFilters.material}
            initialOxygenRange={explorerFilters.oxygenRange}
          />
        </div>
      </main>

      {/* Physics Combustion Simulator & Optical Flame Diagnostics Modal (Images 2 & 4) */}
      <CombustionSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        initialTab={simulatorInitialTab}
        initialConfig={simulatorInitialConfig}
        initialDiagConfig={simulatorInitialDiagConfig}
        onAskAI={(prompt) => {
          setIsSimulatorOpen(false);
          setAssistantInitialPrompt(prompt);
          setIsAssistantOpen(true);
        }}
      />

      {/* User Paper Ingestion & RAG Archiving Modal */}
      <PaperUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCommitRecord={handleCommitNewRecord}
        onOpenStagingQueue={(stagedId) => {
          setSelectedStagedIdForReview(stagedId || null);
          setIsUploadOpen(false);
          setIsIngestionOpen(true);
        }}
      />

      {/* Grounded Evidence Brief Modal Drawer */}
      <GroundedBriefDrawer
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        brief={brief}
      />

      {/* Side-by-Side Multi-Study Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        selectedRecords={selectedRecords}
        onOpenBrief={() => setIsBriefOpen(true)}
      />

      {/* Stage 2 Primary PDF Evidence Viewer with Coordinate Bounding Box */}
      <PDFEvidenceViewer
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        record={activeRecord}
      />

      {/* Parameter Space Coverage & Research Gaps Matrix Modal (Image 1) */}
      <CoverageMapModal
        isOpen={isCoverageOpen}
        onClose={() => setIsCoverageOpen(false)}
        records={corpus}
        onApplyCellFilter={(newQ) => setQuery((prev) => ({ ...prev, ...newQ }))}
        onAskAI={(prompt) => {
          setAssistantInitialPrompt(prompt);
          setIsAssistantOpen(true);
        }}
        onSelectRecord={(recId) => {
          setActiveId(recId);
        }}
      />

      {/* Sources & Methodology Modal */}
      <SourcesModal
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        records={corpus}
      />

      {/* Stage 3: Research Whiteboard Studio (React Flow + Excalidraw) */}
      <WhiteboardStudioModal
        isOpen={isWhiteboardOpen}
        onClose={() => {
          setIsWhiteboardOpen(false);
          setWhiteboardInitialPrompt(null);
          setWhiteboardInitialTree(null);
        }}
        activeRecord={activeRecord}
        initialPrompt={whiteboardInitialPrompt}
        initialTree={whiteboardInitialTree}
        onExportBrief={(md) => {
          setWhiteboardSynthesis(md);
          setIsWhiteboardOpen(false);
          setIsBriefOpen(true);
        }}
      />

      {/* Stage 3: Grounded AI Assistant Drawer (Nemotron 30B RAG) */}
      <GroundedChatDrawer
        isOpen={isAssistantOpen}
        onClose={() => {
          setIsAssistantOpen(false);
          setAssistantInitialPrompt(null);
        }}
        corpus={corpus}
        selectedRecordIds={selectedIds}
        onRunPipeline={(steps) => {
          const { next, remaining } = takeNextAction(steps);
          setPendingActions(() => remaining);
          next?.();
        }}
        initialPrompt={assistantInitialPrompt}
        onConsumeInitialPrompt={() => setAssistantInitialPrompt(null)}
        onInspectClaim={(recId) => {
          setActiveId(recId);
          setIsAssistantOpen(false);
          setIsSourceModalOpen(true);
        }}
        onAddToWhiteboard={(text, citations, customTree) => {
          setWhiteboardInitialPrompt(text);
          if (customTree) setWhiteboardInitialTree(customTree);
          setIsAssistantOpen(false);
          setIsWhiteboardOpen(true);
        }}
        onRunSimulation={(args) => {
          setSimulatorInitialConfig(args);
          setSimulatorInitialTab("physics");
          setIsAssistantOpen(false);
          setIsSimulatorOpen(true);
        }}
        onOpenSimulator={(preset) => {
          setSimulatorInitialTab("physics");
          setIsAssistantOpen(false);
          setIsSimulatorOpen(true);
        }}
        onOpenDiagnostics={(plateId, filterMode) => {
          if (plateId || filterMode) {
            setSimulatorInitialDiagConfig({
              plateId: (plateId as any) || "rtdfs",
              filterMode: (filterMode as any) || "chemiluminescence",
              rationale: "AI Copilot Calibrated CV Diagnostic Inspection",
            });
          }
          setSimulatorInitialTab("diagnostics");
          setIsAssistantOpen(false);
          setIsSimulatorOpen(true);
        }}
        onFilterExplorer={(args) => {
          let mappedMaterial: "all" | "liquid_droplets" | "pmma" | "fabrics_cellulose" | "wire_insulation" | "gaseous_fuels" | "other_solids" = "all";
          const matStr = (args.materialClasses || []).join(" ").toLowerCase();
          if (matStr.includes("fabric") || matStr.includes("cellulose") || matStr.includes("thin") || matStr.includes("sibal")) {
            mappedMaterial = "fabrics_cellulose";
          } else if (matStr.includes("pmma") || matStr.includes("acrylic") || matStr.includes("plexiglass")) {
            mappedMaterial = "pmma";
          } else if (matStr.includes("droplet") || matStr.includes("liquid") || matStr.includes("heptane") || matStr.includes("decane") || matStr.includes("methanol")) {
            mappedMaterial = "liquid_droplets";
          } else if (matStr.includes("wire") || matStr.includes("insulation") || matStr.includes("kapton")) {
            mappedMaterial = "wire_insulation";
          } else if (matStr.includes("gas") || matStr.includes("methane")) {
            mappedMaterial = "gaseous_fuels";
          }

          let mappedGravity: "all" | "microgravity" | "partial_gravity" | "lunar" | "martian" | "terrestrial" = "all";
          const gravStr = (args.gravityRegimes || []).join(" ").toLowerCase();
          if (gravStr.includes("lunar") || gravStr.includes("0.16")) {
            mappedGravity = "lunar";
          } else if (gravStr.includes("martian") || gravStr.includes("0.38")) {
            mappedGravity = "martian";
          } else if (gravStr.includes("micro") || gravStr.includes("µg") || gravStr.includes("0g")) {
            mappedGravity = "microgravity";
          } else if (gravStr.includes("partial")) {
            mappedGravity = "partial_gravity";
          } else if (gravStr.includes("1g") || gravStr.includes("earth")) {
            mappedGravity = "terrestrial";
          }

          const o2Range = args.oxygenRange || [10, 40];

          setExplorerFilters({
            searchQuery: args.searchQuery || "",
            gravity: mappedGravity,
            material: mappedMaterial,
            oxygenRange: o2Range,
          });

          setQuery((prev) => ({
            ...prev,
            freeText: args.searchQuery || prev.freeText,
            material: mappedMaterial !== "all" ? mappedMaterial : prev.material,
            oxygenPct: Math.round((o2Range[0] + o2Range[1]) / 2),
            gravity: mappedGravity === "microgravity" ? "microgravity" : mappedGravity === "lunar" ? "partial_gravity" : prev.gravity,
          }));

          // Switch to explorer grid and dismiss the assistant drawer so the user directly sees the filtered records!
          setViewMode("explorer");
          setIsAssistantOpen(false);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onOpenCoverageMap={() => {
          setIsAssistantOpen(false);
          setIsCoverageOpen(true);
        }}
        onOpenGraph={() => {
          setIsAssistantOpen(false);
          setIsGraphOpen(true);
        }}
        onOpenIngestion={() => {
          setIsAssistantOpen(false);
          setIsUploadOpen(true);
        }}
      />

      {/* Stage 4: Global Knowledge Relationship Network Graph (Image 5) */}
      <RelationshipGraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        corpus={corpus}
        onSelectInvestigation={(recId) => {
          setActiveId(recId);
          setIsGraphOpen(false);
        }}
      />

      {/* Stage 4: Document Ingestion & Verification Staging Queue */}
      <IngestionReviewModal
        isOpen={isIngestionOpen}
        onClose={() => {
          setIsIngestionOpen(false);
          setSelectedStagedIdForReview(null);
        }}
        onPromoteRecord={handleCommitNewRecord}
        selectedStagedId={selectedStagedIdForReview}
      />
    </div>
  );
}
