import { Representation } from "./visualization";

export type SimulationMode =
  | "observed"          // NASA recording / raw measurements
  | "calibrated_model"  // Bounded physics equation fitted to NASA run
  | "conceptual"        // Educational 2D/3D visualization of physical tendencies
  | "external_demo";    // Embedded MySimulator educational demo

export type ParameterStatus =
  | "measured"          // Directly recorded in NASA flight run
  | "fitted"            // Derived from regression/fitting to NASA data
  | "user_assumption"   // Explored within verified domain
  | "unsupported";      // Not validated by indexed evidence; locked or non-predictive

export interface SimulationControl {
  id: string;
  label: string;
  param: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  currentValue: number;
  status: ParameterStatus;
  validDomain: string;
  effectDescription: string;
  isLocked?: boolean;
}

export interface MeasurementDataPoint {
  t_sec: number;
  d_mm?: number;
  d2_mm2?: number;
  spread_rate_mm_s?: number;
  temperature_c?: number;
  flame_length_mm?: number;
  regime?: "hot_flame" | "transition" | "cool_flame" | "extinguished" | "steady_spread";
  note?: string;
}

export interface ModelCalibration {
  algorithm: string;
  fitted_k_mm2_s?: number;
  initial_d0_mm?: number;
  fit_window_sec: [number, number];
  rmse_d2: number;
  mae_d2: number;
  r2?: number;
  limits: string[];
  notes: string;
}

export interface CaseCitation {
  psiId?: string | null;
  doi?: string | null;
  sourceLocator: string;
  title: string;
  authors?: string;
  year?: number;
  url: string;
}

export interface SimulationCase {
  caseId: string;
  experimentId: string;
  title: string;
  programme: "FLEX" | "Saffire" | "BASS" | "SoFIE" | "SAME" | "SPICE";
  investigation: string;
  mode: SimulationMode;
  geometry: "droplet" | "flat_slab" | "cylinder" | "duct_flow" | "confined_space";
  fuel: string;
  observedConditions: {
    gravity_g: number | string; // e.g. 0 or "microgravity (~10^-6 g)"
    oxygen_pct: number | null;
    pressure_kpa: number | null;
    airflow_cm_s: number | null;
    ambient_temp_c?: number | null;
  };
  measurementSeries: MeasurementDataPoint[];
  calibration?: ModelCalibration;
  userControls: SimulationControl[];
  citation: CaseCitation;
  sourceMedia?: {
    type: "frames" | "image" | "canvas_concept" | "measured_flight_series";
    localPath?: string;
    schematicPath?: string;
    framesPattern?: string;
    frameCount?: number;
    intervalSeconds?: number;
    caption: string;
    nasaCredit: string;
  };
  conclusions: {
    allowed: string[];
    disallowed: string[];
  };
  externalEmbedUrl?: string;
}

export interface D2ModelPoint {
  t_sec: number;
  d2_measured?: number;
  d2_model: number;
  residual?: number;
  regime?: string;
}

export interface SimulationEngineResult {
  timeSeries: D2ModelPoint[];
  burnoutTime_sec: number;
  burnRate_K: number;
  rmse: number | null;
  mae: number | null;
  validDomainMessage?: string;
  isWithinDomain: boolean;
}
