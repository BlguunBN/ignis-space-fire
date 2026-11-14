import {
  MeasurementDataPoint,
  D2ModelPoint,
  SimulationEngineResult,
  ModelCalibration,
} from "@/types/simulation";

/**
 * Calculates D^2(t) according to the classical d^2 law:
 * D(t)^2 = max(D0^2 - K * t, 0)
 *
 * @param d0_mm Initial droplet diameter in millimeters
 * @param k_mm2_s Burning rate constant in mm^2/s
 * @param t_sec Time in seconds
 * @returns Squared diameter in mm^2 (always >= 0)
 */
export function calculateD2(d0_mm: number, k_mm2_s: number, t_sec: number): number {
  if (d0_mm <= 0) return 0;
  if (t_sec <= 0) return d0_mm * d0_mm;
  if (k_mm2_s <= 0) return d0_mm * d0_mm;

  const d0_sq = d0_mm * d0_mm;
  const d2 = d0_sq - k_mm2_s * t_sec;
  return Math.max(0, d2);
}

/**
 * Calculates burnout time in seconds:
 * t_burn = D0^2 / K (for K > 0)
 */
export function calculateBurnoutTime(d0_mm: number, k_mm2_s: number): number {
  if (k_mm2_s <= 0 || d0_mm <= 0) return Infinity;
  return (d0_mm * d0_mm) / k_mm2_s;
}

/**
 * Computes Root Mean Square Error (RMSE) between measured and model D^2 values
 * exclusively for time points where measured data exists.
 */
export function calculateRMSE(measured: MeasurementDataPoint[], d0_mm: number, k_mm2_s: number): number | null {
  const validPoints = measured.filter(
    (p) => p.d2_mm2 !== undefined && p.d2_mm2 !== null && !isNaN(p.d2_mm2)
  );

  if (validPoints.length === 0) return null;

  let sumSquaredError = 0;
  for (const point of validPoints) {
    const modelD2 = calculateD2(d0_mm, k_mm2_s, point.t_sec);
    const err = (point.d2_mm2 as number) - modelD2;
    sumSquaredError += err * err;
  }

  return Math.sqrt(sumSquaredError / validPoints.length);
}

/**
 * Computes Mean Absolute Error (MAE) between measured and model D^2 values
 * exclusively for time points where measured data exists.
 */
export function calculateMAE(measured: MeasurementDataPoint[], d0_mm: number, k_mm2_s: number): number | null {
  const validPoints = measured.filter(
    (p) => p.d2_mm2 !== undefined && p.d2_mm2 !== null && !isNaN(p.d2_mm2)
  );

  if (validPoints.length === 0) return null;

  let sumAbsError = 0;
  for (const point of validPoints) {
    const modelD2 = calculateD2(d0_mm, k_mm2_s, point.t_sec);
    sumAbsError += Math.abs((point.d2_mm2 as number) - modelD2);
  }

  return sumAbsError / validPoints.length;
}

/**
 * Generates an evaluation curve comparing real measured NASA data points
 * against the calibrated or adjusted d^2 model.
 */
export function evaluateD2Simulation(
  measuredSeries: MeasurementDataPoint[],
  d0_mm: number,
  k_mm2_s: number,
  calibration?: ModelCalibration
): SimulationEngineResult {
  const burnoutTime = calculateBurnoutTime(d0_mm, k_mm2_s);

  // Determine time span for plotting
  const maxMeasuredTime = measuredSeries.length > 0
    ? Math.max(...measuredSeries.map((p) => p.t_sec))
    : 10;
  
  const plotEndTime = Math.min(
    Math.max(maxMeasuredTime, isFinite(burnoutTime) ? burnoutTime : 10) * 1.05,
    30
  );

  // Domain checks based on calibrated limits
  let isWithinDomain = true;
  let validDomainMessage = "Parameters are within verified experimental calibration window.";

  if (calibration) {
    const defaultD0 = calibration.initial_d0_mm ?? 3.0;
    const defaultK = calibration.fitted_k_mm2_s ?? 0.76;

    // Allowed tolerance: +/- 30% of calibrated baseline
    if (d0_mm < defaultD0 * 0.7 || d0_mm > defaultD0 * 1.5) {
      isWithinDomain = false;
      validDomainMessage = `Warning: Initial diameter ${d0_mm.toFixed(2)} mm deviates from NASA flight tested range (${(defaultD0 * 0.7).toFixed(1)} - ${(defaultD0 * 1.5).toFixed(1)} mm).`;
    } else if (k_mm2_s < defaultK * 0.6 || k_mm2_s > defaultK * 1.5) {
      isWithinDomain = false;
      validDomainMessage = `Warning: Burning rate K=${k_mm2_s.toFixed(2)} mm²/s deviates from fitted quasi-steady value (${defaultK.toFixed(2)} mm²/s).`;
    }
  }

  // Combine measured timestamps and regular interpolated timestamps for smooth chart
  const timeSet = new Set<number>();
  for (const p of measuredSeries) {
    timeSet.add(Math.round(p.t_sec * 100) / 100);
  }

  // Add 40 interpolation steps
  const steps = 40;
  const dt = plotEndTime / steps;
  for (let i = 0; i <= steps; i++) {
    timeSet.add(Math.round(i * dt * 100) / 100);
  }

  const sortedTimes = Array.from(timeSet).sort((a, b) => a - b);

  // Map of measured points for quick lookup
  const measuredMap = new Map<number, MeasurementDataPoint>();
  for (const p of measuredSeries) {
    measuredMap.set(Math.round(p.t_sec * 100) / 100, p);
  }

  const timeSeries: D2ModelPoint[] = sortedTimes.map((t) => {
    const measured = measuredMap.get(t);
    const d2_model = calculateD2(d0_mm, k_mm2_s, t);
    const d2_measured = measured?.d2_mm2;
    const residual = d2_measured !== undefined ? d2_measured - d2_model : undefined;

    return {
      t_sec: t,
      d2_measured,
      d2_model: Math.round(d2_model * 1000) / 1000,
      residual: residual !== undefined ? Math.round(residual * 1000) / 1000 : undefined,
      regime: measured?.regime,
    };
  });

  const rmse = calculateRMSE(measuredSeries, d0_mm, k_mm2_s);
  const mae = calculateMAE(measuredSeries, d0_mm, k_mm2_s);

  return {
    timeSeries,
    burnoutTime_sec: Math.round(burnoutTime * 100) / 100,
    burnRate_K: k_mm2_s,
    rmse: rmse !== null ? Math.round(rmse * 1000) / 1000 : null,
    mae: mae !== null ? Math.round(mae * 1000) / 1000 : null,
    validDomainMessage,
    isWithinDomain,
  };
}
