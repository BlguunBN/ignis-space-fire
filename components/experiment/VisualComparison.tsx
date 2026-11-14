"use client";
import React from "react";
import { ExperimentRecord } from "@/types/evidence";
import { VisualExperimentPackage } from "@/types/visualization";
export function VisualComparison({ exp1, exp2, visualPkg1, visualPkg2 }: { exp1: ExperimentRecord; exp2: ExperimentRecord; visualPkg1?: VisualExperimentPackage; visualPkg2?: VisualExperimentPackage }) {
  const number = (v: number | null | undefined, unit: string) => v == null ? "Not reported" : `${v} ${unit}`;
  const render = (exp: ExperimentRecord, pkg?: VisualExperimentPackage) => {
    const image = pkg?.assets.find(a => a.experimentId === exp.id && a.id === "sofie-pmma-still" && a.localPath);
    const rows = [["Material",exp.material],["Gravity",exp.gravity],["Oxygen",number(exp.oxygen_pct,"%")],["Airflow",number(exp.airflow_cm_s,"cm/s")],["Pressure",number(exp.pressure_kpa,"kPa")],["Platform",exp.platform],["Measurements",exp.measurements.join(", ").replaceAll("_"," ")]];
    return <section className="studio-panel p-4 space-y-4"><div><h2 className="font-semibold">{exp.investigation}</h2><p className="text-xs text-[#9EA2A7] mt-1">{exp.programme} · {exp.platform}</p></div>{image ? <div className="bg-black rounded-lg"><img src={image.localPath} alt={`${exp.investigation} NASA image`} className="w-full h-52 object-contain"/><a href={image.locator.url} target="_blank" rel="noreferrer" className="text-xs text-[#DDA36B]">NASA imagery source ↗</a></div> : <div className="h-52 rounded-lg bg-[#0B0C0E] flex items-center justify-center text-xs text-[#9EA2A7]">No source-matched imagery available</div>}<dl>{rows.map(([k,v])=><div key={k} className="grid grid-cols-2 gap-3 border-b border-[#303134] py-2 text-xs"><dt className="text-[#9EA2A7]">{k}</dt><dd>{v}</dd></div>)}</dl><p className="text-xs text-[#9EA2A7] leading-5">{exp.finding}</p><a href={exp.source_url} target="_blank" rel="noreferrer" className="text-xs text-[#DDA36B]">Original source ↗</a></section>;
  };
  return <div className="space-y-4"><p className="text-sm text-[#9EA2A7]">Conditions, geometry and measurement definitions may differ. Matching labels alone do not establish scientific comparability; check each source.</p><div className="grid lg:grid-cols-2 gap-4">{render(exp1,visualPkg1)}{render(exp2,visualPkg2)}</div></div>;
}
