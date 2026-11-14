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
        <div className="bg-[#13171e] border border-white/20 p-2.5 rounded shadow-2xl font-mono text-[11px] space-y-1">
          <p className="font-semibold text-amber-400">{data.name}</p>
          <p className="text-slate-300">
            Material: <span className="text-slate-100">{data.material}</span>
          </p>
          <div className="flex items-center gap-3 pt-0.5 text-slate-300">
            <span>
              Flow: <strong className="text-cyan-400">{data.flow} cm/s</strong>
            </span>
            <span>
              O₂: <strong className="text-cyan-400">{data.oxygen}%</strong>
            </span>
            <span>P: {data.pressure} kPa</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0c0f14] border border-white/[0.08] rounded-lg p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Microgravity Parameter Space (Airflow vs. Oxygen)</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          Click point to inspect
        </span>
      </div>

      <div className="h-48 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              type="number"
              dataKey="flow"
              name="Flow Velocity"
              unit=" cm/s"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              domain={[0, 25]}
            />
            <YAxis
              type="number"
              dataKey="oxygen"
              name="Oxygen"
              unit="%"
              stroke="#64748b"
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
              {chartData.map((entry) => {
                const isActive = entry.id === activeId;
                return (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={isActive ? "#f59e0b" : "#38bdf8"}
                    stroke={isActive ? "#fbbf24" : "#0284c7"}
                    strokeWidth={isActive ? 3 : 1}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 border-t border-white/[0.04] pt-2">
        <span>X: Forced Ventilation Airflow (0–25 cm/s)</span>
        <span>Y: Cabin Oxygen Index (15%–38% O₂)</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Corpus Study
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Active Inspection
          </span>
        </div>
      </div>
    </div>
  );
}
