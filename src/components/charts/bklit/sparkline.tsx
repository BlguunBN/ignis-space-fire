"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export interface BklitSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function BklitSparkline({
  data,
  color = "#38bdf8",
  height = 64,
  className,
}: BklitSparklineProps) {
  const points = data.map((value, index) => ({ index, value }));

  if (points.length === 0) {
    return <div className={className} style={{ height }} aria-hidden="true" />;
  }

  return (
    <div className={className} style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
