import { ExperimentRecord } from "../types/evidence";

export interface ConfounderExplanation {
  type: "SCALE_DISPARITY" | "FLOW_REGIME" | "PRESSURE_VARIANCE" | "GEOMETRY_DIFFERENCE" | "FUEL_CHEMISTRY";
  title: string;
  description: string;
  severity: "critical" | "moderate" | "informational";
}

export interface MultiStudyComparison {
  records: ExperimentRecord[];
  sharedConditions: string[];
  divergentConditions: string[];
  confounders: ConfounderExplanation[];
  canQuantitativelyAggregate: boolean;
  aggregationWarning: string;
  qualitativeSummary: string;
}

export function compareInvestigations(records: ExperimentRecord[]): MultiStudyComparison {
  if (records.length < 2) {
    return {
      records,
      sharedConditions: [],
      divergentConditions: [],
      confounders: [],
      canQuantitativelyAggregate: false,
      aggregationWarning: "At least two investigations are required to perform comparative analysis.",
      qualitativeSummary: "Single record selected. Select another investigation to evaluate condition comparability.",
    };
  }

  const sharedConditions: string[] = [];
  const divergentConditions: string[] = [];
  const confounders: ConfounderExplanation[] = [];

  // 1. Oxygen comparison
  const o2Values = Array.from(new Set(records.map((r) => r.oxygen_pct).filter((v) => v != null)));
  if (o2Values.length === 1) {
    sharedConditions.push(`Identical Oxygen Concentration: ${o2Values[0]}% O₂`);
  } else if (o2Values.length > 1) {
    divergentConditions.push(`Divergent Oxygen: ${o2Values.join("% vs ")}% O₂`);
  }

  // 2. Pressure comparison
  const pValues = Array.from(new Set(records.map((r) => r.pressure_kpa).filter((v) => v != null)));
  if (pValues.length === 1) {
    sharedConditions.push(`Identical Ambient Pressure: ${pValues[0]} kPa`);
  } else if (pValues.length > 1) {
    divergentConditions.push(`Divergent Pressure: ${pValues.join(" kPa vs ")} kPa`);
    confounders.push({
      type: "PRESSURE_VARIANCE",
      title: "Atmospheric Pressure Disparity",
      description: `Pressure differs across studies (${pValues.join(" vs ")} kPa). Sub-atmospheric exploration atmospheres alter gas phase chemical kinetics and buoyant/diffusive timescales.`,
      severity: "critical",
    });
  }

  // 3. Flow velocity comparison
  const flowValues = Array.from(new Set(records.map((r) => r.airflow_cm_s).filter((v) => v != null)));
  if (flowValues.length === 1) {
    sharedConditions.push(`Identical Forced Flow: ${flowValues[0]} cm/s`);
  } else if (flowValues.length > 1) {
    const minFlow = Math.min(...(flowValues as number[]));
    const maxFlow = Math.max(...(flowValues as number[]));
    divergentConditions.push(`Divergent Flow Speed: ${minFlow} cm/s to ${maxFlow} cm/s`);

    if (maxFlow - minFlow > 5) {
      confounders.push({
        type: "FLOW_REGIME",
        title: "Disparate Flow Regimes",
        description: `Forced airflow varies from ${minFlow} cm/s to ${maxFlow} cm/s. In microgravity, convective oxidizer transport vs. radiative heat loss shifts non-linearly across low-speed (1-5 cm/s) and high-speed (>15 cm/s) flow regimes.`,
        severity: "critical",
      });
    }
  }

  // 4. Scale disparity check (e.g. Saffire vs BASS)
  const hasSaffire = records.some((r) => r.programme.toLowerCase().includes("saffire"));
  const hasSmallScale = records.some(
    (r) =>
      r.programme.toLowerCase().includes("bass") ||
      r.platform.toLowerCase().includes("msg") ||
      r.platform.toLowerCase().includes("cir")
  );

  if (hasSaffire && hasSmallScale) {
    confounders.push({
      type: "SCALE_DISPARITY",
      title: "Apparatus Scale Disparity (Large Flight Tunnel vs Small Glovebox)",
      description:
        "Saffire experiments utilize large-scale flight tunnels (sample area 0.4 m x 1.0 m inside Cygnus), whereas BASS and CIR utilize sub-scale glovebox hardware (2 cm x 10 cm samples). Flame growth, thermal feedback, and boundary layer development cannot be quantitatively combined.",
      severity: "critical",
    });
  }

  // 5. Fuel geometry check
  const geometries = Array.from(new Set(records.map((r) => r.material_class)));
  if (geometries.length > 1) {
    confounders.push({
      type: "GEOMETRY_DIFFERENCE",
      title: "Fuel Phase & Geometry Disparity",
      description: `Studies evaluate incompatible fuel configurations: ${geometries.join(
        " vs. "
      )}. Heat conduction into droplets, thin fabrics, and thick solid polymers follows fundamentally different governing equations.`,
      severity: "critical",
    });
  }

  const canQuantitativelyAggregate = false; // INVARIANT: NASA flame spread rates must never be averaged across disparate studies.
  const aggregationWarning =
    "SCIENTIFIC INVARIANT: Direct numerical aggregation, averaging, or interpolation across these investigations is invalid. Differences in flow velocity, duct scale, and sample geometry preclude treating them as repeated runs of a single experiment.";

  const qualitativeSummary = `Comparison across ${records.length} investigations (${records
    .map((r) => r.investigation)
    .join(" AND ")}) reveals important phenomenological insights into ventilation-dependent combustion, but also highlights critical physical confounders that require separate analysis.`;

  return {
    records,
    sharedConditions,
    divergentConditions,
    confounders,
    canQuantitativelyAggregate,
    aggregationWarning,
    qualitativeSummary,
  };
}
