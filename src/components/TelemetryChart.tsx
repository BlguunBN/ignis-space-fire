"use client";

import React from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Activity } from "lucide-react";
import { ExperimentRecord } from "../types/evidence";

interface TelemetryChartProps {
  records: ExperimentRecord[];
  activeId: string | null;
  onSelectRecord: (id: string) => void;
}

export function TelemetryChart({ records, activeId, onSelectRecord }: TelemetryChartProps) {
  const chartData = records
    .filter((r) => r.oxygen_pct != null && r.airflow_cm_s != null)
    .map((r) => ({
      id: r.id,
      name: r.investigation,
      flow: r.airflow_cm_s ?? 0,
      oxygen: r.oxygen_pct ?? 21,
      pressure: r.pressure_kpa ?? 101.3,
      material: r.material,
      programme: r.programme,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded shadow-xl font-mono text-[11px] space-y-1">
          <p className="font-bold text-amber-400">{data.name}</p>
          <p className="text-slate-300">Fuel: <span className="text-slate-100">{data.material}</span></p>
          <p className="text-slate-300">
            Forced Flow: <span className="text-cyan-400 font-bold">{data.flow} cm/s</span>
          </p>
          <p className="text-slate-300">
            Oxygen: <span className="text-cyan-400 font-bold">{data.oxygen}%</span> | P: {data.pressure} kPa
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Microgravity Parameter Space (Airflow vs. Oxygen Concentration)
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          Click point to inspect study
        </span>
      </div>

      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              type="number"
              dataKey="flow"
              name="Flow Velocity"
              unit=" cm/s"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              domain={[0, 25]}
            />
            <YAxis
              type="number"
              dataKey="oxygen"
              name="Oxygen"
              unit="%"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              domain={[15, 38]}
            />
            <ZAxis range={[70, 70]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name="NASA Investigations"
              data={chartData}
              onClick={(entry) => onSelectRecord(entry.id)}
              className="cursor-pointer"
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={entry.id === activeId ? "#fbbf24" : "#38bdf8"}
                  stroke={entry.id === activeId ? "#f59e0b" : "#0284c7"}
                  strokeWidth={entry.id === activeId ? 3 : 1.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-1.5">
        <span>X-Axis: Forced Ventilation Airflow (0–25 cm/s)</span>
        <span>Y-Axis: Cabin Oxygen Index (15%–38% O₂)</span>
      </div>
    </div>
  );
}
