"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { ExperimentRecord } from "@/types/evidence";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Search, Scale } from "lucide-react";

interface MasterTableProps {
  data: ExperimentRecord[];
  selectedForCompare: string[];
  onToggleCompare: (id: string) => void;
}

export function MasterComparisonTable({
  data,
  selectedForCompare,
  onToggleCompare,
}: MasterTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "airflow_cm_s", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<ExperimentRecord>[]>(
    () => [
      {
        id: "select",
        header: "Compare",
        cell: ({ row }) => {
          const id = row.original.id;
          const isSelected = selectedForCompare.includes(id);
          return (
            <button
              onClick={() => onToggleCompare(id)}
              className={`p-1.5 rounded text-xs font-semibold border transition ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
              title="Select for 2-way comparison"
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          );
        },
      },
      {
        accessorKey: "investigation",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold text-slate-300 hover:text-white"
          >
            Investigation
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-white block">{row.original.investigation}</span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {row.original.programme} · {row.original.platform}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "material",
        header: "Material / Fuel",
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-slate-200 block">{row.original.material}</span>
            <span className="text-[10px] text-slate-400 capitalize">{row.original.material_class.replace("_", " ")}</span>
          </div>
        ),
      },
      {
        accessorKey: "oxygen_pct",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold text-slate-300 hover:text-white"
          >
            O₂ %
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-amber-300">
            {row.original.oxygen_pct}%
          </span>
        ),
      },
      {
        accessorKey: "airflow_cm_s",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold text-slate-300 hover:text-white"
          >
            Airflow
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-cyan-300">
            {row.original.airflow_cm_s} cm/s
          </span>
        ),
      },
      {
        accessorKey: "pressure_kpa",
        header: "Pressure",
        cell: ({ row }) => (
          <span className="font-mono text-slate-300">
            {row.original.pressure_kpa != null ? `${row.original.pressure_kpa} kPa` : "Unreported"}
          </span>
        ),
      },
      {
        accessorKey: "measurements",
        header: "Target Measurements",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {row.original.measurements.slice(0, 3).map((m, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
              >
                {m.replace("_", " ")}
              </span>
            ))}
            {row.original.measurements.length > 3 && (
              <span className="text-[10px] text-slate-500">
                +{row.original.measurements.length - 3}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "source",
        header: "NASA Source",
        cell: ({ row }) => (
          <a
            href={row.original.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium text-[11px]"
          >
            {row.original.psi_id || "Citation"}
            <ExternalLink className="w-3 h-3" />
          </a>
        ),
      },
    ],
    [selectedForCompare, onToggleCompare]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Search and Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Multi-Experiment Master Comparison Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive TanStack Table: Click column headers to sort by airflow, oxygen, or pressure.
          </p>
        </div>

        <div className="relative w-64">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Filter experiments..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition pl-8"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-950 text-slate-400">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 font-semibold uppercase tracking-wider text-[11px]">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/40 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Showing {table.getRowModel().rows.length} indexed NASA investigations</span>
        <span>Click the scale icon to select any 2 investigations for deep comparison</span>
      </div>
    </div>
  );
}
