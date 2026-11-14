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
import { ArrowUpDown, ExternalLink, Search, Scale } from "lucide-react";

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
              className={`p-1.5 rounded text-xs font-semibold border transition cursor-pointer ${
                isSelected
                  ? "bg-[#E99847] text-[#0C0F13] border-[#E99847]"
                  : "bg-[#0C0F13] text-[#A1AAB5] border-[#303741] hover:text-[#F3F5F7]"
              }`}
              title="Select for comparison tray"
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
            className="flex items-center gap-1 font-bold text-[#A1AAB5] hover:text-[#F3F5F7] cursor-pointer"
          >
            Investigation
            <ArrowUpDown className="w-3 h-3 text-[#737F8C]" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-[#F3F5F7] block">{row.original.investigation}</span>
            <span className="text-[10px] text-[#78A9D8] font-mono">
              {row.original.programme} · {row.original.platform}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "material",
        header: "Material / Class",
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-[#F3F5F7] block">{row.original.material}</span>
            <span className="text-[10px] text-[#737F8C] capitalize font-mono">
              {row.original.material_class.replace("_", " ")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "oxygen_pct",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold text-[#A1AAB5] hover:text-[#F3F5F7] cursor-pointer"
          >
            O₂ %
            <ArrowUpDown className="w-3 h-3 text-[#737F8C]" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[#E99847]">
            {row.original.oxygen_pct != null ? `${row.original.oxygen_pct}%` : "Not reported"}
          </span>
        ),
      },
      {
        accessorKey: "airflow_cm_s",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 font-bold text-[#A1AAB5] hover:text-[#F3F5F7] cursor-pointer"
          >
            Airflow
            <ArrowUpDown className="w-3 h-3 text-[#737F8C]" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[#78A9D8]">
            {row.original.airflow_cm_s != null ? `${row.original.airflow_cm_s} cm/s` : "Not reported"}
          </span>
        ),
      },
      {
        accessorKey: "pressure_kpa",
        header: "Pressure",
        cell: ({ row }) => (
          <span className="font-mono text-[#A1AAB5]">
            {row.original.pressure_kpa != null ? `${row.original.pressure_kpa} kPa` : "Not reported"}
          </span>
        ),
      },
      {
        accessorKey: "measurements",
        header: "Measurements",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {row.original.measurements.slice(0, 3).map((m, i) => (
              <span
                key={i}
                className="text-[9px] px-1.5 py-0.5 rounded bg-[#0C0F13] text-[#A1AAB5] border border-[#303741] font-mono"
              >
                {m.replace("_", " ")}
              </span>
            ))}
            {row.original.measurements.length > 3 && (
              <span className="text-[9px] text-[#737F8C] font-mono">
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
            className="text-[#78A9D8] hover:text-[#F3F5F7] inline-flex items-center gap-1 font-medium text-[11px]"
          >
            {row.original.psi_id || "Source"}
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
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 shadow-sm space-y-4">
      {/* Search and Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#303741]">
        <div>
          <h3 className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
            Multi-Experiment Master Comparison Matrix
          </h3>
          <p className="text-xs text-[#A1AAB5] mt-0.5">
            Interactive TanStack Table: Click column headers to sort by airflow, oxygen, or pressure.
          </p>
        </div>

        <div className="relative w-64">
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search within matrix..."
            className="w-full bg-[#0C0F13] border border-[#303741] rounded-lg px-3 py-1.5 text-xs text-[#F3F5F7] placeholder-[#737F8C] focus:outline-none focus:border-[#E99847] transition pl-8"
          />
          <Search className="w-3.5 h-3.5 text-[#737F8C] absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-[#303741] bg-[#0C0F13]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#303741] bg-[#15191F] text-[#737F8C]">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-2.5 font-semibold uppercase tracking-wider text-[10px] font-mono">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#303741]/50 text-[#F3F5F7]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#15191F]/50 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[#737F8C] pt-1">
        <span>Showing {table.getRowModel().rows.length} indexed NASA flight investigations</span>
        <span>Click scale icon to compare any 2 records</span>
      </div>
    </div>
  );
}
