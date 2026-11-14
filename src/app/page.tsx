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
import { LayoutGrid, Columns, Sparkles, Flame, Upload, LayoutDashboard, Compass } from "lucide-react";

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
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string | null>(null);
  const [whiteboardSynthesis, setWhiteboardSynthesis] = useState<string | null>(null);

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

  // Ensure activeId is always valid
  useEffect(() => {
    if (filteredRecords.length > 0) {
      if (!activeId || !filteredRecords.some((r) => r.id === activeId)) {
        setActiveId(filteredRecords[0].id);
      }
    } else {
      setActiveId(null);
    }
  }, [filteredRecords, activeId]);

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
    setSelectedIds(new Set(corpus.map((r) => r.id)));
    setActiveId(corpus[0]?.id || null);
    setWhiteboardSynthesis(null);
  };

  // Commit new user-uploaded record into active corpus
  const handleCommitNewRecord = (newRec: ExperimentRecord) => {
    setCorpus((prev) => [newRec, ...prev]);
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
    <div className="min-h-screen bg-[#090a0d] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
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

      {/* Guided Researcher Pathway Stepper */}
      <GuidedResearchStepper
        currentStep={guidedStep}
        onSelectStep={handleSelectGuidedStep}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 p-3 md:p-4 max-w-[1750px] w-full mx-auto space-y-3">
        {/* View Toggle Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>
              NASA Flight Corpus: <strong className="text-slate-200">{filteredRecords.length}</strong> of {corpus.length} investigations
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Toggle: Dashboard vs Explorer vs Split */}
            <div className="flex rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.06]">
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === "dashboard"
                    ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Executive Mission Fire-Safety Analytics Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setViewMode("explorer")}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === "explorer"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Research Explorer with Filter Sidebar"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Research Explorer</span>
              </button>

              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                  viewMode === "split"
                    ? "bg-white/[0.08] text-slate-100 font-bold border border-white/[0.12]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Table & Scatter Plot Split Workspace"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split Workspace</span>
              </button>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Simulate</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest Paper</span>
            </button>
          </div>
        </div>

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
        ) : viewMode === "explorer" ? (
          <ResearchExplorerGrid
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
          />
        ) : (
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
        )}
      </main>

      {/* Physics Combustion Simulator & Optical Flame Diagnostics Modal (Images 2 & 4) */}
      <CombustionSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
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
        onClose={() => setIsWhiteboardOpen(false)}
        activeRecord={activeRecord}
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
        initialPrompt={assistantInitialPrompt}
        onInspectClaim={(recId) => {
          setActiveId(recId);
          setIsSourceModalOpen(true);
        }}
        onAddToWhiteboard={() => {
          setIsAssistantOpen(false);
          setIsWhiteboardOpen(true);
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
        onClose={() => setIsIngestionOpen(false)}
      />
    </div>
  );
}
