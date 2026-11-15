"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  FileUp,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Upload,
  UserCheck,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowRight,
  Database,
  ExternalLink,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  StagedCandidateRecord,
  ReviewStatus,
  promoteCandidateToCorpus,
} from "../lib/ingestion";
import { generateInvestigatorDossier, InvestigatorDossier } from "../lib/investigator-dossier";
import experimentsData from "../data/experiments.json";
import { ExperimentRecord } from "../types/evidence";

interface IngestionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromoteRecord?: (record: ExperimentRecord) => void;
  selectedStagedId?: string | null;
  corpus?: ExperimentRecord[];
}

export function IngestionReviewModal({
  isOpen,
  onClose,
  onPromoteRecord,
  selectedStagedId,
  corpus,
}: IngestionReviewModalProps) {
  const [queue, setQueue] = useState<StagedCandidateRecord[]>([]);
  const [reviewerName, setReviewerName] = useState("Dr. Sarah Chen (NASA GRC)");
  const [reviewNotes, setReviewNotes] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<StagedCandidateRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReviewStatus>("ALL");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const activeCorpus = useMemo(
    () => corpus || (experimentsData as unknown as ExperimentRecord[]),
    [corpus]
  );

  const dossier: InvestigatorDossier | null = useMemo(() => {
    if (!selectedCandidate) return null;
    return generateInvestigatorDossier(selectedCandidate, activeCorpus);
  }, [selectedCandidate, activeCorpus]);

  useEffect(() => {
    setCheckedItems({});
  }, [selectedCandidate?.stagedId]);

  // Fetch current queue from the server API
  const fetchQueue = useCallback(async (targetIdToSelect?: string | null) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ingestion", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const fetchedQueue: StagedCandidateRecord[] = data.queue || [];
      setQueue(fetchedQueue);

      // Auto-select target item if specified, or pick first matching
      if (targetIdToSelect) {
        const found = fetchedQueue.find((item) => item.stagedId === targetIdToSelect);
        if (found) {
          setSelectedCandidate(found);
          return;
        }
      }

      // If no valid selection or currently selected is missing, select the first
      setSelectedCandidate((prev) => {
        if (prev && fetchedQueue.some((item) => item.stagedId === prev.stagedId)) {
          return fetchedQueue.find((item) => item.stagedId === prev.stagedId) || prev;
        }
        return fetchedQueue[0] || null;
      });
    } catch (err: any) {
      console.error("Failed to fetch staging queue:", err);
      setNotification({
        type: "error",
        message: "Failed to load staging queue from server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when modal opens or selectedStagedId changes
  useEffect(() => {
    if (isOpen) {
      fetchQueue(selectedStagedId);
    } else {
      setNotification(null);
    }
  }, [isOpen, selectedStagedId, fetchQueue]);

  // Handle Review Decision (Approve or Reject) via API
  const handleDecision = async (stagedId: string, decision: ReviewStatus) => {
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch("/api/ingestion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagedId,
          decision,
          reviewerName,
          notes: reviewNotes || (decision === "APPROVED_FOR_CORPUS" ? "Verified against NASA PSI telemetry" : "Insufficient flight verification"),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed with status ${res.status}`);
      }

      const updatedRecord: StagedCandidateRecord = data.updated;

      // Update in local queue
      setQueue((prev) =>
        prev.map((item) => (item.stagedId === stagedId ? updatedRecord : item))
      );
      setSelectedCandidate(updatedRecord);

      // If approved, promote directly into the active flight corpus
      if (decision === "APPROVED_FOR_CORPUS") {
        const promoted = data.promotedRecord || promoteCandidateToCorpus(updatedRecord);
        onPromoteRecord?.(promoted);
        setNotification({
          type: "success",
          message: `Candidate "${updatedRecord.documentTitle}" approved by ${reviewerName} and promoted to active flight library!`,
        });
      } else {
        setNotification({
          type: "info",
          message: `Candidate "${updatedRecord.documentTitle}" rejected and quarantined from corpus index.`,
        });
      }
    } catch (err: any) {
      console.error("Failed to update candidate decision:", err);
      setNotification({
        type: "error",
        message: err.message || "Failed to update review decision.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Docling layout extraction and stage candidate
  const handleSimulatedUpload = async () => {
    setActionLoading(true);
    setNotification(null);
    try {
      const payload = {
        documentTitle: `SoFIE GEL: Solid Fuel Ignition and Extinction in Low-Speed Cabin Flows (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
        filename: "NASA-TM-2024-SoFIE-GEL.pdf",
        candidateProgramme: "SoFIE",
        candidatePlatform: "ISS Combustion Integrated Rack (CIR)",
        candidateMaterial: "thick PMMA cylinder (30mm)",
        candidateOxygenPct: 34,
        candidateAirflowCmS: 4.5,
        candidatePressureKpa: 101.3,
        extractedFinding:
          "Extinction limit for 30mm thick cylindrical PMMA requires minimum 34% O₂ in sub-5 cm/s flow regimes due to internal conductive quenching.",
        extractedQuote:
          "Thick samples undergo radiative and conductive heat loss exceeding chemical heat release below 34% oxygen concentration.",
        pageNumber: 15,
        sourceLocator: "NASA Glenn Research Center / SoFIE PSI Archive Table 4",
        doi: "10.60555/0t15-sofie-gel",
      };

      const res = await fetch("/api/ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to stage document");

      const newDoc: StagedCandidateRecord = data.staged;
      setQueue((prev) => [newDoc, ...prev]);
      setSelectedCandidate(newDoc);
      setStatusFilter("ALL");
      setNotification({
        type: "success",
        message: `Simulated Docling PDF extraction staged as "${newDoc.stagedId}". Pending investigator sign-off.`,
      });
    } catch (err: any) {
      console.error("Failed to simulate upload:", err);
      setNotification({
        type: "error",
        message: err.message || "Failed to simulate document extraction.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter queue by search text and status
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.reviewStatus === statusFilter;
      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.documentTitle.toLowerCase().includes(q) ||
        item.candidateMaterial.toLowerCase().includes(q) ||
        item.candidateProgramme.toLowerCase().includes(q) ||
        item.candidatePlatform.toLowerCase().includes(q) ||
        item.sourceLocator.toLowerCase().includes(q) ||
        (item.doi && item.doi.toLowerCase().includes(q))
      );
    });
  }, [queue, statusFilter, searchQuery]);

  // Counts for tabs
  const pendingCount = useMemo(
    () => queue.filter((i) => i.reviewStatus === "PENDING_REVIEW").length,
    [queue]
  );
  const approvedCount = useMemo(
    () => queue.filter((i) => i.reviewStatus === "APPROVED_FOR_CORPUS").length,
    [queue]
  );
  const rejectedCount = useMemo(
    () => queue.filter((i) => i.reviewStatus === "REJECTED_UNVERIFIED").length,
    [queue]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
      aria-label="NASA Technical Paper Ingestion and Verification Staging"
    >
      <div className="bg-[#0c0f14] border border-white/[0.08] rounded-xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#090a0d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  STAGE 4 INGESTION & REVIEW PIPELINE
                </span>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  Docling Layout Extraction & Staging Queue
                </span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {queue.length} Reports
                </span>
              </div>
              <h2 className="text-sm md:text-base font-semibold text-slate-100 font-sans mt-0.5">
                NASA Technical Paper Ingestion & Verification Staging
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchQueue(selectedCandidate?.stagedId)}
              disabled={loading}
              title="Refresh queue from server"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <button
              onClick={handleSimulatedUpload}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] rounded text-xs font-mono transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulate Docling PDF Upload</span>
              <span className="sm:hidden">Simulate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety Gate Warning Banner */}
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 text-xs font-mono text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              <strong>Strict Safety Invariant:</strong> Extracted candidate claims remain quarantined from the live search index until verified by a certified flight investigator.
            </span>
          </div>
          <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold hidden md:inline">
            Zero-Hallucination Gate
          </span>
        </div>

        {/* User Feedback Notification Banner */}
        {notification && (
          <div
            className={`px-5 py-2.5 border-b flex items-center justify-between gap-2 text-xs font-mono shrink-0 animate-in fade-in ${
              notification.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : notification.type === "error"
                ? "bg-red-500/15 border-red-500/30 text-red-300"
                : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : notification.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body Viewport */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Queue List & Filters */}
          <div className="w-80 md:w-96 border-r border-white/[0.08] bg-[#090a0d] flex flex-col shrink-0">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="uppercase font-semibold">Staged Reports ({queue.length})</span>
                <span className="text-[10px] text-cyan-400">Docling Extractor</span>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-amber-400 text-slate-950 font-bold"
                      : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                  }`}
                >
                  All ({queue.length})
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING_REVIEW")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "PENDING_REVIEW"
                      ? "bg-amber-400 text-slate-950 font-bold"
                      : "bg-white/[0.04] text-amber-300 hover:bg-white/[0.08]"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("APPROVED_FOR_CORPUS")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "APPROVED_FOR_CORPUS"
                      ? "bg-emerald-400 text-slate-950 font-bold"
                      : "bg-white/[0.04] text-emerald-300 hover:bg-white/[0.08]"
                  }`}
                >
                  Approved ({approvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("REJECTED_UNVERIFIED")}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === "REJECTED_UNVERIFIED"
                      ? "bg-rose-400 text-slate-950 font-bold"
                      : "bg-white/[0.04] text-rose-300 hover:bg-white/[0.08]"
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, fuel, platform..."
                  className="w-full bg-[#0c0f14] border border-white/[0.08] rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 font-mono"
                />
              </div>
            </div>

            {/* List Viewport */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {loading && queue.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-xs font-mono text-slate-500 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading flight records from staging queue…</span>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-slate-500 space-y-1">
                  <p>No staged reports match criteria.</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      Clear search filter
                    </button>
                  )}
                </div>
              ) : (
                filteredQueue.map((item) => (
                  <div
                    key={item.stagedId}
                    onClick={() => setSelectedCandidate(item)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                      selectedCandidate?.stagedId === item.stagedId
                        ? "bg-[#13171e] border-amber-400/80 shadow-md"
                        : "bg-[#0c0f14] border-white/[0.06] hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400 truncate max-w-[140px] font-semibold">
                        {item.candidateProgramme}
                      </span>
                      {item.reviewStatus === "PENDING_REVIEW" && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {item.reviewStatus === "APPROVED_FOR_CORPUS" && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {item.reviewStatus === "REJECTED_UNVERIFIED" && (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-100 line-clamp-2 leading-snug">
                      {item.documentTitle}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 mt-1.5 flex items-center gap-1.5 truncate">
                      <span>{item.candidateOxygenPct}% O₂</span>
                      <span className="text-white/20">•</span>
                      <span>{item.candidateAirflowCmS} cm/s</span>
                      <span className="text-white/20">•</span>
                      <span className="truncate text-slate-300">{item.candidateMaterial}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Selected Candidate Dossier & Verification Sign-off */}
          {selectedCandidate ? (
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 bg-[#0c0f14] text-xs">
              {/* Dossier Header */}
              <div className="flex items-start justify-between border-b border-white/[0.06] pb-3 gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-amber-300 border border-white/[0.06] font-bold">
                      {selectedCandidate.candidateProgramme}
                    </span>
                    <span className="text-slate-300 font-medium">
                      {selectedCandidate.candidatePlatform}
                    </span>
                    <span className="text-white/20">•</span>
                    <span>File: {selectedCandidate.filename}</span>
                    {selectedCandidate.doi && (
                      <>
                        <span className="text-white/20">•</span>
                        <span className="text-cyan-400 font-semibold">DOI: {selectedCandidate.doi}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-100 font-sans mt-1.5 leading-snug">
                    {selectedCandidate.documentTitle}
                  </h3>
                </div>

                <div className="text-right font-mono text-[11px] shrink-0">
                  <span className="text-slate-400">Extracted: </span>
                  <span className="text-slate-200">
                    {new Date(selectedCandidate.extractedAt).toLocaleDateString()}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    ID: {selectedCandidate.stagedId}
                  </div>
                </div>
              </div>

              {/* Extracted Conditions Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#13171e] text-xs font-mono p-3 gap-2 sm:gap-0 shadow-sm">
                <div className="px-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Oxygen Concentration</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">
                    {selectedCandidate.candidateOxygenPct}% O₂
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Cabin Atmosphere</div>
                </div>
                <div className="px-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Airflow Velocity</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">
                    {selectedCandidate.candidateAirflowCmS} cm/s
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Forced Ventilation</div>
                </div>
                <div className="px-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Chamber Pressure</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {selectedCandidate.candidatePressureKpa} kPa
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Total Ambient</div>
                </div>
                <div className="px-3">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Fuel Material Specimen</div>
                  <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                    {selectedCandidate.candidateMaterial}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">Primary Solid/Liquid</div>
                </div>
              </div>

              {/* Parsed Finding & Table Quote */}
              <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#0e1218] p-4">
                <div className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Parsed Empirical Finding & Extracted Text (Docling)</span>
                </div>
                <blockquote className="bg-[#13171e] border-l-2 border-cyan-400 p-3.5 rounded-r text-slate-200 leading-relaxed font-sans text-xs shadow-inner">
                  "{selectedCandidate.extractedQuote}"
                </blockquote>
                <div className="text-slate-200 text-xs font-sans pl-1 pt-1 leading-relaxed">
                  <strong className="text-amber-400 font-mono">Synthesized Evidence: </strong>
                  {selectedCandidate.extractedFinding}
                </div>
                <div className="text-[10px] font-mono text-slate-400 pl-1 pt-1 border-t border-white/[0.04] flex flex-wrap items-center gap-3">
                  <span>Page Locator: Page {selectedCandidate.pageNumber}</span>
                  <span>•</span>
                  <span>Source: {selectedCandidate.sourceLocator}</span>
                  {selectedCandidate.sourceLocator.startsWith("http") && (
                    <a
                      href={selectedCandidate.sourceLocator}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-1 ml-auto"
                    >
                      <span>Open NASA Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* AI Investigator Pre-Review Dossier Card */}
              {dossier && (
                <div className="border border-cyan-500/30 rounded-xl p-4 bg-[#0d1520]/80 space-y-3 font-mono text-xs shadow-lg backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>AI Investigator Copilot Pre-Review Dossier</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        dossier.riskLevel === "LOW"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : dossier.riskLevel === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {dossier.riskLevel} FLIGHT RISK
                    </span>
                  </div>

                  {/* Executive Summary */}
                  <div className="text-slate-300 font-sans text-xs leading-relaxed bg-[#0a1017] p-3 rounded-lg border border-white/[0.04]">
                    {dossier.executiveSummary}
                  </div>

                  {/* Nearest Historical Flight */}
                  {dossier.nearestFlightReference && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/[0.02] px-3 py-1.5 rounded border border-white/[0.05]">
                      <span className="text-cyan-400 font-semibold">Nearest Flight Baseline:</span>
                      <span className="text-slate-200">
                        {dossier.nearestFlightReference.programme} ({dossier.nearestFlightReference.investigation})
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        {dossier.nearestFlightReference.material} @ {dossier.nearestFlightReference.oxygenPct ?? 21}% O₂ ({dossier.nearestFlightReference.airflowCmS ?? 0} cm/s flow)
                      </span>
                    </div>
                  )}

                  {/* 3-Point Interactive Verification Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                      Pre-Flight Telemetry Verification Checklist (3 Points)
                    </div>
                    <div className="space-y-1.5">
                      {dossier.checklist.map((item) => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                          <label
                            key={item.id}
                            className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors border ${
                              isChecked
                                ? "bg-cyan-950/30 border-cyan-500/40 text-slate-200"
                                : "bg-black/30 border-white/[0.04] text-slate-400 hover:border-white/[0.1] hover:text-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                setCheckedItems((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.checked,
                                }))
                              }
                              className="mt-0.5 rounded border-slate-600 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-[#0c0f14]"
                            />
                            <div className="flex-1 text-[11px] leading-snug">
                              <span className="font-semibold text-slate-200 mr-1.5">{item.label}:</span>
                              <span>{item.description}</span>
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                                item.category === "PHYSICS"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : item.category === "TELEMETRY"
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              }`}
                            >
                              {item.category}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1-Click Rationale Recommendation */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 truncate max-w-md">
                      <span className="text-slate-500">Suggested: </span>
                      <span className="text-slate-300 italic">"{dossier.recommendedRationale}"</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewNotes(dossier.recommendedRationale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs transition-colors shrink-0 font-sans"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Apply AI Recommended Rationale</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Human Review Sign-Off Form */}
              <div className="border border-white/[0.08] rounded-xl p-4 bg-[#13171e] space-y-3 font-mono text-xs shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Investigator Review & Safety Certification Gate</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Mandatory Human Verification
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-semibold">
                      Reviewer Name & Affiliation
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-semibold">
                      Review Notes & Verification Rationale
                    </label>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Table numbers confirmed against NASA PSI run log..."
                      className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {selectedCandidate.reviewStatus === "APPROVED_FOR_CORPUS" && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Approved by <strong>{selectedCandidate.reviewerName}</strong> on{" "}
                        {selectedCandidate.reviewDecisionDate?.slice(0, 10)}. Promoted to active corpus.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      ACTIVE IN FLIGHT LIBRARY
                    </span>
                  </div>
                )}

                {selectedCandidate.reviewStatus === "REJECTED_UNVERIFIED" && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        Rejected by <strong>{selectedCandidate.reviewerName}</strong>. Quarantined from corpus index.
                      </span>
                    </div>
                    <button
                      onClick={() => handleDecision(selectedCandidate.stagedId, "PENDING_REVIEW")}
                      disabled={actionLoading}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Reopen for Review
                    </button>
                  </div>
                )}

                {selectedCandidate.reviewStatus === "PENDING_REVIEW" && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDecision(selectedCandidate.stagedId, "APPROVED_FOR_CORPUS")}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors shadow disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading ? "Promoting..." : "Approve & Promote to Corpus"}</span>
                    </button>

                    <button
                      onClick={() => handleDecision(selectedCandidate.stagedId, "REJECTED_UNVERIFIED")}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Candidate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 font-mono text-xs space-y-2">
              <Layers className="w-8 h-8 text-slate-600" />
              <span>Select a staged candidate report from the left queue to inspect and review.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
