"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  getStagingQueue,
  reviewCandidate,
  stageNewDocument,
  StagedCandidateRecord,
  ReviewStatus,
} from "../lib/ingestion";
import { ExperimentRecord } from "../types/evidence";

interface IngestionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromoteRecord?: (record: ExperimentRecord) => void;
}

export function IngestionReviewModal({
  isOpen,
  onClose,
  onPromoteRecord,
}: IngestionReviewModalProps) {
  const [queue, setQueue] = useState<StagedCandidateRecord[]>(getStagingQueue());
  const [reviewerName, setReviewerName] = useState("Dr. Sarah Chen (NASA GRC)");
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<StagedCandidateRecord | null>(
    queue[0] || null
  );

  if (!isOpen) return null;

  const handleDecision = (stagedId: string, decision: ReviewStatus) => {
    try {
      const updated = reviewCandidate(stagedId, decision, reviewerName, reviewNotes);
      setQueue(getStagingQueue());
      setSelectedCandidate(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulatedUpload = () => {
    const newDoc = stageNewDocument({
      documentTitle: "SoFIE GEL: Solid Fuel Ignition and Extinction in Low-Speed Cabin Flows",
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
    });
    setQueue(getStagingQueue());
    setSelectedCandidate(newDoc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0c0f14] border border-white/[0.08] rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.08] bg-[#090a0d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  STAGE 4 INGESTION & REVIEW PIPELINE
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Docling Layout Extraction & Staging Queue
                </span>
              </div>
              <h2 className="text-sm md:text-base font-semibold text-slate-100 font-sans mt-0.5">
                NASA Technical Paper Ingestion & Verification Staging
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulatedUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] rounded text-xs font-mono transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Docling PDF Upload</span>
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
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs font-mono text-amber-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            <strong>Strict Safety Invariant:</strong> Extracted candidate claims remain quarantined from the live search index until verified by a certified flight investigator.
          </span>
        </div>

        {/* Body Viewport */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Queue List */}
          <div className="w-80 border-r border-white/[0.08] bg-[#090a0d] overflow-y-auto p-3 space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-400 px-1 font-semibold flex justify-between">
              <span>Staged Reports ({queue.length})</span>
              <span>Docling Extraction</span>
            </div>

            {queue.map((item) => (
              <div
                key={item.stagedId}
                onClick={() => setSelectedCandidate(item)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                  selectedCandidate?.stagedId === item.stagedId
                    ? "bg-[#13171e] border-amber-400/80"
                    : "bg-[#0c0f14] border-white/[0.06] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400 truncate max-w-[130px]">{item.candidateProgramme}</span>
                  {item.reviewStatus === "PENDING_REVIEW" && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {item.reviewStatus === "APPROVED_FOR_CORPUS" && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {item.reviewStatus === "REJECTED_UNVERIFIED" && (
                    <span className="flex items-center gap-1 text-rose-400">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-slate-100 line-clamp-2">
                  {item.documentTitle}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 mt-1">
                  {item.candidateOxygenPct}% O₂ • {item.candidateAirflowCmS} cm/s • {item.candidateMaterial}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Selected Candidate Dossier & Verification Sign-off */}
          {selectedCandidate ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0c0f14] text-xs">
              <div className="flex items-start justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                      {selectedCandidate.candidateProgramme}
                    </span>
                    <span>{selectedCandidate.candidatePlatform}</span>
                    <span className="text-white/20">•</span>
                    <span>File: {selectedCandidate.filename}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 font-sans mt-1">
                    {selectedCandidate.documentTitle}
                  </h3>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400">Extracted: </span>
                  <span className="text-slate-200">{new Date(selectedCandidate.extractedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Extracted Conditions Telemetry Strip */}
              <div className="grid grid-cols-4 divide-x divide-white/[0.06] rounded border border-white/[0.06] bg-[#13171e] text-xs font-mono p-2">
                <div className="px-2">
                  <div className="text-[10px] text-slate-400 uppercase">Oxygen</div>
                  <div className="text-sm font-semibold text-cyan-400">{selectedCandidate.candidateOxygenPct}% O₂</div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] text-slate-400 uppercase">Airflow</div>
                  <div className="text-sm font-semibold text-cyan-400">{selectedCandidate.candidateAirflowCmS} cm/s</div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] text-slate-400 uppercase">Pressure</div>
                  <div className="text-sm font-semibold text-slate-200">{selectedCandidate.candidatePressureKpa} kPa</div>
                </div>
                <div className="px-2">
                  <div className="text-[10px] text-slate-400 uppercase">Material</div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{selectedCandidate.candidateMaterial}</div>
                </div>
              </div>

              {/* Parsed Finding & Table Quote */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Parsed Table & Paragraph Extraction (Docling)</span>
                </div>
                <blockquote className="bg-[#13171e] border-l-2 border-cyan-400 p-3 rounded-r text-slate-200 leading-relaxed font-sans">
                  "{selectedCandidate.extractedQuote}"
                </blockquote>
                <p className="text-slate-300 text-[11px] font-sans pl-1">
                  <strong>Interpreted Finding:</strong> {selectedCandidate.extractedFinding}
                </p>
                <div className="text-[10px] font-mono text-slate-400 pl-1">
                  Page Locator: Page {selectedCandidate.pageNumber} • Source: {selectedCandidate.sourceLocator}
                </div>
              </div>

              {/* Human Review Sign-Off Form */}
              <div className="border border-white/[0.08] rounded-lg p-4 bg-[#13171e] space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Investigator Review & Safety Certification Gate</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">
                      Reviewer Name & Affiliation
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1">
                      Review Notes & Verification Rationale
                    </label>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="e.g. Table 3 numbers confirmed against raw PSI run log..."
                      className="w-full bg-[#0c0f14] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {selectedCandidate.reviewStatus === "APPROVED_FOR_CORPUS" && (
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approved by {selectedCandidate.reviewerName} on {selectedCandidate.reviewDecisionDate?.slice(0, 10)}. Promoted to active corpus.</span>
                  </div>
                )}

                {selectedCandidate.reviewStatus === "REJECTED_UNVERIFIED" && (
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span>Rejected by {selectedCandidate.reviewerName}. Quarantined from corpus index.</span>
                  </div>
                )}

                {selectedCandidate.reviewStatus === "PENDING_REVIEW" && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDecision(selectedCandidate.stagedId, "APPROVED_FOR_CORPUS")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Promote to Corpus</span>
                    </button>

                    <button
                      onClick={() => handleDecision(selectedCandidate.stagedId, "REJECTED_UNVERIFIED")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Candidate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select a staged candidate report to inspect and review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
