"use client";

import React, { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wind,
  Flame,
  Gauge,
} from "lucide-react";
import { ExperimentRecord, SearchQuery, SortOption } from "../types/evidence";
import { assessApplicability, ApplicabilityAssessment } from "../lib/applicability";

interface ComparisonTableProps {
  records: ExperimentRecord[];
  query: SearchQuery;
  activeId: string | null;
  onSelectActive: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSortChange?: (sort: SortOption) => void;
}

interface TableRowData {
  record: ExperimentRecord;
  assessment: ApplicabilityAssessment;
}

export function ComparisonTable({
  records,
  query,
  activeId,
  onSelectActive,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onSortChange,
}: ComparisonTableProps) {
  const currentSort = query.sortBy || "relevance";

  const data = useMemo<TableRowData[]>(() => {
    return records.map((record) => ({
      record,
      assessment: assessApplicability(record, query),
    }));
  }, [records, query]);

  const handleNameSort = () => {
    if (!onSortChange) return;
    if (currentSort === "name_asc") {
      onSortChange("name_desc");
    } else {
      onSortChange("name_asc");
    }
  };

  const handleConditionSort = (type: "oxygen" | "airflow" | "pressure") => {
    if (!onSortChange) return;
    if (type === "oxygen") {
      onSortChange(currentSort === "oxygen_desc" ? "oxygen_asc" : "oxygen_desc");
    } else if (type === "airflow") {
      onSortChange(currentSort === "airflow_desc" ? "airflow_asc" : "airflow_desc");
    } else if (type === "pressure") {
      onSortChange(currentSort === "pressure_desc" ? "pressure_asc" : "pressure_desc");
    }
  };

  const columns = useMemo<ColumnDef<TableRowData>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center pl-1">
            <input
              type="checkbox"
              aria-label="Select all investigations"
              checked={selectedIds.size === records.length && records.length > 0}
              onChange={() => {
                if (selectedIds.size === records.length) {
                  onClearSelection();
                } else {
                  onSelectAll();
                }
              }}
              className="rounded bg-[#13171e] border-white/20 text-amber-500 focus:ring-amber-400/50 h-3.5 w-3.5 cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center pl-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              aria-label={`Select ${row.original.record.investigation}`}
              checked={selectedIds.has(row.original.record.id)}
              onChange={() => onToggleSelect(row.original.record.id)}
              className="rounded bg-[#13171e] border-white/20 text-amber-500 focus:ring-amber-400/50 h-3.5 w-3.5 cursor-pointer"
            />
          </div>
        ),
        size: 32,
      },
      {
        accessorKey: "investigation",
        header: () => (
          <button
            onClick={handleNameSort}
            className="flex items-center gap-1.5 hover:text-white transition-colors group font-mono text-[11px] text-slate-400 text-left"
            title="Click to sort alphabetically"
          >
            <span>Investigation</span>
            {currentSort === "name_asc" ? (
              <ArrowUp className="w-3 h-3 text-amber-400" />
            ) : currentSort === "name_desc" ? (
              <ArrowDown className="w-3 h-3 text-amber-400" />
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const rec = row.original.record;
          const isActive = rec.id === activeId;
          return (
            <div className="text-left font-sans pr-2">
              <div className="font-medium text-xs text-slate-100 leading-snug">
                {rec.investigation}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-slate-300">{rec.programme}</span>
                <span className="text-white/20">•</span>
                <span className="text-slate-400">{rec.platform}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "conditions",
        header: () => (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Physical conditions</span>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConditionSort("oxygen");
                }}
                className={`px-1 py-0.2 rounded border transition-colors flex items-center gap-0.5 ${
                  currentSort.startsWith("oxygen")
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                title="Sort by Oxygen %"
              >
                <span>O₂</span>
                {currentSort === "oxygen_asc" ? (
                  <ArrowUp className="w-2 h-2" />
                ) : currentSort === "oxygen_desc" ? (
                  <ArrowDown className="w-2 h-2" />
                ) : null}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConditionSort("airflow");
                }}
                className={`px-1 py-0.2 rounded border transition-colors flex items-center gap-0.5 ${
                  currentSort.startsWith("airflow")
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                title="Sort by Airflow"
              >
                <span>Flow</span>
                {currentSort === "airflow_asc" ? (
                  <ArrowUp className="w-2 h-2" />
                ) : currentSort === "airflow_desc" ? (
                  <ArrowDown className="w-2 h-2" />
                ) : null}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConditionSort("pressure");
                }}
                className={`px-1 py-0.2 rounded border transition-colors flex items-center gap-0.5 ${
                  currentSort.startsWith("pressure")
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                title="Sort by Pressure"
              >
                <span>Press</span>
                {currentSort === "pressure_asc" ? (
                  <ArrowUp className="w-2 h-2" />
                ) : currentSort === "pressure_desc" ? (
                  <ArrowDown className="w-2 h-2" />
                ) : null}
              </button>
            </div>
          </div>
        ),
        cell: ({ row }) => {
          const rec = row.original.record;
          return (
            <div className="font-mono text-[11px] text-slate-300 space-y-0.5 whitespace-nowrap">
              <div>
                <span className="text-cyan-400 font-medium">
                  {rec.oxygen_pct != null ? `${rec.oxygen_pct}% O₂` : "—"}
                </span>
                <span className="text-white/20 mx-1.5">•</span>
                <span className="text-cyan-400 font-medium">
                  {rec.airflow_cm_s != null ? `${rec.airflow_cm_s} cm/s` : "0 cm/s"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                <span>{rec.pressure_kpa != null ? `${rec.pressure_kpa} kPa` : "101.3 kPa"}</span>
                <span className="text-white/20 mx-1">•</span>
                <span>{rec.material}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "applicability",
        header: () => (
          <div className="text-left font-mono text-[11px] text-slate-400">
            Applicability
          </div>
        ),
        cell: ({ row }) => {
          const { assessment } = row.original;
          const verdict = assessment.verdict;

          let dotColor = "bg-slate-500";
          let textColor = "text-slate-400";
          let label = assessment.verdictLabel;

          if (verdict === "EXACT_MATCH") {
            dotColor = "bg-emerald-400";
            textColor = "text-emerald-400";
          } else if (verdict === "CONDITION_VARIANCE") {
            dotColor = "bg-amber-400";
            textColor = "text-amber-300";
            if (assessment.differences.length > 0) {
              label = assessment.differences[0];
            }
          } else if (verdict === "UNSUPPORTED") {
            dotColor = "bg-rose-400";
            textColor = "text-rose-400";
          }

          return (
            <div
              className="font-mono text-[11px] flex items-center gap-1.5"
              title={assessment.differences.join("\n") || assessment.reasons.join("\n")}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
              <span className={`truncate max-w-[130px] ${textColor}`}>{label}</span>
            </div>
          );
        },
      },
    ],
    [activeId, selectedIds, records.length, currentSort, onClearSelection, onSelectAll, onToggleSelect, onSortChange]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (records.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-white/[0.08] bg-[#13171e]">
        <Info className="w-5 h-5 text-slate-500 mx-auto mb-2" />
        <p className="text-xs font-mono text-slate-300">No indexed investigations match this inquiry.</p>
        <p className="text-[11px] text-slate-500 mt-1">Try loosening physical filters or keywords.</p>
      </div>
    );
  }

  return (
    <div className="border border-white/[0.09] rounded-lg overflow-hidden bg-[#13171e]">
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#13171e] text-slate-400 font-mono text-[11px] sticky top-0 z-10 border-b border-white/[0.08]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-2.5 px-3 font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {table.getRowModel().rows.map((row) => {
              const rec = row.original.record;
              const isActive = rec.id === activeId;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectActive(rec.id)}
                  className={`cursor-pointer transition-colors relative ${
                    isActive
                      ? "bg-[#1a202a] border-l-2 border-l-amber-400"
                      : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2.5 px-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
