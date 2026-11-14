"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { D2ModelPoint, ModelCalibration } from "@/types/simulation";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface D2ChartProps {
  timeSeries: D2ModelPoint[];
  calibration?: ModelCalibration;
  burnoutTime: number;
  rmse: number | null;
  mae: number | null;
  d0: number;
  k: number;
}

export function D2Chart({
  timeSeries,
  calibration,
  burnoutTime,
  rmse,
  mae,
  d0,
  k,
}: D2ChartProps) {
  // Filter for residual plot: only points where real measurement was recorded
  const residualPoints = timeSeries
    .filter((pt) => pt.d2_measured !== undefined && pt.residual !== undefined)
    .map((pt) => ({
      t_sec: pt.t_sec,
      residual: pt.residual,
      regime: pt.regime,
    }));

  return (
    <div className="space-y-4">
      {/* Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#111214] border border-[#303134] rounded-lg">
          <div className="text-[11px] text-[#9EA2A7]">Initial Diameter D₀</div>
          <div className="text-base font-mono font-semibold text-[#F3F2EF] mt-0.5">
            {d0.toFixed(2)} <span className="text-xs font-normal text-[#9EA2A7]">mm</span>
          </div>
          <div className="text-[10px] text-[#9EA2A7] mt-0.5">
            D₀² = {(d0 * d0).toFixed(2)} mm²
          </div>
        </div>

        <div className="p-3 bg-[#111214] border border-[#303134] rounded-lg">
          <div className="text-[11px] text-[#9EA2A7]">Burn Rate Constant K</div>
          <div className="text-base font-mono font-semibold text-blue-400 mt-0.5">
            {k.toFixed(2)} <span className="text-xs font-normal text-[#9EA2A7]">mm²/s</span>
          </div>
          <div className="text-[10px] text-[#9EA2A7] mt-0.5">
            OLS slope [0.5, 6.5s]
          </div>
        </div>

        <div className="p-3 bg-[#111214] border border-[#303134] rounded-lg">
          <div className="text-[11px] text-[#9EA2A7]">Hot-Flame RMSE</div>
          <div className="text-base font-mono font-semibold text-emerald-400 mt-0.5">
            {rmse !== null ? `${rmse.toFixed(3)}` : "N/A"}{" "}
            <span className="text-xs font-normal text-[#9EA2A7]">mm²</span>
          </div>
          <div className="text-[10px] text-[#9EA2A7] mt-0.5">
            MAE: {mae !== null ? `${mae.toFixed(3)} mm²` : "N/A"}
          </div>
        </div>

        <div className="p-3 bg-[#111214] border border-[#303134] rounded-lg">
          <div className="text-[11px] text-[#9EA2A7]">Projected Burnout</div>
          <div className="text-base font-mono font-semibold text-[#DDA36B] mt-0.5">
            {isFinite(burnoutTime) ? `${burnoutTime.toFixed(1)} s` : "∞"}
          </div>
          <div className="text-[10px] text-[#9EA2A7] mt-0.5">
            Extinction: ~6.8 s (Observed)
          </div>
        </div>
      </div>

      {/* Main D² vs Time Plot */}
      <div className="p-4 bg-[#111214] border border-[#303134] rounded-lg space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-semibold text-[#F3F2EF] uppercase tracking-wider">
              Droplet Surface Regression: D(t)² vs Time
            </h3>
            <p className="text-[11px] text-[#9EA2A7]">
              NASA FLEX PSI-69 empirical points (green dots) vs Calibrated d²-law regression line (blue)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              NASA FLEX Observed D²
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-400">
              <span className="w-3.5 h-0.5 bg-blue-400 inline-block" />
              d² Model Line
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeries}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#23262A" />
              <XAxis
                dataKey="t_sec"
                stroke="#6B7280"
                fontSize={11}
                tickFormatter={(v) => `${v}s`}
                domain={[0, "auto"]}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickFormatter={(v) => `${v}`}
                unit=" mm²"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#191A1D",
                  border: "1px solid #303134",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F3F2EF",
                }}
                formatter={(val: any, name: any) => {
                  if (val === undefined || val === null) return ["-", String(name)];
                  return [`${Number(val).toFixed(3)} mm²`, name === "d2_measured" ? "NASA Measured D²" : "d² Model"];
                }}
                labelFormatter={(t) => `Time: ${t} s`}
              />

              {/* Shaded cool-flame regime notice */}
              <ReferenceArea
                x1={6.8}
                x2={10}
                fill="#F59E0B"
                fillOpacity={0.06}
                strokeOpacity={0.2}
              />

              <ReferenceLine
                x={6.8}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{
                  value: "Hot Flame Extinction (t=6.8s)",
                  fill: "#F59E0B",
                  fontSize: 10,
                  position: "top",
                }}
              />

              <Line
                type="monotone"
                dataKey="d2_model"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                name="d2_model"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="d2_measured"
                stroke="#34D399"
                strokeWidth={0}
                dot={{ r: 4, fill: "#34D399", strokeWidth: 1, stroke: "#064E3B" }}
                name="d2_measured"
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Physics Note Callout */}
        <div className="flex items-start gap-2 p-2.5 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <p>
            <strong>Physical Model Limitation:</strong> The linear d² law (blue) accurately traces the hot-flame stage (t ≤ 6.5s, RMSE ≈ 0.038 mm²). However, at t ≈ 6.8s, radiative soot heat loss extinguishes the hot flame. The droplet does NOT burn to 0 at K = 0.76; instead, it enters an invisible low-temperature <em>cool flame</em> stage burning at a reduced K ≈ 0.31 mm²/s.
          </p>
        </div>
      </div>

      {/* Residuals Plot */}
      {residualPoints.length > 0 && (
        <div className="p-4 bg-[#111214] border border-[#303134] rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#F3F2EF] uppercase tracking-wider">
              Fit Residuals: D²(measured) − D²(model)
            </h4>
            <span className="text-[11px] font-mono text-[#9EA2A7]">
              Near zero = high fidelity fit
            </span>
          </div>

          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={residualPoints}
                margin={{ top: 5, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#23262A" />
                <XAxis
                  dataKey="t_sec"
                  stroke="#6B7280"
                  fontSize={10}
                  tickFormatter={(v) => `${v}s`}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={10}
                  domain={[-0.5, 1.2]}
                  unit=" mm²"
                />
                <ReferenceLine y={0} stroke="#4B5563" strokeDasharray="2 2" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#191A1D",
                    border: "1px solid #303134",
                    borderRadius: "6px",
                    fontSize: "11px",
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(3)} mm²`, "Residual"]}
                  labelFormatter={(t) => `t = ${t} s`}
                />
                <Line
                  type="monotone"
                  dataKey="residual"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: "#F59E0B" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
