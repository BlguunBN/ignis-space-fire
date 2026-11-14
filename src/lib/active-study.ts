export function resolveActiveStudy(
  view: "dashboard" | "explorer" | "split",
  inspectingEvidence: boolean,
  activeId: string | null,
  filteredIds: string[],
): string | null {
  if (view !== "split" || inspectingEvidence) return activeId;
  return activeId && filteredIds.includes(activeId) ? activeId : filteredIds[0] ?? null;
}
