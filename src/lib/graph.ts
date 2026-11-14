import { ExperimentRecord } from "../types/evidence";

export type NodeType = "investigation" | "material" | "regime" | "platform";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  val: number;
  color: string;
  details?: string;
  meta?: {
    recordId?: string;
    oxygen?: number | null;
    airflow?: number | null;
    pressure?: number | null;
    platform?: string;
    material?: string;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  color?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Classifies an experimental record into an authentic aerospace combustion regime.
 */
function classifyRegime(record: ExperimentRecord): string {
  const flow = record.airflow_cm_s ?? 0;
  const o2 = record.oxygen_pct ?? 21;
  const p = record.pressure_kpa ?? 101.3;

  if (o2 > 24 || p < 80) {
    return "regime-exploration";
  }
  if (flow === 0) {
    return "regime-quiescent";
  }
  if (flow <= 5) {
    return "regime-low-flow";
  }
  return "regime-forced-flow";
}

const REGIME_CONFIG: Record<string, { label: string; details: string }> = {
  "regime-exploration": {
    label: "Exploration Atmospheres (High O₂ / Low P)",
    details: "NASA Artemis/Gateway environments (26%-34% O₂, 56-57 kPa).",
  },
  "regime-quiescent": {
    label: "Quiescent Microgravity (0 cm/s Flow)",
    details: "Zero forced airflow; purely diffusive droplet and cool flame combustion.",
  },
  "regime-low-flow": {
    label: "Low-Speed Ventilation (1 – 5 cm/s)",
    details: "Sub-buoyant convective flow typical of spacecraft cabin ventilation corners.",
  },
  "regime-forced-flow": {
    label: "Forced Ventilation (> 5 cm/s)",
    details: "Moderate to high airflow (10 – 20 cm/s) driving concurrent/opposed flame spread.",
  },
};

/**
 * Builds an interactive Obsidian-style knowledge graph from the verified NASA PSI corpus.
 */
export function buildKnowledgeGraph(corpus: ExperimentRecord[]): KnowledgeGraphData {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // Register regime nodes
  Object.entries(REGIME_CONFIG).forEach(([id, config]) => {
    nodesMap.set(id, {
      id,
      label: config.label,
      type: "regime",
      val: 20,
      color: "#f43f5e",
      details: config.details,
    });
  });

  for (const record of corpus) {
    const invNodeId = `inv-${record.id}`;

    // 1. Investigation Node
    nodesMap.set(invNodeId, {
      id: invNodeId,
      label: record.investigation,
      type: "investigation",
      val: 16,
      color: "#38bdf8",
      details: `${record.platform} • ${record.finding}`,
      meta: {
        recordId: record.id,
        oxygen: record.oxygen_pct,
        airflow: record.airflow_cm_s,
        pressure: record.pressure_kpa,
        platform: record.platform,
        material: record.material,
      },
    });

    // 2. Material Node
    const matId = `mat-${record.material.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    if (!nodesMap.has(matId)) {
      nodesMap.set(matId, {
        id: matId,
        label: record.material,
        type: "material",
        val: 14,
        color: "#10b981",
        details: `Material class: ${record.material_class}`,
      });
    }

    // Link: Investigation -> Material
    links.push({
      source: invNodeId,
      target: matId,
      label: "burns_material",
      color: "rgba(16, 185, 129, 0.4)",
    });

    // 3. Platform Node
    const platId = `plat-${record.platform.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    if (!nodesMap.has(platId)) {
      nodesMap.set(platId, {
        id: platId,
        label: record.platform,
        type: "platform",
        val: 12,
        color: "#c084fc",
        details: `Flight Facility / Vehicle`,
      });
    }

    // Link: Investigation -> Platform
    links.push({
      source: invNodeId,
      target: platId,
      label: "conducted_aboard",
      color: "rgba(192, 132, 252, 0.4)",
    });

    // 4. Link: Investigation -> Classified Regime
    const regId = classifyRegime(record);
    links.push({
      source: invNodeId,
      target: regId,
      label: "operates_in_regime",
      color: "rgba(244, 63, 94, 0.4)",
    });
  }

  // Cross-link investigations that share common fuel components (PMMA, SIBAL, etc.)
  const fuelKeywords = ["pmma", "sibal", "methane", "cellulose", "ethylene", "nomex"];
  const seenPairs = new Set<string>();

  fuelKeywords.forEach((kw) => {
    const matching = corpus
      .filter((r) => r.material.toLowerCase().includes(kw))
      .map((r) => `inv-${r.id}`);

    if (matching.length > 1) {
      for (let i = 0; i < matching.length; i++) {
        for (let j = i + 1; j < matching.length; j++) {
          const pairKey = `${matching[i]}<->${matching[j]}`;
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            links.push({
              source: matching[i],
              target: matching[j],
              label: "shares_fuel_composition",
              color: "rgba(245, 158, 11, 0.35)",
            });
          }
        }
      }
    }
  });

  return {
    nodes: Array.from(nodesMap.values()),
    links,
  };
}
