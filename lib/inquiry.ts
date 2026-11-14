import type { SearchQuery } from "@/types/evidence";

export function createInquiryKey(query: SearchQuery, evidenceIds: string[], corpusVersion: string): string {
  return JSON.stringify({
    material: query.material?.trim() || "", oxygenPct: query.oxygenPct ?? null,
    pressureKpa: query.pressureKpa ?? null, airflowCmS: query.airflowCmS ?? null,
    phenomenon: query.phenomenon?.trim() || "", programme: query.programme?.trim() || "",
    missionContext: query.missionContext?.trim() || "", freeText: query.freeText?.trim() || "",
    evidenceIds: [...evidenceIds].sort(), corpusVersion,
  });
}
