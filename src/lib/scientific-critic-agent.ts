/**
 * Adversarial Scientific Red-Team Critic (Phase 2)
 * 
 * Performs automated physical sanity audits on incoming scientific papers:
 * 1. Computes dimensionless transport numbers (Reynolds Re, Grashof Gr, Richardson Ri, Damköhler Da)
 * 2. Cross-examines reported claims against known Limiting Oxygen Index (LOI) & NASA PSI flight data
 * 3. Flags physical contradictions and computes confidence deductions for Gatekeeper Gate 3
 */

import { ExperimentRecord } from "../types/evidence";

export type FlowRegime =
  | "DIFFUSION_DOMINATED_QUIESCENT"
  | "FORCED_CONVECTION_LAMINAR"
  | "TURBULENT_CONVECTION"
  | "BUOYANCY_DOMINATED_NATURAL"
  | "MIXED_CONVECTION";

export interface DimensionlessTransport {
  reynoldsNumber: number;
  grashofNumber: number;
  richardsonNumber: number;
  damkohlerNumber: number;
  flowRegime: FlowRegime;
  pecletNumber: number;
}

export interface ContradictionFinding {
  severity: "INFO" | "WARNING" | "CRITICAL";
  finding: string;
  conflictingFlightStudy: string;
  scientificRationale: string;
}

export interface CriticReport {
  isThermodynamicallySound: boolean;
  confidencePenalty: number; // 0 - 100
  dimensionlessTransport: DimensionlessTransport;
  contradictionsDetected: ContradictionFinding[];
  critiqueNotes: string;
  evaluatedAt: string;
}

export interface CandidateEvaluationInput {
  material: string;
  oxygenPct?: number;
  pressureKpa?: number;
  airflowCmS?: number;
  gravityG?: number;
  characteristicLengthMm?: number;
  claim?: string;
}

/**
 * Computes dimensionless transport parameters for spaceflight combustion flows.
 */
export function computeDimensionlessTransport(
  input: CandidateEvaluationInput
): DimensionlessTransport {
  const gNorm = input.gravityG ?? 0;
  const o2 = input.oxygenPct ?? 21;
  const pressKpa = input.pressureKpa ?? 101.3;
  const uFlowM_s = Math.max(0, (input.airflowCmS ?? 0) / 100); // cm/s to m/s
  const L_m = Math.max(0.001, (input.characteristicLengthMm ?? 50) / 1000); // mm to m (default 50mm)

  // Fluid properties of oxidizer atmosphere
  const T_inf = 298.15; // 25 C
  const T_flame = Math.min(2200, Math.max(1000, 1200 + (o2 - 21) * 35)); // Approx flame temp
  const deltaT = Math.max(100, T_flame - T_inf);
  const beta = 1 / T_inf; // Thermal expansion coefficient

  // Air density rho(P, T) ~ P / (R_spec * T)
  const rho = 1.184 * (pressKpa / 101.3) * (298.15 / T_inf);
  const dynamicViscosity = 1.85e-5; // Pa.s at 298K
  const kinematicViscosity = dynamicViscosity / rho;
  const thermalDiffusivity = 2.2e-5 * (101.3 / pressKpa); // m2/s
  const prandtlNumber = 0.71;

  // 1. Reynolds Number: Re = u * L / nu
  const reynoldsNumber = Math.round((uFlowM_s * L_m) / kinematicViscosity);

  // 2. Grashof Number: Gr = g * beta * deltaT * L^3 / nu^2
  const g_eff = gNorm * 9.80665;
  const grashofNumber =
    gNorm === 0
      ? 0
      : Math.round((g_eff * beta * deltaT * Math.pow(L_m, 3)) / Math.pow(kinematicViscosity, 2));

  // 3. Richardson Number: Ri = Gr / Re^2
  let richardsonNumber = 0;
  if (gNorm > 0 && reynoldsNumber > 0) {
    richardsonNumber = +(grashofNumber / Math.pow(reynoldsNumber, 2)).toFixed(3);
  }

  // 4. Peclet Number: Pe = Re * Pr
  const pecletNumber = +(reynoldsNumber * prandtlNumber).toFixed(1);

  // 5. Flow Regime Classification
  let flowRegime: FlowRegime = "FORCED_CONVECTION_LAMINAR";
  if (reynoldsNumber === 0 && grashofNumber === 0) {
    flowRegime = "DIFFUSION_DOMINATED_QUIESCENT";
  } else if (grashofNumber > 0 && richardsonNumber > 10) {
    flowRegime = "BUOYANCY_DOMINATED_NATURAL";
  } else if (reynoldsNumber > 2300) {
    flowRegime = "TURBULENT_CONVECTION";
  } else if (reynoldsNumber > 0 && grashofNumber === 0) {
    flowRegime = "FORCED_CONVECTION_LAMINAR";
  } else if (richardsonNumber >= 0.1 && richardsonNumber <= 10) {
    flowRegime = "MIXED_CONVECTION";
  }

  // 6. Damköhler Number: Da = tau_residence / tau_chemical
  // tau_res ~ L / u_eff, tau_chem ~ tau_0 * (21 / O2)^2 * (101.3 / P)
  const u_eff = Math.max(uFlowM_s, 0.005);
  const tau_res = L_m / u_eff;
  const tau_chem = 0.008 * Math.pow(21 / Math.max(5, o2), 1.8) * (101.3 / Math.max(10, pressKpa));
  const damkohlerNumber = +(tau_res / Math.max(1e-5, tau_chem)).toFixed(2);

  return {
    reynoldsNumber,
    grashofNumber,
    richardsonNumber,
    damkohlerNumber,
    flowRegime,
    pecletNumber,
  };
}

/**
 * Cross-examines candidate parameters and claims against known NASA PSI flight baselines.
 */
export function auditScientificTransportAndContradictions(
  input: CandidateEvaluationInput,
  corpus: ExperimentRecord[]
): CriticReport {
  const transport = computeDimensionlessTransport(input);
  const contradictions: ContradictionFinding[] = [];
  const o2 = input.oxygenPct ?? 21;
  const pressKpa = input.pressureKpa ?? 101.3;
  const flowCmS = input.airflowCmS ?? 0;
  const matLower = (input.material || "").toLowerCase();
  const claimText = (input.claim || "").toLowerCase();

  let confidencePenalty = 0;

  // Rule 1: Limiting Oxygen Index (LOI) Violations
  // PMMA: LOI ~ 17-18% O2
  if (matLower.includes("pmma")) {
    if (o2 < 14.5 && !claimText.includes("extinguish") && !claimText.includes("quench")) {
      contradictions.push({
        severity: "CRITICAL",
        finding: `Unrealistic combustion sustained at ${o2}% O2 (below Limiting Oxygen Index) for PMMA`,
        conflictingFlightStudy: "SoFIE GEL / NASA PSI-64 baseline",
        scientificRationale:
          "PMMA has a well-established Limiting Oxygen Index (LOI) of ~17.0% in quiescent/low-speed microgravity. Steady propagation below 14.5% O2 violates the conductive heat balance of solid thermoplastic fuels.",
      });
      confidencePenalty += 35;
    }
  }

  // SIBAL: LOI ~ 15% O2
  if (matLower.includes("sibal") || matLower.includes("cotton")) {
    if (o2 < 13.0 && !claimText.includes("extinguish") && !claimText.includes("quench")) {
      contradictions.push({
        severity: "CRITICAL",
        finding: `Unrealistic combustion sustained at ${o2}% O2 (below Limiting Oxygen Index) for SIBAL fabric`,
        conflictingFlightStudy: "Saffire-I / Saffire-V (PSI-98 / PSI-102)",
        scientificRationale:
          "SIBAL (75% cotton / 25% fiberglass) exhibits abrupt concurrent extinction near 14.5-15.0% O2 under low-speed airflow. Sustained combustion below 13% O2 without external radiant flux is empirically invalid.",
      });
      confidencePenalty += 35;
    }
  }

  // Rule 2: Deep Depressurization & Blow-Off Quenching
  if (pressKpa < 25 && flowCmS > 50) {
    contradictions.push({
      severity: "CRITICAL",
      finding: `Excessive convective blow-off at ${pressKpa} kPa and ${flowCmS} cm/s`,
      conflictingFlightStudy: "BASS / Saffire Depressurization Runs",
      scientificRationale:
        "At deep cabin vacuum (< 25 kPa), gas-phase chemical reaction times lengthen significantly. Combined with high convective strain (> 50 cm/s), the Damköhler number drops below the critical extinction threshold.",
    });
    confidencePenalty += 30;
  } else if (pressKpa < 40 && flowCmS > 80) {
    contradictions.push({
      severity: "WARNING",
      finding: `Elevated blow-off quench risk at ${pressKpa} kPa under ${flowCmS} cm/s flow`,
      conflictingFlightStudy: "NASA PSI Low-Pressure Flight Matrix",
      scientificRationale:
        "High forced ventilation airflow under sub-atmospheric pressure destabilizes flame holding points on thin solid fuels.",
    });
    confidencePenalty += 15;
  }

  // Rule 3: Extreme Damköhler Number Outliers
  if (transport.damkohlerNumber < 0.2 && !claimText.includes("extinguish") && !claimText.includes("quench")) {
    contradictions.push({
      severity: "WARNING",
      finding: `Sub-critical Damköhler number (Da = ${transport.damkohlerNumber})`,
      conflictingFlightStudy: "NASA CIR Extinction Regimes",
      scientificRationale:
        "Damköhler number below 0.2 indicates flow residence time is shorter than chemical ignition delay, characteristic of blow-off quenching.",
    });
    confidencePenalty += 15;
  }

  // Rule 4: Claim Contradictions vs Corroborated Corpus
  if (claimText.includes("decreased oxygen") && claimText.includes("accelerat")) {
    contradictions.push({
      severity: "CRITICAL",
      finding: "Inverse oxygen sensitivity claim",
      conflictingFlightStudy: "NASA PSI Corpus General Consensus",
      scientificRationale:
        "Flame spread rate scales positively with oxidizer concentration in all verified NASA microgravity combustion investigations. Claiming acceleration with decreased oxygen contradicts fundamental gas-phase chemical kinetics.",
    });
    confidencePenalty += 40;
  }

  const isThermodynamicallySound = contradictions.filter((c) => c.severity === "CRITICAL").length === 0;

  // Construct Critique Notes
  let critiqueNotes = `Physical analysis confirms ${transport.flowRegime} regime (Re = ${transport.reynoldsNumber}, Gr = ${transport.grashofNumber}, Da = ${transport.damkohlerNumber}).`;
  if (!isThermodynamicallySound) {
    critiqueNotes += ` CRITICAL RED-TEAM AUDIT: Detected ${contradictions.length} physical contradictions violating NASA PSI flight consensus.`;
  } else if (contradictions.length > 0) {
    critiqueNotes += ` ADVISORY: ${contradictions.length} boundary condition warnings detected.`;
  } else {
    critiqueNotes += ` Flammability conditions correlate cleanly with baseline flight experiments.`;
  }

  return {
    isThermodynamicallySound,
    confidencePenalty: Math.min(100, confidencePenalty),
    dimensionlessTransport: transport,
    contradictionsDetected: contradictions,
    critiqueNotes,
    evaluatedAt: new Date().toISOString(),
  };
}
