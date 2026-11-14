"use client";

import React, { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, Info } from "lucide-react";
import { ExperimentRecord, SearchQuery } from "../types/evidence";
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
}: ComparisonTableProps) {
  const data = useMemo<TableRowData[]>(() => {
    return records.map((record) => ({
      record,
      assessment: assessApplicability(record, query),
    }));
  }, [records, query]);

  const columns = useMemo<ColumnDef<TableRowData>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedIds.size === records.length && records.length > 0}
              onChange={() => {
                if (selectedIds.size === records.length) {
                  onClearSelection();
                } else {
                  onSelectAll();
                }
              }}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5 cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(row.original.record.id)}
              onChange={() => onToggleSelect(row.original.record.id)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5 cursor-pointer"
            />
          </div>
        ),
        size: 32,
      },
      {
        accessorKey: "investigation",
        header: "Investigation & Platform",
        cell: ({ row }) => {
          const rec = row.original.record;
          const isActive = rec.id === activeId;
          return (
            <div className="text-left font-mono">
              <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                <span className="truncate max-w-[170px]">{rec.investigation}</span>
                {isActive && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-400/20 text-amber-300 rounded border border-amber-400/40 font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[190px]">
                {rec.platform} • <span className="text-slate-300">{rec.programme}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "conditions",
        header: "Physical Conditions",
        cell: ({ row }) => {
          const rec = row.original.record;
          return (
            <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
              <div>
                <span className="text-slate-400">O₂:</span>{" "}
                <span className="text-cyan-400 font-semibold">
                  {rec.oxygen_pct != null ? `${rec.oxygen_pct}%` : "—"}
                </span>
                {" | "}
                <span className="text-slate-400">Flow:</span>{" "}
                <span className="text-cyan-400 font-semibold">
                  {rec.airflow_cm_s != null ? `${rec.airflow_cm_s} cm/s` : "0"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                <span>{rec.pressure_kpa != null ? `${rec.pressure_kpa} kPa` : "—"}</span>
                {" • "}
                <span>{rec.material}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "applicability",
        header: "Applicability",
        cell: ({ row }) => {
          const { assessment } = row.original;
          const verdict = assessment.verdict;

          let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
          let Icon = Info;

          if (verdict === "EXACT_MATCH") {
            badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
            Icon = CheckCircle2;
          } else if (verdict === "CONDITION_VARIANCE") {
            badgeColor = "bg-amber-500/10 text-amber-300 border-amber-500/30";
            Icon = AlertTriangle;
          } else if (verdict === "UNKNOWN_CONDITIONS") {
            badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
            Icon = HelpCircle;
          } else if (verdict === "UNSUPPORTED") {
            badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
            Icon = XCircle;
          }

          return (
            <div className="font-mono" title={assessment.differences.join("\n") || assessment.reasons.join("\n")}>
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${badgeColor}`}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{assessment.verdictLabel}</span>
              </span>
            </div>
          );
        },
      },
    ],
    [activeId, selectedIds, records.length, onClearSelection, onSelectAll, onToggleSelect]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (records.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-xl">
        <Info className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-xs font-mono text-slate-400">No indexed investigations match this inquiry.</p>
        <p className="text-[11px] text-slate-400 mt-1">Try loosening physical filters or search keywords.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-md">
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-2.5 font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
            {table.getRowModel().rows.map((row) => {
              const rec = row.original.record;
              const isActive = rec.id === activeId;
              const isSelected = selectedIds.has(rec.id);

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectActive(rec.id)}
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? "bg-amber-500/10 hover:bg-amber-500/15"
                      : isSelected
                      ? "bg-slate-900/70 hover:bg-slate-900"
                      : "hover:bg-slate-900/40"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2.5 align-middle">
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
