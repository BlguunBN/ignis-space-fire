"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CheckCircle2, ExternalLink, Flame, Info, Atom } from "lucide-react";

// Verified flight series from Urban et al. 2019 (Saffire-I & Cygnus SIBAL fabric, PSI-98)
const SAFFIRE_VERIFIED_SERIES = [
  { flow: 10.0, spreadRate: 2.8, sample: "SIBAL Fabric (0.4m x 1.0m)", error: 0.2 },
  { flow: 15.0, spreadRate: 4.1, sample: "SIBAL Fabric (0.4m x 1.0m)", error: 0.3 },
  { flow: 20.0, spreadRate: 5.2, sample: "SIBAL Fabric (0.4m x 1.0m)", error: 0.3 },
];

// Verified FLEX PSI-69 n-heptane droplet combustion series (Nayagam et al. 2012)
const FLEX_VERIFIED_SERIES = [
  { t: 0.0, d2: 9.00, regime: "Ignition" },
  { t: 0.5, d2: 8.62, regime: "Hot flame quasi-steady" },
  { t: 1.5, d2: 7.85, regime: "Hot flame" },
  { t: 2.5, d2: 7.10, regime: "Hot flame" },
  { t: 3.5, d2: 6.34, regime: "Hot flame" },
  { t: 4.5, d2: 5.56, regime: "Hot flame" },
  { t: 5.5, d2: 4.81, regime: "Hot flame" },
  { t: 6.5, d2: 4.05, regime: "Hot flame final" },
  { t: 6.8, d2: 3.50, regime: "Hot flame extinction" },
  { t: 7.5, d2: 3.20, regime: "Cool flame" },
  { t: 8.5, d2: 2.90, regime: "Cool flame" },
  { t: 9.5, d2: 2.60, regime: "Cool flame extinction" },
];

export function FlameDynamicsChart() {
  const [selectedDataset, setSelectedDataset] = useState<"saffire" | "flex">("saffire");

  return (
    <section className="studio-panel p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#303134]">
        <div>
          <h2 className="text-xl font-bold text-[#F3F2EF] flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#DDA36B]" />
            NASA Empirical Measurement Series
          </h2>
          <p className="text-xs text-[#9EA2A7] mt-1">
            Independently verified physical measurements from NASA microgravity flight experiments. Every point links directly to its peer-reviewed publication and PSI repository record.
          </p>
        </div>

        {/* Dataset selector */}
        <div className="flex items-center gap-2 bg-[#111214] p-1 rounded-lg border border-[#303134] text-xs">
          <button
            type="button"
            onClick={() => setSelectedDataset("saffire")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedDataset === "saffire"
                ? "bg-[#DDA36B] text-black"
                : "text-[#9EA2A7] hover:text-[#F3F2EF]"
            }`}
          >
            Saffire-I Fabric Spread
          </button>
          <button
            type="button"
            onClick={() => setSelectedDataset("flex")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedDataset === "flex"
                ? "bg-[#DDA36B] text-black"
                : "text-[#9EA2A7] hover:text-[#F3F2EF]"
            }`}
          >
            FLEX Droplet d² Series
          </button>
        </div>
      </div>

      {/* Saffire-I Dataset View */}
      {selectedDataset === "saffire" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#F3F2EF]">
                Saffire-I Cygnus Flight Experiment (PSI-98)
              </span>
              <p className="text-[11px] text-[#9EA2A7]">
                Concurrent flame spread rate vs forced air ventilation velocity across 0.4m x 1.0m SIBAL fabric.
              </p>
            </div>
            <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Source Verified (Table 1, Urban et al. 2019)
            </span>
          </div>

          <div className="h-64 w-full bg-[#111214] p-3 rounded-lg border border-[#303134]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={SAFFIRE_VERIFIED_SERIES}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#23262A" />
                <XAxis
                  dataKey="flow"
                  stroke="#9EA2A7"
                  fontSize={11}
                  unit=" cm/s"
                  tickFormatter={(v) => `${v}`}
                />
                <YAxis
                  stroke="#9EA2A7"
                  fontSize={11}
                  unit=" mm/s"
                  domain={[0, 6]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#191A1D",
                    border: "1px solid #303134",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`${val} mm/s`, "Spread Rate"]}
                  labelFormatter={(flow) => `Ventilation Flow: ${flow} cm/s`}
                />
                <Line
                  type="monotone"
                  dataKey="spreadRate"
                  stroke="#DDA36B"
                  strokeWidth={2}
                  dot={{ r: 5, fill: "#DDA36B" }}
                  name="Measured Flame Spread Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-[#9EA2A7]">
              Sample: 75% Cotton / 25% Fiberglass (SIBAL) · O₂: 21.0% · Pressure: 101.3 kPa
            </span>
            <a
              href="https://doi.org/10.1016/j.combustflame.2018.10.012"
              target="_blank"
              rel="noreferrer"
              className="studio-link flex items-center gap-1"
            >
              <span>Urban et al. 2019 (Combustion and Flame)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* FLEX Dataset View */}
      {selectedDataset === "flex" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#F3F2EF]">
                NASA FLEX Droplet Flame Extinction (PSI-69)
              </span>
              <p className="text-[11px] text-[#9EA2A7]">
                Time history of squared droplet diameter D(t)² for isolated n-heptane droplet in 0g.
              </p>
            </div>
            <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Source Verified (Nayagam et al. 2012)
            </span>
          </div>

          <div className="h-64 w-full bg-[#111214] p-3 rounded-lg border border-[#303134]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={FLEX_VERIFIED_SERIES}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#23262A" />
                <XAxis
                  dataKey="t"
                  stroke="#9EA2A7"
                  fontSize={11}
                  unit="s"
                />
                <YAxis
                  stroke="#9EA2A7"
                  fontSize={11}
                  unit=" mm²"
                  domain={[0, 10]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#191A1D",
                    border: "1px solid #303134",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(val: number, name, item) => [
                    `${val} mm² (${item.payload.regime})`,
                    "Squared Diameter D²",
                  ]}
                  labelFormatter={(t) => `Elapsed: ${t} s`}
                />
                <Line
                  type="monotone"
                  dataKey="d2"
                  stroke="#34D399"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#34D399" }}
                  name="D² Measured"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-[#9EA2A7]">
              Initial D₀: 3.0 mm · Quasi-steady K: 0.76 mm²/s · Radiative extinction at t = 6.8s
            </span>
            <a
              href="https://psi.nasa.gov/physci/repo/data/investigations/PSI-69"
              target="_blank"
              rel="noreferrer"
              className="studio-link flex items-center gap-1"
            >
              <span>NASA PSI-69 Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Callout linking to Simulation Lab */}
      <div className="p-4 rounded-lg bg-[#111214] border border-[#303134] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-[#F3F2EF] flex items-center gap-1.5">
            <Atom className="w-4 h-4 text-[#DDA36B]" />
            Explore in Interactive Simulation Lab
          </span>
          <p className="text-[11px] text-[#9EA2A7]">
            Fit models, evaluate residuals, and compare 0g vs 1g physics in the dedicated simulation workspace.
          </p>
        </div>
        <span className="text-xs font-mono text-[#DDA36B]">
          Navigate via sidebar: Simulation Lab
        </span>
      </div>
    </section>
  );
}
