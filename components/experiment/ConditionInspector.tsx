"use client";
import React from "react";
import { ExperimentRecord } from "@/types/evidence";
export function ConditionInspector({ experiment }: {experiment: ExperimentRecord}) {
  const value = (n: number | null | undefined, unit: string) => n == null ? "Not reported" : `${n} ${unit}`;
  const conditions = [["Investigation",experiment.investigation],["Material",experiment.material],["Gravity",experiment.gravity],["Oxygen",value(experiment.oxygen_pct,"%")],["Airflow",value(experiment.airflow_cm_s,"cm/s")],["Pressure",value(experiment.pressure_kpa,"kPa")],["Platform",experiment.platform],["Record status",experiment.verification_status.replace("_"," ")]];
  return <section className="studio-panel p-4"><h2 className="font-semibold pb-3 border-b border-[#303134]">Experiment details</h2><dl className="mt-2">{conditions.map(([label,content]) => <div key={label} className="grid grid-cols-2 gap-2 py-2 text-xs border-b border-[#303134]/50"><dt className="text-[#9EA2A7]">{label}</dt><dd className="break-words">{content}</dd></div>)}</dl></section>;
}
