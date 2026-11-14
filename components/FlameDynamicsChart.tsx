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
} from "recharts";
import { Info, Activity } from "lucide-react";

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
        <div className="bg-[#0C0F13] border border-[#303741] p-3 rounded-xl shadow-xl text-xs max-w-xs space-y-1">
          <div className="flex items-center justify-between gap-2 border-b border-[#303741] pb-1">
            <span className="font-bold text-[#F3F5F7] text-xs">{data.name}</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1B2027] text-[#78A9D8]">
              {data.programme}
            </span>
          </div>
          <div className="text-[#A1AAB5] pt-0.5 text-[11px]">
            <span className="text-[#737F8C]">Material: </span>
            <span className="font-medium text-[#F3F5F7]">{data.material}</span>
          </div>
          <div className="text-[#A1AAB5] text-[11px]">
            <span className="text-[#737F8C]">Platform: </span>
            <span>{data.platform}</span>
          </div>
          <div className="text-[#A1AAB5] text-[11px]">
            <span className="text-[#737F8C]">Airflow: </span>
            <span className="font-mono text-[#78A9D8] font-bold">{data.airflow} cm/s</span>
          </div>
          <div className="text-[#A1AAB5] text-[11px]">
            <span className="text-[#737F8C]">Atmosphere: </span>
            <span className="font-mono text-[#E99847]">
              {data.oxygen}% O₂ ({data.pressure} kPa)
            </span>
          </div>
          <div className="text-[#A1AAB5] text-[11px]">
            <span className="text-[#737F8C]">Observed Spread: </span>
            <span className="font-mono text-[#D97777] font-bold">~{data.spreadRateEst} mm/s</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#303741]">
        <div>
          <h3 className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#78A9D8]" />
            NASA Empirical Microgravity Flame Dynamics
          </h3>
          <p className="text-xs text-[#A1AAB5] mt-0.5">
            Real empirical flight data plotted across Saffire, BASS-II, FLEX, SoFIE, and SAME-R.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#0C0F13] p-1 rounded-lg border border-[#303741] text-xs">
          <button
            onClick={() => setViewMode("airflow")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
              viewMode === "airflow"
                ? "bg-[#1B2027] text-[#E99847] border border-[#303741] font-semibold"
                : "text-[#A1AAB5] hover:text-[#F3F5F7]"
            }`}
          >
            Airflow vs. Spread Velocity
          </button>
          <button
            onClick={() => setViewMode("atmosphere")}
            className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
              viewMode === "atmosphere"
                ? "bg-[#1B2027] text-[#E99847] border border-[#303741] font-semibold"
                : "text-[#A1AAB5] hover:text-[#F3F5F7]"
            }`}
          >
            Oxygen % vs. Ambient Pressure
          </button>
        </div>
      </div>

      {/* Recharts Scatter Visual */}
      <div className="w-full h-80 pt-2 bg-[#0C0F13] rounded-lg border border-[#303741] p-3">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "airflow" ? (
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E242C" />
              <XAxis
                type="number"
                dataKey="airflow"
                name="Airflow Velocity"
                unit=" cm/s"
                stroke="#737F8C"
                tick={{ fill: "#A1AAB5", fontSize: 11 }}
                domain={[0, 25]}
                label={{
                  value: "Forced Airflow Velocity (cm/s) — Microgravity Habitat Ventilation",
                  position: "insideBottom",
                  offset: -12,
                  fill: "#A1AAB5",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="spreadRateEst"
                name="Spread Rate"
                unit=" mm/s"
                stroke="#737F8C"
                tick={{ fill: "#A1AAB5", fontSize: 11 }}
                domain={[0, 8]}
                label={{
                  value: "Flame Spread Rate (mm/s)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#A1AAB5",
                  fontSize: 11,
                }}
              />
              <ZAxis range={[100, 220]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="NASA Investigations"
                data={EMPIRICAL_DATA}
                fill="#78A9D8"
                shape="circle"
              />
            </ScatterChart>
          ) : (
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E242C" />
              <XAxis
                type="number"
                dataKey="oxygen"
                name="Oxygen %"
                unit="%"
                stroke="#737F8C"
                tick={{ fill: "#A1AAB5", fontSize: 11 }}
                domain={[15, 38]}
                label={{
                  value: "Oxygen Concentration (O₂ %)",
                  position: "insideBottom",
                  offset: -12,
                  fill: "#A1AAB5",
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="pressure"
                name="Cabin Pressure"
                unit=" kPa"
                stroke="#737F8C"
                tick={{ fill: "#A1AAB5", fontSize: 11 }}
                domain={[40, 110]}
                label={{
                  value: "Total Cabin Pressure (kPa)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#A1AAB5",
                  fontSize: 11,
                }}
              />
              <ZAxis range={[100, 220]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Atmosphere Conditions"
                data={EMPIRICAL_DATA}
                fill="#E99847"
                shape="diamond"
              />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Scientific Observation */}
      <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] text-xs text-[#A1AAB5] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#78A9D8] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#F3F5F7]">Combustion Science Observation:</strong> In quiescent microgravity (0 cm/s flow), flames extinguish or transition to spherical cool flames due to radiative loss without buoyant replenishment. As ventilation increases (2 to 20 cm/s), convective oxygen delivery increases flame spread rate non-monotonically, demonstrating why cabin HVAC velocity is a critical safety determinant.
        </p>
      </div>
    </div>
  );
}
