"use client";

export interface BklitHeatmapCell {
  row: string;
  column: string;
  value: number;
}

export interface BklitHeatmapChartProps {
  data: BklitHeatmapCell[];
  rows: string[];
  columns: string[];
  className?: string;
  onSelect?: (cell: BklitHeatmapCell) => void;
}

/** Higher value → hotter cell color. 0 = empty, 1–3 = cyan, 4–6 = blue, 7–9 = emerald, 10+ = amber. */
function levelColor(value: number): string {
  if (value <= 0) return "#232a36";
  if (value < 3) return "#38bdf8";
  if (value < 6) return "#2563EB";
  if (value < 10) return "#10b981";
  return "#f59e0b";
}

export function BklitHeatmapChart({
  data,
  rows,
  columns,
  className,
  onSelect,
}: BklitHeatmapChartProps) {
  const lookup = new Map(data.map((cell) => [`${cell.row}|${cell.column}`, cell]));

  return (
    <div className={className} role="table" aria-label="Coverage heatmap">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `auto repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        <div />
        {columns.map((column) => (
          <div key={column} className="pb-1 text-center text-[11px] text-slate-400">
            {column}
          </div>
        ))}
        {rows.map((row) => (
          <div key={row} className="contents">
            <div className="flex items-center pr-2 text-[11px] text-slate-400">{row}</div>
            {columns.map((column) => {
              const cell = lookup.get(`${row}|${column}`);
              const value = cell?.value ?? 0;
              return (
                <button
                  key={column}
                  type="button"
                  disabled={!cell || !onSelect}
                  onClick={() => cell && onSelect?.(cell)}
                  title={cell ? `${row} · ${column}: ${value}` : `${row} · ${column}: no data`}
                  className="aspect-square w-full rounded-sm transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-default"
                  style={{ backgroundColor: levelColor(value) }}
                  aria-label={`${row} ${column}: ${value}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
