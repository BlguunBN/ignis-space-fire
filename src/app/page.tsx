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
import { generateDeterministicBrief } from "../lib/synthesis";

const allRecords = experimentsData as ExperimentRecord[];

export default function UnifiedWorkspace() {
  const [query, setQuery] = useState<SearchQuery>({});
  const [activeId, setActiveId] = useState<string | null>(allRecords[0]?.id || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(allRecords.map((r) => r.id))
  );
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [whiteboardSynthesis, setWhiteboardSynthesis] = useState<string | null>(null);

  // Configure Fuse.js for fuzzy retrieval
  const fuse = useMemo(() => {
    return new Fuse(allRecords, {
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
  }, []);

  // Filter records based on freeText + structured physics conditions
  const filteredRecords = useMemo(() => {
    let result = allRecords;

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

    // Oxygen filter
    if (query.oxygenPct != null) {
      result = result.filter((r) => {
        if (r.oxygen_pct == null) return false;
        return Math.abs(r.oxygen_pct - (query.oxygenPct as number)) <= 3.0;
      });
    }

    // Airflow filter
    if (query.airflowCmS != null) {
      result = result.filter((r) => {
        if (r.airflow_cm_s == null) return false;
        return Math.abs(r.airflow_cm_s - (query.airflowCmS as number)) <= 6.0;
      });
    }

    // Pressure filter
    if (query.pressureKpa != null) {
      result = result.filter((r) => {
        if (r.pressure_kpa == null) return false;
        return Math.abs(r.pressure_kpa - (query.pressureKpa as number)) <= 15.0;
      });
    }

    // Gravity filter
    if (query.gravity) {
      result = result.filter((r) => r.gravity === query.gravity);
    }

    return result;
  }, [query, fuse]);

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
    return allRecords.find((r) => r.id === activeId) || null;
  }, [activeId]);

  // Selected records for brief and compare modal
  const selectedRecords = useMemo(() => {
    return allRecords.filter((r) => selectedIds.has(r.id));
  }, [selectedIds]);

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
    setSelectedIds(new Set(allRecords.map((r) => r.id)));
    setActiveId(allRecords[0]?.id || null);
    setWhiteboardSynthesis(null);
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
        corpusCount={allRecords.length}
        onReset={handleReset}
        onOpenBrief={() => setIsBriefOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenCoverage={() => setIsCoverageOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenGraph={() => setIsGraphOpen(true)}
        onOpenIngestion={() => setIsIngestionOpen(true)}
        selectedCount={selectedIds.size}
        activeView="workspace"
      />

      {/* Main Workspace (40% Left Pane / 60% Right Pane) */}
      <main className="flex-1 p-3 md:p-4 max-w-[1750px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT PANE (40% width on large screens) */}
          <section className="lg:col-span-5 space-y-3 flex flex-col">
            {/* Search & Physical Filters */}
            <SearchAndFilters
              query={query}
              onChange={setQuery}
              onSelectPreset={(p) => setQuery(p)}
            />

            {/* Quiet Header for Table Actions */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5">
              <span>
                Matching <strong className="text-slate-200">{filteredRecords.length}</strong> of {allRecords.length} investigations
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
      </main>

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

      {/* Destination 2: Parameter Space Coverage & Gap Matrix Modal */}
      <CoverageMapModal
        isOpen={isCoverageOpen}
        onClose={() => setIsCoverageOpen(false)}
        records={allRecords}
        onApplyCellFilter={(newQ) => setQuery((prev) => ({ ...prev, ...newQ }))}
      />

      {/* Destination 3: Sources & Methodology Modal */}
      <SourcesModal
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        records={allRecords}
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

      {/* Stage 3: Grounded AI Assistant Drawer */}
      <GroundedChatDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        corpus={allRecords}
        selectedRecordIds={selectedIds}
        onInspectClaim={(recId) => {
          setActiveId(recId);
          setIsSourceModalOpen(true);
        }}
      />

      {/* Stage 4: Global Knowledge Relationship Network Graph */}
      <RelationshipGraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        corpus={allRecords}
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
