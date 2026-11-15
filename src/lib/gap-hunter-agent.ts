/**
 * Autonomous Gap Hunter & Artemis Lunar Experiment Generator (Phase 5)
 * 
 * Analyzes the 72-cell combustion research matrix (Fuels x Gravity x Oxygen) to uncover
 * empirical white spaces in spaceflight data, and autonomously synthesizes 4-tier
 * hypothesis trees for Artemis Lunar (0.16g) and Partial Gravity exploration.
 */

import { ExperimentRecord } from "../types/evidence";
import { BuildHypothesisTreeArgs } from "./agent-tools";

export interface ResearchGapCell {
  key: string;
  materialId: string;
  materialLabel: string;
  gravityId: string;
  gravityLabel: string;
  o2Id: string;
  o2Label: string;
  recordCount: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  gapRationale: string;
}

export interface ResearchGapScanResult {
  totalCells: number; // 72
  emptyCount: number;
  limitedCount: number;
  strongCount: number;
  gaps: ResearchGapCell[];
  scannedAt: string;
}

export const MATERIAL_CATEGORIES = [
  {
    id: "liquid_droplets",
    label: "Liquid Droplets",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("droplet") ||
      r.material.toLowerCase().includes("methanol") ||
      r.material.toLowerCase().includes("heptane") ||
      r.material.toLowerCase().includes("alkane") ||
      r.material.toLowerCase().includes("liquid") ||
      r.material_class === "liquid_droplet",
  },
  {
    id: "pmma",
    label: "PMMA Thermoplastic",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("pmma") ||
      r.material.toLowerCase().includes("polymethyl") ||
      r.material.toLowerCase().includes("acrylic"),
  },
  {
    id: "fabrics_cellulose",
    label: "Fabrics & Thin Cellulose",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("cotton") ||
      r.material.toLowerCase().includes("sibal") ||
      r.material.toLowerCase().includes("cellulose") ||
      r.material_class === "solid_fabric",
  },
  {
    id: "wire_insulation",
    label: "Wire Insulation",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("wire") ||
      r.material.toLowerCase().includes("insulation") ||
      r.material.toLowerCase().includes("ptfe") ||
      r.material.toLowerCase().includes("kapton"),
  },
  {
    id: "gaseous_fuels",
    label: "Gaseous Fuels",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("gaseous") ||
      r.material.toLowerCase().includes("methane") ||
      r.material.toLowerCase().includes("ethylene") ||
      r.material_class === "gas_fuel",
  },
  {
    id: "other_solids",
    label: "Other Solid Materials",
    matcher: (r: ExperimentRecord) =>
      r.material.toLowerCase().includes("silicone") ||
      r.material.toLowerCase().includes("nomex") ||
      r.material.toLowerCase().includes("rods") ||
      r.material_class === "solid_other",
  },
];

export const GRAVITY_REGIMES = [
  { id: "microgravity", label: "Microgravity (0g)", value: "microgravity" },
  { id: "partial_low", label: "Partial (<0.16g)", value: "partial_low" },
  { id: "lunar", label: "Lunar (0.16g)", value: "lunar" },
  { id: "martian", label: "Martian (0.38g)", value: "martian" },
];

export const O2_BINS = [
  { id: "low", label: "<17% O₂ (Sub-LOI)", min: 0, max: 16.9 },
  { id: "standard", label: "17–23% O₂ (Nominal Air)", min: 17, max: 23 },
  { id: "high", label: ">23% O₂ (Exploration Atmosphere)", min: 23.1, max: 100 },
];

/**
 * Evaluates the full 72-cell research space against corpus records.
 */
export function scanCorpusForResearchGaps(corpus: ExperimentRecord[]): ResearchGapScanResult {
  let emptyCount = 0;
  let limitedCount = 0;
  let strongCount = 0;
  const gaps: ResearchGapCell[] = [];

  for (const mat of MATERIAL_CATEGORIES) {
    for (const grav of GRAVITY_REGIMES) {
      for (const o2 of O2_BINS) {
        const matchingRecords = corpus.filter((r) => {
          if (!mat.matcher(r)) return false;

          // Gravity matching
          if (grav.id === "microgravity") {
            if (r.gravity !== "microgravity" && (r.gravity as string) !== "0g") return false;
          } else if (grav.id === "lunar") {
            if (r.gravity !== "lunar" && (r.gravity as string) !== "0.16g") return false;
          } else if (grav.id === "martian") {
            if (r.gravity !== "martian" && (r.gravity as string) !== "0.38g") return false;
          } else if (grav.id === "partial_low") {
            if (r.gravity !== "partial_gravity" && r.gravity !== "partial_low") return false;
          }

          // Oxygen matching
          if (r.oxygen_pct == null) return o2.id === "standard";
          return r.oxygen_pct >= o2.min && r.oxygen_pct <= o2.max;
        });

        const count = matchingRecords.length;
        if (count === 0) emptyCount++;
        else if (count <= 2) limitedCount++;
        else strongCount++;

        if (count <= 2) {
          let priority: "CRITICAL" | "HIGH" | "MEDIUM" = "MEDIUM";
          if (grav.id === "lunar" || grav.id === "partial_low") {
            priority = o2.id === "high" ? "CRITICAL" : "HIGH";
          } else if (o2.id === "high") {
            priority = "HIGH";
          }

          const gapRationale =
            count === 0
              ? `Zero empirical flight datasets recorded for ${mat.label} in ${grav.label} under ${o2.label}.`
              : `Only ${count} sparse flight observation recorded for ${mat.label} in ${grav.label}.`;

          gaps.push({
            key: `${mat.id}__${grav.id}__${o2.id}`,
            materialId: mat.id,
            materialLabel: mat.label,
            gravityId: grav.id,
            gravityLabel: grav.label,
            o2Id: o2.id,
            o2Label: o2.label,
            recordCount: count,
            priority,
            gapRationale,
          });
        }
      }
    }
  }

  // Sort gaps by priority: CRITICAL first, then HIGH, then MEDIUM
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    totalCells: 72,
    emptyCount,
    limitedCount,
    strongCount,
    gaps,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Autonomously synthesizes a structured 4-tier Artemis hypothesis tree for a specific gap cell.
 */
export function generateArtemisHypothesisTree(
  gap: ResearchGapCell,
  corpus: ExperimentRecord[]
): BuildHypothesisTreeArgs {
  const isLunar = gap.gravityId === "lunar";
  const isHighO2 = gap.o2Id === "high";

  // Find nearest historical claims from corpus
  const candidateClaims: string[] = [];
  const relevantRecords = corpus.filter(
    (r) =>
      r.material.toLowerCase().includes(gap.materialId.slice(0, 4)) ||
      r.programme?.toLowerCase().includes("saffire") ||
      r.programme?.toLowerCase().includes("sofie")
  );

  for (const r of relevantRecords) {
    if (r.primary_claim_locator?.claim_id) {
      candidateClaims.push(r.primary_claim_locator.claim_id);
    }
    if (candidateClaims.length >= 3) break;
  }
  if (candidateClaims.length === 0) {
    candidateClaims.push("CLM-SOFIE-001", "CLM-SAFFIRE-002");
  }

  const matName = gap.materialLabel;
  const gravName = gap.gravityLabel;
  const o2Name = gap.o2Label;

  const questionTitle = isLunar
    ? `Artemis Lunar (0.16g) Flammability Transition for ${matName}`
    : `Reduced Gravity Ignition & Spread Boundaries for ${matName} (${gravName})`;

  const questionDetails = `NASA Artemis surface missions will operate habitats in reduced gravity (${gravName}) with Exploration Atmospheres (up to 34% O₂ at 57 kPa). How does weak partial buoyancy couple with low-speed forced ventilation (2–10 cm/s) to govern concurrent flame spread and conductive quenching for ${matName}?`;

  const hypothesisTitle = isLunar
    ? "Weak Buoyancy Assisted Boundary-Layer Thinning"
    : "Convective-Radiative Heat Balance Inversion";

  const hypothesisPrediction = isHighO2
    ? `Under ${gravName} and ${o2Name}, weak upward buoyancy of 0.16g thins the thermal boundary layer, accelerating forward flame heat transfer by 25–40% relative to pure microgravity.`
    : `In ${gravName}, reduced buoyant purging allows soot buildup while partial natural convection prevents immediate oxygen starvation, creating an intermediate persistence regime.`;

  const hypothesisRationale =
    "In microgravity (0g), transport is purely diffusive or forced convective. At 0.16g Lunar gravity, the Richardson number Ri falls into a mixed regime (0.1 < Ri < 2.0), where neither forced nor natural convection completely dominates, shifting flame holding points.";

  const counterTitle = "Enhanced Conductive Quenching Dominance";
  const counterPrediction =
    "The 0.16g gravitational acceleration is insufficient to overcome viscous damping at low cabin velocities, causing thick fuel conduction losses to quench propagation.";
  const counterRationale =
    "Without energetic plume lifting, thermal conduction into the solid fuel substrate exceeds localized chemical heat release.";

  const facility = isLunar
    ? "Artemis Gateway Testbed / NASA Glenn Drop Tower & Parabolic Partial-g"
    : "ISS Combustion Integrated Rack (CIR) / Partial-Gravity Parabolic";

  const airflow = "3 – 12 cm/s controlled forced ventilation";
  const oxygen = isHighO2 ? "26% – 34% O₂ (Artemis Exploration Atmosphere)" : "21% – 28% O₂";
  const pressure = isHighO2 ? "56 – 70 kPa (Exploration Atmosphere)" : "101.3 kPa";
  const geometry = `${matName} sample (150mm x 50mm x 10mm) instrumented with embedded micro-thermocouple array and heat flux radiometer`;

  return {
    question: {
      title: questionTitle,
      details: questionDetails,
    },
    evidenceClaims: candidateClaims,
    hypothesis: {
      title: hypothesisTitle,
      prediction: hypothesisPrediction,
      rationale: hypothesisRationale,
    },
    counterHypothesis: {
      title: counterTitle,
      prediction: counterPrediction,
      rationale: counterRationale,
    },
    validationExperiment: {
      facility,
      objective: `Validate flame spread rate and extinction boundary for ${matName} in ${gravName} under ${oxygen}.`,
      airflow,
      oxygen,
      pressure,
      geometry,
    },
  };
}
