export interface MeasurementDataPoint {
  t_sec: number;
  d2_mm2: number | null | undefined;
  regime?: string;
}

export interface D2ModelPoint {
  t_sec: number;
  d2_measured: number | undefined;
  d2_model: number;
  residual: number | undefined;
  regime?: string;
}

export interface ModelCalibration {
  initial_d0_mm?: number;
  fitted_k_mm2_s?: number;
}

export interface SimulationEngineResult {
  timeSeries: D2ModelPoint[];
  burnoutTime_sec: number;
  burnRate_K: number;
  rmse: number | null;
  mae: number | null;
  validDomainMessage: string;
  isWithinDomain: boolean;
}
