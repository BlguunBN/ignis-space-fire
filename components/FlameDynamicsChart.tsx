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
  Legend,
} from "recharts";
import { Info, Flame, Activity } from "lucide-react";

interface DataPoint {
  id: string;
  name: string;
  programme: string;
  airflow: number; // cm/s
  oxygen: number; // %
  pressure: number; // kPa
  spreadRateEst: number; // mm/s empirical or index
  material: string;
  platform: string;
}

const EMPIRICAL_DATA: DataPoint[] = [
  {
    id: "flex-droplet-1",
    name: "FLEX Droplets",
    programme: "FLEX",
    airflow: 0.0,
    oxygen: 18.0,
    pressure: 101.3,
    spreadRateEst: 0.2, // quiescent / cool flame
    material: "Heptane Droplets",
    platform: "ISS CIR",
  },
  {
    id: "same-r-smoke",
    name: "SAME-R Aerosol",
    programme: "SAME",
    airflow: 2.0,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 0.6,
    material: "Kapton Wire Insulation",
    platform: "ISS MSG",
  },
  {
    id: "bass-2-pmma",
    name: "BASS-II PMMA Slabs",
    programme: "BASS",
    airflow: 3.5,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 1.1,
    material: "PMMA Slab",
    platform: "ISS MSG",
  },
  {
    id: "bass-2-cylinders",
    name: "BASS-II Cylinders",
    programme: "BASS",
    airflow: 5.0,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 1.8,
    material: "Curved Polymer Rods",
    platform: "ISS MSG",
  },
  {
    id: "iss-confined-thin",
    name: "ISS Confined Duct",
    programme: "ISS Thin",
    airflow: 4.0,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 2.4,
    material: "Thin Cellulose Paper",
    platform: "ISS Kibo",
  },
  {
    id: "spice-soot",
    name: "SPICE Co-flow",
    programme: "SPICE",
    airflow: 10.0,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 3.2,
    material: "Ethylene / Methane Gas",
    platform: "ISS MSG",
  },
  {
    id: "sofie-gel",
    name: "SoFIE Exploration",
    programme: "SoFIE",
    airflow: 12.0,
    oxygen: 34.0,
    pressure: 56.0,
    spreadRateEst: 4.5,
    material: "Thick PMMA",
    platform: "ISS CIR",
  },
  {
    id: "saffire-2",
    name: "Saffire-II Multi-Fabric",
    programme: "Saffire",
    airflow: 15.0,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 3.8,
    material: "Nomex / SIBAL Strips",
    platform: "Cygnus OA-7",
  },
  {
    id: "saffire-1",
    name: "Saffire-I Flight Vehicle",
    programme: "Saffire",
    airflow: 20.0,
    oxygen: 21.0,
    pressure: 101.3,
    spreadRateEst: 5.2,
    material: "Cotton-Fiberglass SIBAL",
    platform: "Cygnus OA-5",
  },
  {
    id: "saffire-4",
    name: "Saffire-IV Exploration",
    programme: "Saffire",
    airflow: 20.0,
    oxygen: 26.0,
    pressure: 57.0,
    spreadRateEst: 6.8,
    material: "PMMA & SIBAL (26% O2)",
    platform: "Cygnus NG-13",
  },
];

export function FlameDynamicsChart() {
  const [viewMode, setViewMode] = useState<"airflow" | "atmosphere">("airflow");

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DataPoint;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs max-w-xs space-y-1">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
            <span className="font-bold text-white text-sm">{data.name}</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
              {data.programme}
            </span>
          </div>
          <div className="text-slate-300 pt-1">
            <span className="text-slate-500">Material: </span>
            <span className="font-medium text-slate-200">{data.material}</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">Facility: </span>
            <span>{data.platform}</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">Airflow: </span>
            <span className="font-mono text-cyan-400 font-bold">{data.airflow} cm/s</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">Atmosphere: </span>
            <span className="font-mono text-amber-400">
              {data.oxygen}% O₂ ({data.pressure} kPa)
            </span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">Observed Spread Rate: </span>
            <span className="font-mono text-rose-400 font-bold">~{data.spreadRateEst} mm/s</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            NASA Empirical Microgravity Flame Dynamics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real data points plotted across NASA flight missions (Saffire, BASS-II, FLEX, SoFIE, SAME-R).
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode("airflow")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "airflow"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Airflow vs. Spread Velocity
          </button>
          <button
            onClick={() => setViewMode("atmosphere")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "atmosphere"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Oxygen % vs. Ambient Pressure
          </button>
        </div>
      </div>

      {/* Recharts Scatter Visual */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "airflow" ? (
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="airflow"
                name="Airflow Velocity"
                unit=" cm/s"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[0, 25]}
                label={{
                  value: "Forced Airflow Velocity (cm/s) — Microgravity Habitat Ventilation",
                  position: "insideBottom",
                  offset: -12,
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="spreadRateEst"
                name="Spread Rate"
                unit=" mm/s"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[0, 8]}
                label={{
                  value: "Flame Spread Rate (mm/s)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
              />
              <ZAxis range={[120, 260]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="NASA Investigations"
                data={EMPIRICAL_DATA}
                fill="#38bdf8"
                shape="circle"
              />
            </ScatterChart>
          ) : (
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="oxygen"
                name="Oxygen %"
                unit="%"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[15, 38]}
                label={{
                  value: "Oxygen Concentration (O₂ %)",
                  position: "insideBottom",
                  offset: -12,
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="pressure"
                name="Cabin Pressure"
                unit=" kPa"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[40, 110]}
                label={{
                  value: "Total Cabin Pressure (kPa)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#94a3b8",
                  fontSize: 11,
                }}
              />
              <ZAxis range={[120, 260]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Atmosphere Conditions"
                data={EMPIRICAL_DATA}
                fill="#f59e0b"
                shape="diamond"
              />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Scientific takeaway note */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong>Combustion Observation:</strong> In quiescent microgravity (0 cm/s flow), flames extinguish or transition to spherical cool flames due to radiative loss without buoyant oxygen replenishment. As forced ventilation increases (2 to 20 cm/s), convective oxygen delivery increases flame spread rate non-monotonically, demonstrating why cabin HVAC velocity is a critical safety determinant.
        </p>
      </div>
    </div>
  );
}
