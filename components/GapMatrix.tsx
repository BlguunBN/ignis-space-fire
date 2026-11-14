"use client";

import React, { useMemo } from "react";
import { computeEvidenceCoverage } from "@/lib/coverage";
import { ExperimentRecord } from "@/types/evidence";
import { CheckCircle2, AlertCircle, HelpCircle, ShieldAlert } from "lucide-react";

interface GapMatrixProps {
  experiments: ExperimentRecord[];
}

export function GapMatrix({ experiments }: GapMatrixProps) {
  const coverageData = useMemo(() => computeEvidenceCoverage(experiments), [experiments]);

  const getStatusBadge = (status: "ADEQUATE" | "LIMITED" | "NO_INDEXED_EVIDENCE", count: number) => {
    switch (status) {
      case "ADEQUATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#5CB59B]/10 text-[#5CB59B] border border-[#5CB59B]/30">
            <CheckCircle2 className="w-3 h-3" />
            Verified ({count})
          </span>
        );
      case "LIMITED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#d7ab80]/10 text-[#d7ab80] border border-[#E99847]/30">
            <AlertCircle className="w-3 h-3" />
            Single Record (1)
          </span>
        );
      case "NO_INDEXED_EVIDENCE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#303741]/40 text-[#a6a8aa] border border-[#2c2d30]">
            <HelpCircle className="w-3 h-3" />
            No Indexed Evidence (0)
          </span>
        );
    }
  };

  return (
    <div className="bg-[#151618] border border-[#2c2d30] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2c2d30]">
        <div>
          <h3 className="text-base font-bold text-[#f2f1ed] flex items-center gap-2">
            Evidence Coverage of Indexed NASA Corpus
          </h3>
          <p className="text-xs text-[#a6a8aa] mt-0.5 max-w-2xl">
            Computed dynamically across {coverageData.totalRecords} indexed NASA flight records. Evaluates available evidence for crew habitat material classes.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[#5CB59B] font-semibold">
            {coverageData.summary.coveredBins} Bins Covered
          </span>
          <span className="text-[#8c8e91]">|</span>
          <span className="text-[#a6a8aa]">
            {coverageData.summary.emptyBins} Unindexed Regimes
          </span>
        </div>
      </div>

      {/* Scientific Caution */}
      <div className="bg-[#0e0f11] p-3 rounded-lg border border-[#2c2d30] text-xs text-[#a6a8aa] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#d7ab80] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#f2f1ed]">Scientific Integrity Rule:</strong> A count of zero indicates <span className="text-[#d7ab80] font-semibold">no verified records in this workspace&apos;s indexed corpus</span>. It does <strong className="text-[#f2f1ed]">not</strong> imply that NASA has never tested this condition terrestrial or orbital flammability research.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#2c2d30]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2c2d30] bg-[#101113] text-[#a6a8aa] uppercase text-[10px] font-semibold">
              <th className="py-2.5 px-3">Target Material Class</th>
              <th className="py-2.5 px-3">Atmosphere Regime</th>
              <th className="py-2.5 px-3">Airflow Regime</th>
              <th className="py-2.5 px-3">Indexed Evidence</th>
              <th className="py-2.5 px-3">Corpus Annotation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#303741]/50 text-[#f2f1ed]">
            {coverageData.cells.map((cell, idx) => (
              <tr key={idx} className="hover:bg-[#101113]/40 transition">
                <td className="py-2.5 px-3 font-medium text-white">{cell.materialClass}</td>
                <td className="py-2.5 px-3 text-[#a6a8aa]">{cell.atmosphereRegime}</td>
                <td className="py-2.5 px-3 text-[#a6a8aa]">{cell.airflowRegime}</td>
                <td className="py-2.5 px-3">{getStatusBadge(cell.status, cell.count)}</td>
                <td className="py-2.5 px-3 text-[#a6a8aa] text-[11px] leading-snug">{cell.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
