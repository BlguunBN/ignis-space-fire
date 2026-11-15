/**
 * Unified Ingestion Agent Swarm Coordinator (Phase 6)
 * 
 * Orchestrates a pipeline of 5 specialized scientific AI agents:
 * 1. Security Firewall & Adversarial Injection Guard
 * 2. Multi-Modal Docling VLM Extractor (tabular telemetry + spatial bounding boxes)
 * 3. Adversarial Scientific Red-Team Critic (Re, Gr, Ri, Da dimensionless transport + LOI check)
 * 4. Closed-Loop Simulation Reconciler (theoretical flame spread vs reported Delta)
 * 5. Flight Investigator Pre-Review Dossier Copilot (3-point checklist + nearest flight baseline)
 */

import { fetchAndExtractPaperFromUrl, parseUploadedDocument, ScrapedPaperContent } from "./paper-scraper";
import { scanDocumentForPromptInjection, InjectionScanResult } from "./prompt-injection-guard";
import { extractScientificTelemetryVLM, VLMExtractionResult } from "./vlm-extractor";
import { auditScientificTransportAndContradictions, CriticReport } from "./scientific-critic-agent";
import { reconcileCandidateWithSimulation, SimulationReconciliationResult } from "./simulation-reconciler";
import { generateInvestigatorDossier, InvestigatorDossier } from "./investigator-dossier";
import { StagedCandidateRecord } from "./ingestion";
import { ExperimentRecord } from "../types/evidence";

export interface SwarmTimelineStep {
  agent: string;
  role: string;
  status: "PASSED" | "WARNING" | "FAILED";
  durationMs: number;
  summary: string;
}

export interface SwarmAuditReport {
  overallVerdict: "STAGED_FOR_REVIEW" | "REJECTED_UNVERIFIED" | "REJECTED_SECURITY_THREAT";
  rigorScore: number;
  securityScore: number;
  isSafe: boolean;
  stagedCandidate?: StagedCandidateRecord;
  securityAudit: InjectionScanResult;
  vlmResult: VLMExtractionResult;
  criticReport: CriticReport;
  simulationReconciliation: SimulationReconciliationResult;
  investigatorDossier: InvestigatorDossier;
  swarmTimeline: SwarmTimelineStep[];
  scannedAt: string;
  summary: string;
}

export interface IngestionSwarmInput {
  url?: string;
  fileText?: string;
  filename?: string;
  title?: string;
}

/**
 * Runs the full 5-agent ingestion swarm on a scientific publication or dataset.
 */
export async function runIngestionAgentSwarm(
  input: IngestionSwarmInput,
  corpus: ExperimentRecord[]
): Promise<SwarmAuditReport> {
  const swarmTimeline: SwarmTimelineStep[] = [];

  // Step 0: Scrape or Parse Document Content
  let scraped: ScrapedPaperContent;
  if (input.url) {
    scraped = await fetchAndExtractPaperFromUrl(input.url);
  } else {
    scraped = parseUploadedDocument(input.filename || "uploaded-research-paper.txt", input.fileText || "");
    if (input.title) scraped.title = input.title;
  }

  // ============================================================================
  // Agent 1: Security Firewall & Prompt-Injection Guard
  // ============================================================================
  const t1_start = Date.now();
  const securityAudit = scanDocumentForPromptInjection(scraped.rawText);
  const t1_dur = Date.now() - t1_start;
  const securityScore = Math.max(0, Math.round((1.0 - securityAudit.threatScore) * 100));

  if (!securityAudit.isSafe) {
    swarmTimeline.push({
      agent: "Security Firewall",
      role: "Adversarial Prompt-Injection Guard",
      status: "FAILED",
      durationMs: t1_dur,
      summary: `Critical prompt-injection detected (${securityAudit.detectedThreats.join(", ")}). Ingestion halted.`,
    });

    const emptyDossier: InvestigatorDossier = {
      stagedId: "staged-security-rejected",
      documentTitle: scraped.title,
      executiveSummary: "Ingestion permanently blocked by security firewall.",
      riskLevel: "HIGH",
      riskFactors: ["Malicious adversarial prompt injection payload detected."],
      checklist: [],
      recommendedRationale: "Rejected by automated security firewall.",
      generatedAt: new Date().toISOString(),
    };

    const emptyVlm: VLMExtractionResult = {
      telemetry: {},
      boundingBoxes: [],
      tables: [],
      confidence: 0,
      engine: "regex-heuristic-fallback",
      extractedAt: new Date().toISOString(),
    };

    const emptyCritic: CriticReport = {
      isThermodynamicallySound: false,
      confidencePenalty: 100,
      dimensionlessTransport: {
        reynoldsNumber: 0,
        grashofNumber: 0,
        richardsonNumber: 0,
        damkohlerNumber: 0,
        flowRegime: "DIFFUSION_DOMINATED_QUIESCENT",
        pecletNumber: 0,
      },
      contradictionsDetected: [],
      critiqueNotes: "Analysis skipped due to security violation.",
      evaluatedAt: new Date().toISOString(),
    };

    const emptySim: SimulationReconciliationResult = {
      stagedId: "staged-security-rejected",
      material: "Unknown",
      simulatedSpreadRateMmS: 0,
      agreementLevel: "HIGH_DISCREPANCY",
      discrepancyDiagnosis: "Analysis skipped due to security threat.",
      physicalMechanisms: [],
      flammabilityRegime: "SECURITY_QUARANTINE",
      isReconciled: false,
      simulatedAt: new Date().toISOString(),
    };

    return {
      overallVerdict: "REJECTED_SECURITY_THREAT",
      rigorScore: 0,
      securityScore,
      isSafe: false,
      securityAudit,
      vlmResult: emptyVlm,
      criticReport: emptyCritic,
      simulationReconciliation: emptySim,
      investigatorDossier: emptyDossier,
      swarmTimeline,
      scannedAt: new Date().toISOString(),
      summary: "Document permanently quarantined by Adversarial Prompt-Injection Firewall.",
    };
  }

  swarmTimeline.push({
    agent: "Security Firewall",
    role: "Adversarial Prompt-Injection Guard",
    status: "PASSED",
    durationMs: t1_dur,
    summary: `Verified safe document payload (${securityScore}/100 security score).`,
  });

  // ============================================================================
  // Agent 2: Docling Multi-Modal VLM Extractor
  // ============================================================================
  const t2_start = Date.now();
  const vlmResult = extractScientificTelemetryVLM(securityAudit.sanitizedText, {
    filename: scraped.filename,
    title: scraped.title,
  });
  const t2_dur = Date.now() - t2_start;

  swarmTimeline.push({
    agent: "Docling VLM Agent",
    role: "Multi-Modal Layout & Bounding Box Extractor",
    status: vlmResult.tables.length > 0 ? "PASSED" : "WARNING",
    durationMs: t2_dur,
    summary: `Extracted ${vlmResult.tables.length} tables, ${vlmResult.boundingBoxes.length} spatial bounding boxes at ${vlmResult.confidence}% confidence.`,
  });

  // ============================================================================
  // Agent 3: Adversarial Scientific Red-Team Critic
  // ============================================================================
  const t3_start = Date.now();
  const o2Val = vlmResult.telemetry.oxygenPct ?? 21;
  const pressVal = vlmResult.telemetry.pressureKpa ?? 101.3;
  const flowVal = vlmResult.telemetry.airflowCmS ?? 0;
  const fuelMat = vlmResult.telemetry.fuelMaterial || "PMMA";

  const criticReport = auditScientificTransportAndContradictions(
    {
      material: fuelMat,
      oxygenPct: o2Val,
      pressureKpa: pressVal,
      airflowCmS: flowVal,
      gravityG: vlmResult.telemetry.gravityG ?? 0,
      claim: securityAudit.sanitizedText.slice(0, 300),
    },
    corpus
  );
  const t3_dur = Date.now() - t3_start;

  swarmTimeline.push({
    agent: "Red-Team Critic",
    role: "Transport & Contradiction Auditor",
    status: criticReport.isThermodynamicallySound ? "PASSED" : "FAILED",
    durationMs: t3_dur,
    summary: criticReport.critiqueNotes,
  });

  // ============================================================================
  // Candidate Record Assembly
  // ============================================================================
  const stagedId = `staged-swarm-${Date.now().toString(36)}`;
  const stagedCandidate: StagedCandidateRecord = {
    stagedId,
    documentTitle: scraped.title,
    filename: scraped.filename,
    extractedAt: new Date().toISOString(),
    candidateProgramme: scraped.extractedMetadata.sourceOrg?.includes("NASA")
      ? "NASA PSI Flight"
      : "NASA Technical Report",
    candidatePlatform: "ISS Multi-User Combustion Facility",
    candidateMaterial: fuelMat,
    candidateOxygenPct: o2Val,
    candidateAirflowCmS: flowVal,
    candidatePressureKpa: pressVal,
    extractedFinding: `Extracted from ${scraped.filename}: ${scraped.rawText.slice(0, 180).trim()}...`,
    extractedQuote: scraped.rawText.slice(0, 120).trim(),
    pageNumber: 1,
    sourceLocator: input.url || scraped.extractedMetadata.doi || "Local Ingestion Queue",
    doi: scraped.extractedMetadata.doi || scraped.rawText.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/)?.[0],
    reviewStatus: "PENDING_REVIEW",
    extractedBoundingBoxes: vlmResult.boundingBoxes,
    extractedTables: vlmResult.tables,
  };

  // ============================================================================
  // Agent 4: Closed-Loop Simulation Reconciler
  // ============================================================================
  const t4_start = Date.now();
  const simulationReconciliation = reconcileCandidateWithSimulation({
    stagedId,
    material: fuelMat,
    oxygenPct: o2Val,
    pressureKpa: pressVal,
    airflowCmS: flowVal,
    sampleThicknessMm:
      vlmResult.telemetry.fuelDimensionsMm?.thicknessMm ||
      vlmResult.telemetry.fuelDimensionsMm?.diameterMm,
    reportedSpreadRateMmS: vlmResult.telemetry.flameSpreadRateMmS,
  });
  const t4_dur = Date.now() - t4_start;

  swarmTimeline.push({
    agent: "Simulation Reconciler",
    role: "Thermodynamic Closed-Loop Model Verifier",
    status: simulationReconciliation.agreementLevel === "HIGH_DISCREPANCY" ? "WARNING" : "PASSED",
    durationMs: t4_dur,
    summary: simulationReconciliation.discrepancyDiagnosis,
  });

  // ============================================================================
  // Agent 5: Flight Investigator Dossier Copilot
  // ============================================================================
  const t5_start = Date.now();
  const investigatorDossier = generateInvestigatorDossier(stagedCandidate, corpus);
  const t5_dur = Date.now() - t5_start;

  swarmTimeline.push({
    agent: "Investigator Dossier",
    role: "Certified Flight Investigator Copilot",
    status: investigatorDossier.riskLevel === "HIGH" ? "WARNING" : "PASSED",
    durationMs: t5_dur,
    summary: `Prepared 3-point checklist & 1-click rationale (${investigatorDossier.riskLevel} risk level).`,
  });

  // ============================================================================
  // Overall Rigor Score & Verdict Computation
  // ============================================================================
  let rigorScore = 70;
  if (vlmResult.tables.length > 0) rigorScore += 10;
  if (vlmResult.telemetry.fuelDimensionsMm) rigorScore += 5;
  if (criticReport.isThermodynamicallySound) rigorScore += 10;
  else rigorScore -= Math.round(criticReport.confidencePenalty / 2);

  if (simulationReconciliation.isReconciled) rigorScore += 5;
  rigorScore = Math.max(10, Math.min(100, rigorScore));

  const isApproved = rigorScore >= 60 && criticReport.isThermodynamicallySound;
  const overallVerdict = isApproved ? "STAGED_FOR_REVIEW" : "REJECTED_UNVERIFIED";

  const summary = isApproved
    ? `SWARM AUDIT PASS (${rigorScore}/100): All 5 agents completed telemetry extraction, physical criticism, and simulation reconciliation. Staged for human verification.`
    : `SWARM AUDIT REJECT (${rigorScore}/100): Candidate failed thermodynamic consistency or empirical rigor checks.`;

  return {
    overallVerdict,
    rigorScore,
    securityScore,
    isSafe: true,
    stagedCandidate,
    securityAudit,
    vlmResult,
    criticReport,
    simulationReconciliation,
    investigatorDossier,
    swarmTimeline,
    scannedAt: new Date().toISOString(),
    summary,
  };
}
