"use client";

import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer } from "recharts";

export interface BklitRingChartProps {
  /** 0–100 percent complete. */
  value: number;
  label?: string;
  height?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}

export function BklitRingChart({
  value,
  label,
  height = 180,
  color = "#2563EB",
  trackColor = "#232a36",
  className,
}: BklitRingChartProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const data = [
    { name: "complete", value: clamped },
    { name: "remaining", value: 100 - clamped },
  ];

  return (
    <div className={`relative ${className ?? ""}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={70}
            outerRadius={90}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill={trackColor} />
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-100">{Math.round(clamped)}%</span>
        {label ? <span className="mt-0.5 text-[11px] text-slate-400">{label}</span> : null}
      </div>
    </div>
  );
}
