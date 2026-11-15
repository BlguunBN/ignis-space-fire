/**
 * Closed-Loop Simulation Reconciliation Agent (Phase 4)
 * 
 * Auto-runs physical combustion models on extracted paper conditions and computes
 * reconciliation discrepancies (% Delta) against reported empirical spread rates.
 * Diagnoses heat loss mechanisms (internal conduction, radiative soot, convective blow-off).
 */

import { StagedCandidateRecord } from "./ingestion";

export interface TheoreticalSimulationResult {
  material: string;
  spreadRateMmS: number;
  burnoutTimeSec: number;
  isQuenched: boolean;
  quenchReason?: string;
  flammabilityRegime: string;
}

export interface SimulationReconciliationInput {
  stagedId?: string;
  material: string;
  oxygenPct: number;
  pressureKpa: number;
  airflowCmS: number;
  gravityG?: number;
  sampleThicknessMm?: number;
  reportedSpreadRateMmS?: number;
  reportedExtinctionLimitO2Pct?: number;
}

export interface SimulationReconciliationResult {
  stagedId: string;
  material: string;
  simulatedSpreadRateMmS: number;
  reportedSpreadRateMmS?: number;
  percentDelta?: number;
  agreementLevel: "EXCELLENT" | "MODERATE" | "HIGH_DISCREPANCY" | "THEORY_BASELINE_ONLY";
  discrepancyDiagnosis: string;
  physicalMechanisms: string[];
  flammabilityRegime: string;
  isReconciled: boolean;
  simulatedAt: string;
}

/**
 * Executes theoretical combustion heat transfer simulation based on NASA microgravity flammability models.
 */
export function simulateTheoreticalFlameSpread(
  input: SimulationReconciliationInput
): TheoreticalSimulationResult {
  const o2 = input.oxygenPct;
  const press = input.pressureKpa;
  const flow = Math.max(0, input.airflowCmS);
  const matLower = input.material.toLowerCase();
  const thickMm = input.sampleThicknessMm ?? (matLower.includes("thick") ? 20 : matLower.includes("thin") ? 1 : 2);

  // 1. Quenching and LOI Boundaries
  if (matLower.includes("pmma")) {
    if (o2 < 14.5) {
      return {
        material: "PMMA",
        spreadRateMmS: 0,
        burnoutTimeSec: 0,
        isQuenched: true,
        quenchReason: `Extinction: ${o2}% O2 is below PMMA limiting oxygen index (~17%).`,
        flammabilityRegime: "EXTINGUISHED_SUB_LOI",
      };
    }
  } else if (matLower.includes("sibal") || matLower.includes("cotton")) {
    if (o2 < 13.5) {
      return {
        material: "SIBAL",
        spreadRateMmS: 0,
        burnoutTimeSec: 0,
        isQuenched: true,
        quenchReason: `Extinction: ${o2}% O2 is below cotton fabric limiting oxygen index (~15%).`,
        flammabilityRegime: "EXTINGUISHED_SUB_LOI",
      };
    }
  }

  // Blow-off quenching under deep sub-atmospheric depressurization
  if (press < 20 && flow > 40) {
    return {
      material: input.material,
      spreadRateMmS: 0,
      burnoutTimeSec: 0,
      isQuenched: true,
      quenchReason: "Convective blow-off quenching under deep sub-atmospheric depressurization.",
      flammabilityRegime: "CONVECTIVE_BLOW_OFF",
    };
  }

  // 2. Spread Rate Calculation
  let baseRate = 0.88; // Default thin fabric at 10 cm/s, 21% O2, 101.3 kPa
  let m_flow = 0.55;
  let n_o2 = 1.25;
  let p_press = 0.30;
  let regime = "FORCED_CONVECTIVE_SPREAD";

  if (matLower.includes("pmma")) {
    regime = thickMm >= 10 ? "THICK_CONDUCTIVE_SOLID" : "THIN_THERMOPLASTIC";
    baseRate = thickMm >= 10 ? 0.35 : 0.65;
    m_flow = 0.45;
    n_o2 = 1.35;
    p_press = 0.25;
  } else if (matLower.includes("droplet") || matLower.includes("methanol") || matLower.includes("heptane")) {
    regime = "SPHERICAL_DROPLET_DIFFUSION";
    baseRate = 0.12;
    m_flow = 0.10;
    n_o2 = 0.45;
    p_press = 0.12;
  }

  const flowFactor = Math.pow(Math.max(1, flow) / 10, m_flow);
  const o2Factor = Math.pow(o2 / 21, n_o2);
  const pressFactor = Math.pow(press / 101.3, p_press);

  let spreadRate = baseRate * flowFactor * o2Factor * pressFactor;

  // Conductive thickness quenching penalty for large solid specimens
  if (thickMm > 10 && !matLower.includes("droplet")) {
    const conductionReduction = Math.pow(10 / thickMm, 0.45);
    spreadRate *= conductionReduction;
  }

  spreadRate = +(Math.max(0.01, spreadRate).toFixed(3));
  const burnoutTimeSec = +(100 / Math.max(0.05, spreadRate)).toFixed(1);

  return {
    material: input.material,
    spreadRateMmS: spreadRate,
    burnoutTimeSec,
    isQuenched: false,
    flammabilityRegime: regime,
  };
}

/**
 * Reconciles candidate paper empirical measurements against simulated physics.
 */
export function reconcileCandidateWithSimulation(
  candidate: StagedCandidateRecord | SimulationReconciliationInput
): SimulationReconciliationResult {
  const stagedId = candidate.stagedId || "staged-unknown";
  const material = "candidateMaterial" in candidate ? candidate.candidateMaterial : candidate.material;
  const o2 = "candidateOxygenPct" in candidate ? candidate.candidateOxygenPct : candidate.oxygenPct;
  const press = "candidatePressureKpa" in candidate ? candidate.candidatePressureKpa : candidate.pressureKpa;
  const flow = "candidateAirflowCmS" in candidate ? candidate.candidateAirflowCmS : candidate.airflowCmS;

  const sampleThicknessMm = "sampleThicknessMm" in candidate ? candidate.sampleThicknessMm : undefined;
  const reportedSpreadRateMmS = "reportedSpreadRateMmS" in candidate ? candidate.reportedSpreadRateMmS : undefined;

  const sim = simulateTheoreticalFlameSpread({
    material,
    oxygenPct: o2,
    pressureKpa: press,
    airflowCmS: flow,
    sampleThicknessMm,
  });

  const physicalMechanisms: string[] = [];
  let agreementLevel: "EXCELLENT" | "MODERATE" | "HIGH_DISCREPANCY" | "THEORY_BASELINE_ONLY" = "THEORY_BASELINE_ONLY";
  let percentDelta: number | undefined;
  let discrepancyDiagnosis = "";
  let isReconciled = false;

  if (reportedSpreadRateMmS != null && sim.spreadRateMmS > 0) {
    const delta = Math.abs(reportedSpreadRateMmS - sim.spreadRateMmS);
    percentDelta = +((delta / sim.spreadRateMmS) * 100).toFixed(1);

    if (percentDelta <= 20) {
      agreementLevel = "EXCELLENT";
      discrepancyDiagnosis = `Reported rate (${reportedSpreadRateMmS.toFixed(2)} mm/s) matches theoretical prediction (${sim.spreadRateMmS.toFixed(2)} mm/s, Δ=${percentDelta}%) within standard experimental scatter.`;
      physicalMechanisms.push("Quasi-steady gas-phase energy conservation");
      physicalMechanisms.push("Unimpeded forward convective heat flux");
      isReconciled = true;
    } else if (percentDelta <= 45) {
      agreementLevel = "MODERATE";
      discrepancyDiagnosis = `Moderate divergence (Δ=${percentDelta}%): Minor boundary layer differences or chamber wall radiation effects present.`;
      physicalMechanisms.push("Boundary layer thermal divergence");
      physicalMechanisms.push("Weak radiative wall exchange");
      isReconciled = true;
    } else {
      agreementLevel = "HIGH_DISCREPANCY";
      if (reportedSpreadRateMmS < sim.spreadRateMmS) {
        discrepancyDiagnosis = `Significant experimental depression (Reported ${reportedSpreadRateMmS.toFixed(2)} vs Theory ${sim.spreadRateMmS.toFixed(2)} mm/s, Δ=${percentDelta}%): Internal conductive heat loss or radiative soot cooling dominant.`;
        physicalMechanisms.push("Internal conductive heat sink into sample core");
        physicalMechanisms.push("Radiative soot emission quenching");
        physicalMechanisms.push("Sample holder clip heat extraction");
      } else {
        discrepancyDiagnosis = `Significant experimental acceleration (Reported ${reportedSpreadRateMmS.toFixed(2)} vs Theory ${sim.spreadRateMmS.toFixed(2)} mm/s, Δ=${percentDelta}%): Enhanced forward preheating or oxygen pooling.`;
        physicalMechanisms.push("Forward gas-phase convective flame tongue preheating");
        physicalMechanisms.push("Pyrolysis gas recirculation");
      }
      isReconciled = false;
    }
  } else {
    agreementLevel = "THEORY_BASELINE_ONLY";
    discrepancyDiagnosis = sim.isQuenched
      ? `Theoretical simulation predicts extinction: ${sim.quenchReason}`
      : `Theoretical baseline establishes steady spread rate at ${sim.spreadRateMmS.toFixed(2)} mm/s in ${sim.flammabilityRegime} regime.`;
    isReconciled = !sim.isQuenched;
  }

  return {
    stagedId,
    material,
    simulatedSpreadRateMmS: sim.spreadRateMmS,
    reportedSpreadRateMmS,
    percentDelta,
    agreementLevel,
    discrepancyDiagnosis,
    physicalMechanisms,
    flammabilityRegime: sim.flammabilityRegime,
    isReconciled,
    simulatedAt: new Date().toISOString(),
  };
}
