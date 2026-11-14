"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2563EB", "#f59e0b", "#10b981", "#ef4444", "#38bdf8", "#94a3b8"];

export interface BklitPieDatum {
  name: string;
  value: number;
}

export interface BklitPieChartProps {
  data: BklitPieDatum[];
  height?: number;
  donut?: boolean;
  className?: string;
}

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

function StatusTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border border-white/10 bg-[#13171e] px-3 py-1.5 text-xs shadow-lg">
      <span className="text-slate-400">{entry.name}</span>
      <span className="ml-2 font-medium text-slate-100">{entry.value}</span>
    </div>
  );
}

export function BklitPieChart({ data, height = 220, donut = true, className }: BklitPieChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  if (total === 0) {
    return (
      <div
        className={className}
        style={{ height }}
        role="img"
        aria-label="No data available"
      />
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={donut ? 60 : 0}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<StatusTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
