import { ExperimentRecord } from "../types/evidence";

export type PressureFilter = "any" | "low" | "standard" | "high";

export function matchesReportedConditions(
  record: Pick<ExperimentRecord, "oxygen_pct" | "pressure_kpa">,
  oxygenRange: [number, number],
  pressure: PressureFilter,
): boolean {
  const oxygenFiltered = oxygenRange[0] !== 0 || oxygenRange[1] !== 40;
  if (oxygenFiltered && (record.oxygen_pct == null || record.oxygen_pct < oxygenRange[0] || record.oxygen_pct > oxygenRange[1])) return false;
  if (pressure === "any") return true;
  if (record.pressure_kpa == null) return false;
  if (pressure === "low") return record.pressure_kpa < 76;
  if (pressure === "standard") return record.pressure_kpa >= 76 && record.pressure_kpa <= 105;
  return record.pressure_kpa > 105;
}
