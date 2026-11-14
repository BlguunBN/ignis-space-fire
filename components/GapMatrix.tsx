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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E99847]/10 text-[#E99847] border border-[#E99847]/30">
            <AlertCircle className="w-3 h-3" />
            Single Record (1)
          </span>
        );
      case "NO_INDEXED_EVIDENCE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#303741]/40 text-[#A1AAB5] border border-[#303741]">
            <HelpCircle className="w-3 h-3" />
            No Indexed Evidence (0)
          </span>
        );
    }
  };

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#303741]">
        <div>
          <h3 className="text-base font-bold text-[#F3F5F7] flex items-center gap-2">
            Evidence Coverage of Indexed NASA Corpus
          </h3>
          <p className="text-xs text-[#A1AAB5] mt-0.5 max-w-2xl">
            Computed dynamically across {coverageData.totalRecords} indexed NASA flight records. Evaluates available evidence for crew habitat material classes.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[#5CB59B] font-semibold">
            {coverageData.summary.coveredBins} Bins Covered
          </span>
          <span className="text-[#737F8C]">|</span>
          <span className="text-[#A1AAB5]">
            {coverageData.summary.emptyBins} Unindexed Regimes
          </span>
        </div>
      </div>

      {/* Scientific Caution */}
      <div className="bg-[#0C0F13] p-3 rounded-lg border border-[#303741] text-xs text-[#A1AAB5] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#E99847] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#F3F5F7]">Scientific Integrity Rule:</strong> A count of zero indicates <span className="text-[#E99847] font-semibold">no verified records in this workspace&apos;s indexed corpus</span>. It does <strong className="text-[#F3F5F7]">not</strong> imply that NASA has never tested this condition terrestrial or orbital flammability research.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#303741]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#303741] bg-[#15191F] text-[#A1AAB5] uppercase text-[10px] font-semibold">
              <th className="py-2.5 px-3">Target Material Class</th>
              <th className="py-2.5 px-3">Atmosphere Regime</th>
              <th className="py-2.5 px-3">Airflow Regime</th>
              <th className="py-2.5 px-3">Indexed Evidence</th>
              <th className="py-2.5 px-3">Corpus Annotation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#303741]/50 text-[#F3F5F7]">
            {coverageData.cells.map((cell, idx) => (
              <tr key={idx} className="hover:bg-[#15191F]/40 transition">
                <td className="py-2.5 px-3 font-medium text-white">{cell.materialClass}</td>
                <td className="py-2.5 px-3 text-[#A1AAB5]">{cell.atmosphereRegime}</td>
                <td className="py-2.5 px-3 text-[#A1AAB5]">{cell.airflowRegime}</td>
                <td className="py-2.5 px-3">{getStatusBadge(cell.status, cell.count)}</td>
                <td className="py-2.5 px-3 text-[#A1AAB5] text-[11px] leading-snug">{cell.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
