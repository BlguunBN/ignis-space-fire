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
import { generateDeterministicBrief } from "../lib/synthesis";

const allRecords = experimentsData as ExperimentRecord[];

export default function UnifiedWorkspace() {
  const [query, setQuery] = useState<SearchQuery>({});
  const [activeId, setActiveId] = useState<string | null>(allRecords[0]?.id || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(allRecords.map((r) => r.id))
  );
  const [isBriefOpen, setIsBriefOpen] = useState(false);

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

  // Selected records for brief generation
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
  };

  const brief = useMemo(() => {
    return generateDeterministicBrief(
      query,
      selectedRecords.length > 0 ? selectedRecords : filteredRecords
    );
  }, [query, selectedRecords, filteredRecords]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Telemetry Header */}
      <Header
        corpusCount={allRecords.length}
        onReset={handleReset}
        onOpenBrief={() => setIsBriefOpen(true)}
        selectedCount={selectedIds.size}
      />

      {/* Main Workspace (40% Left Pane / 60% Right Pane) */}
      <main className="flex-1 p-3 md:p-4 max-w-[1700px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT PANE (40% width on large screens) */}
          <section className="lg:col-span-5 space-y-3.5 flex flex-col">
            {/* Search & Physical Filters */}
            <SearchAndFilters
              query={query}
              onChange={setQuery}
              onSelectPreset={(p) => setQuery(p)}
            />

            {/* Filter Count & Selection Controls */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>
                Matching Investigations:{" "}
                <strong className="text-amber-400">{filteredRecords.length}</strong> of {allRecords.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="hover:text-slate-200 underline decoration-slate-600"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  onClick={handleClearSelection}
                  className="hover:text-slate-200 underline decoration-slate-600"
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
          <section className="lg:col-span-7 space-y-4 flex flex-col">
            {/* Telemetry Parameter Space (Recharts) */}
            <TelemetryChart
              records={filteredRecords}
              activeId={activeId}
              onSelectRecord={setActiveId}
            />

            {/* Active Investigation Detail & Provenance Inspector */}
            <InvestigationDetail record={activeRecord} query={query} />
          </section>
        </div>
      </main>

      {/* Grounded Evidence Brief Modal Drawer */}
      <GroundedBriefDrawer
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        brief={brief}
      />
    </div>
  );
}
