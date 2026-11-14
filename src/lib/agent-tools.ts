import { ExperimentRecord } from "../types/evidence";

export interface BuildHypothesisTreeArgs {
  question: {
    title: string;
    details: string;
  };
  evidenceClaims: string[];
  hypothesis: {
    title: string;
    prediction: string;
    rationale: string;
  };
  counterHypothesis?: {
    title: string;
    prediction: string;
    rationale: string;
  };
  validationExperiment: {
    facility: string;
    objective: string;
    airflow: string;
    oxygen: string;
    pressure: string;
    geometry: string;
  };
}

export interface RunCombustionSimulationArgs {
  gravity: "µg" | "0.16g" | "0.38g" | "1g";
  fuel: "Methanol" | "Heptane" | "n-Decane";
  oxygenPct: number;
  pressureAtm: number;
  diluent: "Nitrogen" | "+ CO2" | "+ Helium";
  forcedAirflowSpeed: number;
  description: string;
}

export interface InspectOpticalDiagnosticsArgs {
  plateId: "rtdfs" | "sofie" | "saffire" | "flex";
  filterMode: "raw" | "chemiluminescence" | "edges" | "pyrometry";
  rationale: string;
}

export interface OpenPrimaryEvidenceArgs {
  claimId: string;
  recordId: string;
  highlightQuote?: boolean;
}

export interface FilterResearchExplorerArgs {
  materialClasses?: string[];
  gravityRegimes?: string[];
  oxygenRange?: [number, number];
  pressureRange?: [number, number];
  searchQuery?: string;
}

export type AgentToolName =
  | "build_hypothesis_tree"
  | "run_combustion_simulation"
  | "inspect_optical_diagnostics"
  | "open_primary_evidence"
  | "filter_research_explorer";

export interface AgentToolCall {
  id: string;
  name: AgentToolName;
  args: any;
  status: "dispatched" | "executed" | "pending";
}

/**
 * OpenAI-Compatible Tool Specifications for NVIDIA Nemotron-3.5
 */
export const NEMOTRON_AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "build_hypothesis_tree",
      description: "Synthesizes and updates a 4-tier causal mind tree (Question -> Grounded Flight Evidence -> Physical Hypothesis -> Validation Experiment) on the Stage 3 Whiteboard Modeler canvas.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "object",
            properties: {
              title: { type: "string", description: "Concise scientific question headline" },
              details: { type: "string", description: "Detailed research inquiry with boundary parameters" },
            },
            required: ["title", "details"],
          },
          evidenceClaims: {
            type: "array",
            items: { type: "string" },
            description: "Array of verified NASA PSI Claim IDs (e.g. ['CLM-SAFFIRE-004', 'CLM-REG-008'])",
          },
          hypothesis: {
            type: "object",
            properties: {
              title: { type: "string", description: "Physical mechanism title (e.g. Thermal Gas Capacitance Balance)" },
              prediction: { type: "string", description: "Quantitative testable prediction" },
              rationale: { type: "string", description: "Thermodynamic and fluid mechanical rationale" },
            },
            required: ["title", "prediction", "rationale"],
          },
          counterHypothesis: {
            type: "object",
            properties: {
              title: { type: "string" },
              prediction: { type: "string" },
              rationale: { type: "string" },
            },
          },
          validationExperiment: {
            type: "object",
            properties: {
              facility: { type: "string", description: "Target facility (e.g. ISS CIR, Cygnus Duct, Glenn Drop Tower)" },
              objective: { type: "string", description: "Experimental validation goal" },
              airflow: { type: "string", description: "Convective flow velocity range (cm/s)" },
              oxygen: { type: "string", description: "Oxygen mole fraction range (%)" },
              pressure: { type: "string", description: "Chamber pressure (kPa)" },
              geometry: { type: "string", description: "Fuel sample dimensions and configuration" },
            },
            required: ["facility", "objective", "airflow", "oxygen", "pressure", "geometry"],
          },
        },
        required: ["question", "evidenceClaims", "hypothesis", "validationExperiment"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_combustion_simulation",
      description: "Configures and executes the physical microgravity combustion simulator (Godsave-Spalding d² law, spherical/buoyant flame deformation, chemiluminescence).",
      parameters: {
        type: "object",
        properties: {
          gravity: { type: "string", enum: ["µg", "0.16g", "0.38g", "1g"] },
          fuel: { type: "string", enum: ["Methanol", "Heptane", "n-Decane"] },
          oxygenPct: { type: "number", minimum: 10, maximum: 40 },
          pressureAtm: { type: "number", minimum: 0.25, maximum: 2.0 },
          diluent: { type: "string", enum: ["Nitrogen", "+ CO2", "+ Helium"] },
          forcedAirflowSpeed: { type: "number", minimum: 0, maximum: 30 },
          description: { type: "string", description: "Physical objective of this simulation run" },
        },
        required: ["gravity", "fuel", "oxygenPct", "pressureAtm", "diluent", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inspect_optical_diagnostics",
      description: "Opens authentic NASA flight photography plates (RTDFS, SoFIE, Saffire, FLEX) with calibrated computer vision filters (two-color pyrometry, Canny contours, chemiluminescence).",
      parameters: {
        type: "object",
        properties: {
          plateId: { type: "string", enum: ["rtdfs", "sofie", "saffire", "flex"] },
          filterMode: { type: "string", enum: ["raw", "chemiluminescence", "edges", "pyrometry"] },
          rationale: { type: "string", description: "Diagnostic objective for selecting this optical plate" },
        },
        required: ["plateId", "filterMode", "rationale"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_primary_evidence",
      description: "Navigates directly to the Stage 2 Primary PDF Evidence Viewer centered on the verified passage quote and claim locator coordinates.",
      parameters: {
        type: "object",
        properties: {
          claimId: { type: "string", description: "Verified Claim ID (e.g. CLM-REG-008, CLM-SAFFIRE-001)" },
          recordId: { type: "string", description: "Internal PSI record ID" },
          highlightQuote: { type: "boolean" },
        },
        required: ["claimId", "recordId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_research_explorer",
      description: "Dynamically filters the 50-study NASA investigation table and cards by gravity regime, material class, oxygen range, or search keyword.",
      parameters: {
        type: "object",
        properties: {
          materialClasses: { type: "array", items: { type: "string" } },
          gravityRegimes: { type: "array", items: { type: "string" } },
          oxygenRange: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
          pressureRange: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
          searchQuery: { type: "string" },
        },
      },
    },
  },
];

/**
 * Deterministic Fallback Agent Orchestrator:
 * Generates structured tool calls for offline use or when Nemotron falls back.
 */
export function determineAgentToolsFromQuery(
  queryText: string,
  corpus: ExperimentRecord[]
): AgentToolCall[] {
  const p = queryText.toLowerCase();
  const calls: AgentToolCall[] = [];

  // 1. Modeler / Hypothesis intent
  const isModeler = /(formulate|build|synthesize|model|tree|hypothesis|experiment proposal|whiteboard|investigate flammability|cool flame|airflow divergence|limits|lunar)/i.test(p);
  if (isModeler) {
    let questionTitle = "Microgravity Flame Spread & Extinction Investigation";
    let questionDetails = `What mechanisms govern flame spread and extinction limits under queried conditions: "${queryText.slice(0, 70)}"?`;
    let hypTitle = "Thermal Gas Capacitance & Convective Transport Balance";
    let hypPred = "Extinction boundaries diverge significantly from 1g terrestrial references due to buoyant suppression.";
    let hypRat = "Suppression of natural convection eliminates buoyant cooling, shifting boundary layer thickness to molecular diffusion.";
    let facility = "ISS CIR / Saffire Flow Duct";
    let flow = "10 cm/s";
    let o2 = "21% – 26% O₂";
    let press = "56 – 101.3 kPa";
    let geom = "PMMA slab / SIBAL fabric";
    let claims = ["CLM-SAFFIRE-001", "CLM-BASS-002"];

    if (p.includes("lunar") || p.includes("0.16") || p.includes("56") || p.includes("artemis")) {
      questionTitle = "Artemis Exploration Flammability: PMMA & SIBAL (26% O₂ / 56 kPa at 0.16g)";
      questionDetails = "Why do reduced atmospheric pressure (56 kPa) and elevated oxygen (26% O₂) accelerate flame propagation in 0.16g Lunar gravity?";
      hypTitle = "Thermal Gas Capacitance (ρCp) Suppression & Radiative Balance";
      hypPred = "Lower total pressure reduces gas thermal capacity, elevating flame temperatures by ~180 K while 0.16g eliminates buoyant convective heat loss.";
      hypRat = "Buoyant suppression at 0.16g eliminates natural convective cooling while low-velocity ventilation maintains steady pyrolyzate flux.";
      facility = "ISS CIR / Saffire Flow Duct";
      flow = "5 – 25 cm/s forced convective flow";
      o2 = "26% – 34% O₂ Exploration Range";
      press = "56 kPa (0.56 atm baseline)";
      geom = "0.2m x 0.5m PMMA slab & SIBAL fabric coupon";
      claims = ["CLM-SAFFIRE-004", "CLM-REG-008"];
    } else if (p.includes("droplet") || p.includes("cool") || p.includes("flex")) {
      questionTitle = "Liquid Droplet Extinction & Low-Temperature Cool Flames (FLEX)";
      questionDetails = "Under what conditions do isolated hydrocarbon droplets sustain low-temperature cool flame burning (<800 K) after visible flame extinction?";
      hypTitle = "Peroxy Radical Low-Temperature Kinetic Diffusion Equilibrium";
      hypPred = "Cool-flame duration is governed non-linearly by initial droplet diameter due to spherical radical accumulation and absence of buoyant convective drift.";
      hypRat = "Quiescent spherical symmetry confines intermediate peroxy and hydroperoxy radicals in high local concentrations without buoyant convective dispersion.";
      facility = "ISS CIR MDCA Chamber";
      flow = "0 cm/s (pure quiescent diffusion)";
      o2 = "15% – 21% O₂";
      press = "101.3 kPa (1.0 atm)";
      geom = "2.0 – 5.0 mm heptane / decane droplets";
      claims = ["CLM-FLEX-001", "CLM-PSI-002"];
    } else if (p.includes("ventilation") || p.includes("saffire") || p.includes("scale")) {
      questionTitle = "Forced Convective Flow & Flame Spread Scale Invariant (Saffire vs BASS)";
      questionDetails = "Why do large-scale fuel slabs (Saffire 0.4m x 1.0m) sustain continuous flame spread at 20 cm/s airflow where glovebox specimens (BASS 1-2 cm) extinguish?";
      hypTitle = "Cumulative Downstream Radiative Preheating Scale Invariant";
      hypPred = "Large fuel specimens absorb upstream flame radiative flux that sustains pyrolysis at higher convective velocities.";
      hypRat = "Downstream surface view factor captures emitted radiation that is lost to enclosure walls in small-scale glovebox hardware.";
      facility = "ISS CIR Duct Apparatus";
      flow = "10 – 25 cm/s controlled flow";
      o2 = "21% – 26% O₂";
      press = "56 – 101.3 kPa";
      geom = "0.2m x 0.5m slab instrumented with radiometer array";
      claims = ["CLM-SAFFIRE-001", "CLM-BASS-002"];
    }

    calls.push({
      id: `call-tree-${Date.now()}`,
      name: "build_hypothesis_tree",
      status: "dispatched",
      args: {
        question: { title: questionTitle, details: questionDetails },
        evidenceClaims: claims,
        hypothesis: { title: hypTitle, prediction: hypPred, rationale: hypRat },
        validationExperiment: { facility, objective: "Flight Validation Experiment", airflow: flow, oxygen: o2, pressure: press, geometry: geom },
      },
    });
  }

  // 2. Combustion Simulation intent
  const isSim = /(simulat|droplet|d2 law|burn rate|flame plume|quiescent|buoyancy)/i.test(p);
  if (isSim) {
    const isLunar = p.includes("lunar") || p.includes("0.16");
    const isMartian = p.includes("martian") || p.includes("0.38");
    const is1g = p.includes("1g") || p.includes("earth") || p.includes("terrestrial");
    const gravity = isLunar ? "0.16g" : isMartian ? "0.38g" : is1g ? "1g" : "µg";
    const fuel = p.includes("heptane") ? "Heptane" : p.includes("decane") ? "n-Decane" : "Methanol";
    const o2 = p.includes("30") ? 30 : p.includes("26") ? 26 : p.includes("34") ? 34 : 21;
    const press = isLunar ? 0.69 : p.includes("56") ? 0.56 : 1.0;
    const diluent = p.includes("co2") ? "+ CO2" : p.includes("helium") ? "+ Helium" : "Nitrogen";

    calls.push({
      id: `call-sim-${Date.now()}`,
      name: "run_combustion_simulation",
      status: "dispatched",
      args: {
        gravity,
        fuel,
        oxygenPct: o2,
        pressureAtm: press,
        diluent,
        forcedAirflowSpeed: 15,
        description: `Microgravity droplet combustion test for ${fuel} in ${gravity} (${o2}% O2 / ${press} atm)`,
      },
    });
  }

  // 3. Optical Diagnostics intent
  const isDiag = /(optical|diagnostic|spectr|cv filter|plate|camera|canny|pyrometry)/i.test(p);
  if (isDiag) {
    const plateId = p.includes("sofie") || p.includes("pmma") ? "sofie" : p.includes("saffire") ? "saffire" : p.includes("flex") ? "flex" : "rtdfs";
    const filterMode = p.includes("pyrometry") ? "pyrometry" : p.includes("edge") || p.includes("canny") ? "edges" : p.includes("chemiluminescence") ? "chemiluminescence" : "pyrometry";

    calls.push({
      id: `call-diag-${Date.now()}`,
      name: "inspect_optical_diagnostics",
      status: "dispatched",
      args: {
        plateId,
        filterMode,
        rationale: `Spectroscopic and edge contour analysis for ${plateId.toUpperCase()} plate in ${filterMode} filter mode`,
      },
    });
  }

  // 4. Primary Evidence Citation intent
  const claimMatch = p.match(/clm-[a-z0-9-]+/i);
  if (claimMatch) {
    const targetClaim = claimMatch[0].toUpperCase();
    const found = corpus.find(
      (r) => r.claim_locator_details?.claimId?.toUpperCase() === targetClaim || `CLM-${r.id.toUpperCase()}` === targetClaim
    );
    if (found) {
      calls.push({
        id: `call-ev-${Date.now()}`,
        name: "open_primary_evidence",
        status: "dispatched",
        args: {
          claimId: targetClaim,
          recordId: found.id,
          highlightQuote: true,
        },
      });
    }
  }

  // 5. Research Explorer Filtering intent
  const isFilter = /(filter|explorer|search|show records|find studies|grid|query)/i.test(p);
  if (isFilter) {
    const gravityRegimes = p.includes("lunar") || p.includes("0.16")
      ? ["Lunar 0.16 g"]
      : p.includes("martian") || p.includes("0.38")
      ? ["Martian 0.38 g"]
      : p.includes("micro")
      ? ["Microgravity"]
      : undefined;

    const materialClasses = p.includes("pmma")
      ? ["thick_solid"]
      : p.includes("sibal") || p.includes("fabric")
      ? ["thin_solid"]
      : p.includes("droplet") || p.includes("heptane")
      ? ["liquid_fuel"]
      : undefined;

    calls.push({
      id: `call-filter-${Date.now()}`,
      name: "filter_research_explorer",
      status: "dispatched",
      args: {
        gravityRegimes,
        materialClasses,
        searchQuery: p.replace(/(filter|explorer|show records|find studies)/gi, "").trim(),
      },
    });
  }

  return calls;
}
