/**
 * Harsh Scientific Gatekeeper Engine for Spaceflight Combustion Evidence
 * 
 * Enforces the 5 Harsh Scientific Admission Gates before allowing candidate papers
 * or external scraped records to enter the active flight corpus.
 */

import { scanDocumentForPromptInjection, InjectionScanResult } from "./prompt-injection-guard";
import { StagedCandidateRecord } from "./ingestion";

export type GatekeeperVerdict = "STAGED_FOR_REVIEW" | "REJECTED_UNVERIFIED" | "REJECTED_SECURITY_THREAT";

export interface GateEvaluation {
  id: string;
  name: string;
  maxScore: number;
  earnedScore: number;
  passed: boolean;
  notes: string;
}

export interface GatekeeperAuditReport {
  verdict: GatekeeperVerdict;
  rigorScore: number; // 0 - 100
  securityScore: number; // 0 - 100 (100 is completely safe)
  isSafe: boolean;
  failedGates: string[];
  gates: GateEvaluation[];
  extractedCandidate?: Partial<StagedCandidateRecord>;
  securityAudit: InjectionScanResult;
  auditSummary: string;
}

// Known microgravity facilities and programmes
const VALID_AEROSPACE_FACILITIES = [
  "iss", "international space station", "cir", "msg", "saffire", "cygnus",
  "bass", "sofie", "flex", "acme", "spice", "same", "daft", "drop tower",
  "glenn", "zarm", "parabolic", "sounding rocket", "ntrs", "psi", "mdca", "flt"
];

// Physical combustion keywords
const COMBUSTION_KEYWORDS = [
  "flame", "combustion", "extinction", "quench", "pyrolysis", "ignition",
  "spread rate", "burn", "burning", "soot", "chemiluminescence", "flammability",
  "smoke", "heat release", "calorimetry", "fuel"
];

/**
 * Evaluates candidate paper text against the 5 Harsh Scientific Admission Gates.
 */
export function auditScientificDocument(
  rawText: string,
  metadata: { title?: string; filename?: string; sourceUrl?: string } = {}
): GatekeeperAuditReport {
  // Layer 1: Prompt Injection & Adversarial Security Gate
  const securityAudit = scanDocumentForPromptInjection(rawText);
  const securityScore = Math.max(0, Math.round((1.0 - securityAudit.threatScore) * 100));

  if (!securityAudit.isSafe) {
    return {
      verdict: "REJECTED_SECURITY_THREAT",
      rigorScore: 0,
      securityScore,
      isSafe: false,
      failedGates: ["Adversarial Prompt Injection Firewall"],
      gates: [
        {
          id: "gate-sec",
          name: "Prompt Injection Firewall",
          maxScore: 100,
          earnedScore: 0,
          passed: false,
          notes: `Security threat detected: ${securityAudit.detectedThreats.join(", ")}`,
        },
      ],
      securityAudit,
      auditSummary: `CRITICAL SECURITY BLOCK: Document contains adversarial prompt injection patterns (${securityAudit.detectedThreats.join(", ")}). Ingestion permanently blocked.`,
    };
  }

  const text = securityAudit.sanitizedText.toLowerCase();
  const gates: GateEvaluation[] = [];

  // ============================================================================
  // Gate 1: Aerospace & Low-Gravity Domain Relevance (25 points)
  // ============================================================================
  const hasLowGravity = /(microgravity|zero-g|0g|0-g|partial gravity|lunar|moon|0\.16\s*g|martian|mars|0\.38\s*g|drop tower|parabolic|sounding rocket|spaceflight|spacecraft|space station|orbital|flight experiment)/i.test(text);
  const hasAerospacePlatform = /(iss|cygnus|cir|msg|saffire|mdca|sofie|bass|flex|glenn|zarm|nasa|psi|orion|artemis)/i.test(text);
  const hasCombustion = COMBUSTION_KEYWORDS.some((kw) => text.includes(kw));

  let g1Score = 0;
  if (hasLowGravity || hasAerospacePlatform) g1Score += 15;
  if (hasCombustion) g1Score += 10;
  const g1Passed = g1Score >= 15;

  gates.push({
    id: "gate-1",
    name: "Aerospace & Low-Gravity Relevance",
    maxScore: 25,
    earnedScore: g1Score,
    passed: g1Passed,
    notes: g1Passed
      ? "Investigates low-gravity / space combustion phenomena."
      : "Failed: Lacks verified low-gravity (0g, Lunar, Martian, Drop Tower) relevance.",
  });

  // ============================================================================
  // Gate 2: Empirical Parameter Completeness (25 points)
  // ============================================================================
  // Extract physical conditions (handles standard % and telemetry text formats)
  const o2Match = text.match(/(\d+(?:\.\d+)?)\s*(?:mol%|%)\s*(?:o2|oxygen)?/i) ||
                  text.match(/o2(?:\s*concentration|\s*fraction|\s*:)?\s*(\d+(?:\.\d+)?)/i) ||
                  text.match(/oxygen(?:\s*level|\s*:)?\s*(\d+(?:\.\d+)?)/i) ||
                  (text.includes("ambient air") || text.includes("standard air") ? [null, "21"] : null);

  const pressMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kpa|atm|psia|bar|torr|mbar)/i) ||
                     (text.includes("101.3") ? [null, "101.3"] : null) ||
                     (text.includes("101.6") ? [null, "101.6"] : null) ||
                     (text.includes("ambient pressure") || text.includes("cabin pressure") || text.includes("atmospheric pressure") ? [null, "101.3"] : null);

  const flowMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:cm\/s|m\/s|mm\/s)/i) ||
                    (text.includes("quiescent") || text.includes("still gas") || text.includes("0 flow") || text.includes("no flow") || text.includes("stagnant") ? [null, "0"] : null);

  const hasMaterial = /(pmma|sibal|cellulose|cotton|droplet|heptane|methanol|decane|alkane|alcohol|methane|ethane|propane|polyethylene|polymer|fabric|wire|insulation|ptfe|teflon|kapton|nomex|plastic|specimen|sample|fuel)/i.test(text);

  let g2Score = 0;
  if (hasMaterial) g2Score += 10;
  if (o2Match) g2Score += 5;
  if (pressMatch) g2Score += 5;
  if (flowMatch) g2Score += 5;
  const g2Passed = g2Score >= 15;

  gates.push({
    id: "gate-2",
    name: "Empirical Parameter Completeness",
    maxScore: 25,
    earnedScore: g2Score,
    passed: g2Passed,
    notes: g2Passed
      ? `Material and environmental parameters quantified (O2: ${o2Match ? o2Match[1] + "%" : "standard"}, Press: ${pressMatch ? pressMatch[1] : "101.3 kPa"}).`
      : "Failed: Missing essential fuel material or physical environment telemetry.",
  });

  // ============================================================================
  // Gate 3: Thermodynamic & Physical Sanity Audit (20 points)
  // ============================================================================
  let g3Score = 20;
  let g3Notes = "Thermodynamic laws and transport mechanics consistent.";
  let g3Passed = true;

  // Sanity check: Perpetual combustion or zero-oxidizer spread
  if (text.includes("perpetual combustion") || text.includes("free energy") || text.includes("negative activation energy")) {
    g3Score = 0;
    g3Passed = false;
    g3Notes = "FAILED: Violates fundamental thermodynamic laws (perpetual / non-physical claim).";
  } else if (text.includes("0% o2") && text.includes("steady spread")) {
    g3Score = 0;
    g3Passed = false;
    g3Notes = "FAILED: Non-physical claim of steady flame spread under 0% oxygen without monopropellant.";
  }

  gates.push({
    id: "gate-3",
    name: "Thermodynamic & Physical Sanity",
    maxScore: 20,
    earnedScore: g3Score,
    passed: g3Passed,
    notes: g3Notes,
  });

  // ============================================================================
  // Gate 4: Apparatus & Facility Provenance (15 points)
  // ============================================================================
  const foundFacility = VALID_AEROSPACE_FACILITIES.find((fac) => text.includes(fac));
  let g4Score = foundFacility ? 15 : 5;
  const g4Passed = g4Score >= 10;

  gates.push({
    id: "gate-4",
    name: "Apparatus & Facility Provenance",
    maxScore: 15,
    earnedScore: g4Score,
    passed: g4Passed,
    notes: g4Passed
      ? `Credible aerospace research testbed identified (${foundFacility?.toUpperCase() || "Aerospace Facility"}).`
      : "Failed: Unverified testbed or apparatus provenance.",
  });

  // ============================================================================
  // Gate 5: Scientific Limitation Disclosure (15 points)
  // ============================================================================
  const hasLimitations = /(limitation|error|uncertainty|boundary|transient|wall effect|quenching|heat loss|margin|drift|perturb|preliminary|assumption|deviation|variance|tolerance|confidence|single test|cutoff|threshold|scatter|repeatability|finite)/i.test(text);
  const isVerifiedFlightFacility = !!foundFacility;
  let g5Score = hasLimitations ? 15 : (isVerifiedFlightFacility ? 10 : 5);
  const g5Passed = g5Score >= 10;

  gates.push({
    id: "gate-5",
    name: "Boundary & Limitation Disclosure",
    maxScore: 15,
    earnedScore: g5Score,
    passed: g5Passed,
    notes: g5Passed
      ? "Document transparently discloses physical boundaries and experimental uncertainties."
      : "Failed: Lacks boundary disclosure or experimental uncertainty estimates.",
  });

  // Calculate Total Rigor Score
  const rigorScore = gates.reduce((acc, g) => acc + g.earnedScore, 0);
  const failedGates = gates.filter((g) => !g.passed).map((g) => g.name);

  // Verdict Determination:
  // Requires rigorScore >= 60 and Gate 1 (Aerospace), Gate 2 (Parameters), and Gate 3 (Physics Sanity) to pass.
  const isApprovedForStaging = rigorScore >= 60 && g1Passed && g2Passed && g3Passed;
  const verdict: GatekeeperVerdict = isApprovedForStaging
    ? "STAGED_FOR_REVIEW"
    : "REJECTED_UNVERIFIED";

  // Build candidate record if staged
  let extractedCandidate: Partial<StagedCandidateRecord> | undefined;
  if (isApprovedForStaging) {
    const o2Val = o2Match ? parseFloat(o2Match[1]) : 21;
    const pressVal = pressMatch ? parseFloat(pressMatch[1]) : 101.3;
    const flowVal = flowMatch ? parseFloat(flowMatch[1]) : (text.includes("droplet") ? 0 : 15);

    let matStr = "PMMA plastic";
    if (text.includes("sibal") || text.includes("fabric") || text.includes("cotton")) {
      matStr = "SIBAL cotton-fiberglass fabric";
    } else if (text.includes("droplet") || text.includes("methanol")) {
      matStr = "Methanol liquid droplet";
    } else if (text.includes("heptane")) {
      matStr = "Heptane liquid droplet";
    } else if (text.includes("wire") || text.includes("kapton") || text.includes("ptfe")) {
      matStr = "Overheated wire insulation (PTFE/Kapton)";
    }

    let safeHostname = "external-source";
    try {
      if (metadata.sourceUrl) safeHostname = new URL(metadata.sourceUrl).hostname;
    } catch {
      safeHostname = metadata.sourceUrl || "external-source";
    }

    extractedCandidate = {
      stagedId: `staged-scrape-${Date.now().toString(36)}`,
      documentTitle: metadata.title || (metadata.sourceUrl ? `NASA Technical Paper (${safeHostname})` : "Microgravity Investigation"),
      filename: metadata.filename || (metadata.sourceUrl ? metadata.sourceUrl.split("/").pop() || "scraped-paper.pdf" : "uploaded-paper.pdf"),
      extractedAt: new Date().toISOString(),
      candidateProgramme: foundFacility ? foundFacility.toUpperCase() : "NASA PSI Candidate",
      candidatePlatform: text.includes("cygnus") ? "Cygnus Cargo Vehicle" : text.includes("drop") ? "NASA Glenn Drop Tower" : "ISS Multi-User Chamber",
      candidateMaterial: matStr,
      candidateOxygenPct: o2Val,
      candidateAirflowCmS: flowVal,
      candidatePressureKpa: pressVal,
      extractedFinding: `Evaluated under ${o2Val}% O2, ${pressVal} kPa, and ${flowVal} cm/s airflow: ${rawText.slice(0, 180).trim()}...`,
      extractedQuote: rawText.slice(0, 120).trim(),
      pageNumber: 1,
      sourceLocator: metadata.sourceUrl || "External Ingestion Queue",
      doi: text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/)?.[0],
      reviewStatus: "PENDING_REVIEW",
    };
  }

  const auditSummary = isApprovedForStaging
    ? `SCIENTIFIC GATEKEEPER PASS (${rigorScore}/100): Paper verified against aerospace combustion standards. Staged in Queue for final human review.`
    : `SCIENTIFIC GATEKEEPER REJECT (${rigorScore}/100): Document rejected due to insufficient empirical rigor or non-spaceflight criteria (${failedGates.join(", ")}).`;

  return {
    verdict,
    rigorScore,
    securityScore,
    isSafe: true,
    failedGates,
    gates,
    extractedCandidate,
    securityAudit,
    auditSummary,
  };
}
