"use client";

import React, { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Info } from "lucide-react";
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
        header: "Investigation & Platform",
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
        header: "Physical Conditions",
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
              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
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
        header: "Applicability",
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
    [activeId, selectedIds, records.length, onClearSelection, onSelectAll, onToggleSelect]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (records.length === 0) {
    return (
      <div className="p-8 text-center bg-[#0c0f14] border border-white/[0.08] rounded-lg">
        <Info className="w-5 h-5 text-slate-500 mx-auto mb-2" />
        <p className="text-xs font-mono text-slate-300">No indexed investigations match this inquiry.</p>
        <p className="text-[11px] text-slate-500 mt-1">Try loosening physical filters or keywords.</p>
      </div>
    );
  }

  return (
    <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-[#0c0f14]">
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#13171e] text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-white/[0.08]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-2 px-2.5 font-medium">
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
                    <td key={cell.id} className="py-2.5 px-2.5 align-middle">
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
