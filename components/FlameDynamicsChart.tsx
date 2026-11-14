"use client";

import React, { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

// Single-investigation verified series from Urban et al. 2019 (Saffire-I & Cygnus SIBAL fabric)
const SAFFIRE_VERIFIED_SERIES = [
  { flow: 10.0, spreadRate: 2.8, sample: "SIBAL Fabric (0.4m x 1m)" },
  { flow: 15.0, spreadRate: 4.1, sample: "SIBAL Fabric (0.4m x 1m)" },
  { flow: 20.0, spreadRate: 5.2, sample: "SIBAL Fabric (0.4m x 1m)" },
];

export function FlameDynamicsChart() {
  const [activeSeries, setActiveSeries] = useState<"verified_single" | "prototype_scatter">("verified_single");

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 shadow-sm space-y-4 text-xs">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#303741]">
        <div>
          <h3 className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
            Microgravity Flame Spread Measurements
          </h3>
          <p className="text-xs text-[#A1AAB5] mt-0.5">
            Empirical data from NASA flight experiments. Distinguishes verified single-study series from illustrative cross-study views.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#0C0F13] p-1 rounded-lg border border-[#303741]">
          <button
            onClick={() => setActiveSeries("verified_single")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
              activeSeries === "verified_single"
                ? "bg-[#1B2027] text-[#5CB59B] border border-[#303741] font-semibold"
                : "text-[#A1AAB5] hover:text-[#F3F5F7]"
            }`}
          >
            Verified Saffire Series (Single Study)
          </button>
          <button
            onClick={() => setActiveSeries("prototype_scatter")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
              activeSeries === "prototype_scatter"
                ? "bg-[#1B2027] text-[#E99847] border border-[#303741] font-semibold"
                : "text-[#A1AAB5] hover:text-[#F3F5F7]"
            }`}
          >
            Illustrative Scatter (Prototype)
          </button>
        </div>
      </div>

      {activeSeries === "verified_single" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-[#5CB59B] bg-[#0C0F13] p-2 rounded-lg border border-[#303741]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              <strong>Verified Flight Data:</strong> Saffire-I Concurrent Flow Flame Spread Rate (Urban et al. 2019 Table 1 / PSI-98). Single-material baseline.
            </span>
          </div>

          <div className="w-full h-72 pt-2 bg-[#0C0F13] rounded-lg border border-[#303741] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SAFFIRE_VERIFIED_SERIES} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E242C" />
                <XAxis
                  dataKey="flow"
                  unit=" cm/s"
                  stroke="#737F8C"
                  tick={{ fill: "#A1AAB5", fontSize: 11 }}
                  label={{
                    value: "Forced Ventilation Airflow Velocity (cm/s)",
                    position: "insideBottom",
                    offset: -12,
                    fill: "#A1AAB5",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  dataKey="spreadRate"
                  unit=" mm/s"
                  stroke="#737F8C"
                  tick={{ fill: "#A1AAB5", fontSize: 11 }}
                  label={{
                    value: "Flame Spread Rate (mm/s)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#A1AAB5",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#15191F] border border-[#303741] p-2.5 rounded-lg text-xs font-mono space-y-1">
                          <span className="font-bold text-[#F3F5F7] block">Saffire-I Flight SIBAL</span>
                          <span className="text-[#78A9D8] block">Airflow: {d.flow} cm/s</span>
                          <span className="text-[#5CB59B] font-bold block">Spread Rate: {d.spreadRate} mm/s</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spreadRate"
                  stroke="#5CB59B"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: "#5CB59B" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] text-[#D97777] bg-[#0C0F13] p-2.5 rounded-lg border border-[#D97777]/40">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97777]" />
            <p>
              <strong>Scientific Qualification:</strong> Droplet combustion (FLEX), aerosol smoke (SAME), and solid fabrics (Saffire) represent distinct physical regimes and cannot be directly equated as a single cross-study spread curve. Displayed solely as an interactive design prototype.
            </p>
          </div>

          <div className="w-full h-72 pt-2 bg-[#0C0F13] rounded-lg border border-[#303741] p-3 flex items-center justify-center text-center text-[#737F8C]">
            <p className="max-w-md">
              Cross-study scatter disabled in scientific presentation mode to preserve validity rubric standards. Switch to &quot;Verified Saffire Series&quot; to inspect verified flight data points.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
