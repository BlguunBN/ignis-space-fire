import { ExperimentRecord, CoverageCell } from "@/types/evidence";

export interface CoverageMatrixResult {
  totalRecords: number;
  verifiedCount: number;
  cells: CoverageCell[];
  summary: {
    coveredBins: number;
    emptyBins: number;
  };
}

interface TargetBin {
  materialClass: string;
  materialLabel: string;
  atmosphereRegime: "Oxygen (20-22% O2)" | "Exploration (26-34% O2)";
  airflowRegime: "Quiescent (0 cm/s)" | "Low Flow (1-5 cm/s)" | "Forced Flow (10-20 cm/s)";
}

const TARGET_BINS: TargetBin[] = [
  {
    materialClass: "solid_polymer",
    materialLabel: "Solid Polymers (PMMA, Acrylic)",
    atmosphereRegime: "Oxygen (20-22% O2)",
    airflowRegime: "Low Flow (1-5 cm/s)",
  },
  {
    materialClass: "solid_polymer",
    materialLabel: "Solid Polymers (PMMA, Acrylic)",
    atmosphereRegime: "Exploration (26-34% O2)",
    airflowRegime: "Forced Flow (10-20 cm/s)",
  },
  {
    materialClass: "solid_fabric",
    materialLabel: "Textiles / SIBAL (Cotton-Fiberglass)",
    atmosphereRegime: "Oxygen (20-22% O2)",
    airflowRegime: "Forced Flow (10-20 cm/s)",
  },
  {
    materialClass: "electrical_insulation",
    materialLabel: "Wire Insulation (PTFE, Kapton)",
    atmosphereRegime: "Oxygen (20-22% O2)",
    airflowRegime: "Low Flow (1-5 cm/s)",
  },
  {
    materialClass: "liquid_hydrocarbon",
    materialLabel: "Liquid Hydrocarbons (Droplets)",
    atmosphereRegime: "Oxygen (20-22% O2)",
    airflowRegime: "Quiescent (0 cm/s)",
  },
  {
    materialClass: "gas_fuel",
    materialLabel: "Gaseous Fuels (Methane, Ethylene)",
    atmosphereRegime: "Oxygen (20-22% O2)",
    airflowRegime: "Forced Flow (10-20 cm/s)",
  },
  {
    materialClass: "advanced_composites",
    materialLabel: "Carbon Fiber / Advanced Composites",
    atmosphereRegime: "Exploration (26-34% O2)",
    airflowRegime: "Low Flow (1-5 cm/s)",
  },
  {
    materialClass: "3d_printed_polymers",
    materialLabel: "3D Printed Flight Polymers (PEEK/ULTEM)",
    atmosphereRegime: "Exploration (26-34% O2)",
    airflowRegime: "Forced Flow (10-20 cm/s)",
  },
];

/**
 * Computes empirical evidence coverage dynamically from indexed NASA records.
 * SCIENTIFIC INTEGRITY RULE: Zero records means "No indexed evidence in current corpus",
 * NOT "NASA has never investigated this".
 */
export function computeEvidenceCoverage(experiments: ExperimentRecord[]): CoverageMatrixResult {
  const verifiedRecords = experiments.filter((e) => e.verification_status === "verified");

  const cells: CoverageCell[] = TARGET_BINS.map((bin) => {
    const matching = verifiedRecords.filter((exp) => {
      // Material class match
      const matMatch =
        exp.material_class.toLowerCase().includes(bin.materialClass) ||
        exp.material.toLowerCase().includes(bin.materialClass.replace("_", " "));

      if (!matMatch) return false;

      // Atmosphere match
      if (exp.oxygen_pct == null) return false;
      const isStandardAtm = exp.oxygen_pct >= 20.0 && exp.oxygen_pct <= 22.0;
      const isExplorationAtm = exp.oxygen_pct >= 26.0 && exp.oxygen_pct <= 34.0;
      const matchesAtm =
        (bin.atmosphereRegime.includes("20-22%") && isStandardAtm) ||
        (bin.atmosphereRegime.includes("26-34%") && isExplorationAtm);

      if (!matchesAtm) return false;

      // Airflow match
      if (exp.airflow_cm_s == null) return false;
      const isQuiescent = exp.airflow_cm_s === 0;
      const isLowFlow = exp.airflow_cm_s >= 1.0 && exp.airflow_cm_s <= 5.0;
      const isForcedFlow = exp.airflow_cm_s >= 10.0 && exp.airflow_cm_s <= 20.0;

      const matchesFlow =
        (bin.airflowRegime.includes("Quiescent") && isQuiescent) ||
        (bin.airflowRegime.includes("Low Flow") && isLowFlow) ||
        (bin.airflowRegime.includes("Forced Flow") && isForcedFlow);

      return matchesFlow;
    });

    const count = matching.length;
    let status: CoverageCell["status"] = "NO_INDEXED_EVIDENCE";
    let notes = "No verified records in current indexed corpus (does not imply NASA never tested this condition).";

    if (count >= 2) {
      status = "LIMITED";
      notes = `${count} indexed records; independent investigations have not been established.`;
    } else if (count === 1) {
      status = "LIMITED";
      notes = `Single verified investigation (${matching[0].investigation}).`;
    }

    return {
      materialClass: bin.materialLabel,
      atmosphereRegime: bin.atmosphereRegime,
      airflowRegime: bin.airflowRegime,
      count,
      status,
      matchingIds: matching.map((m) => m.id),
      notes,
    };
  });

  const coveredBins = cells.filter((c) => c.count > 0).length;
  const emptyBins = cells.filter((c) => c.count === 0).length;

  return {
    totalRecords: experiments.length,
    verifiedCount: verifiedRecords.length,
    cells,
    summary: {
      coveredBins,
      emptyBins,
    },
  };
}
