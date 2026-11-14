"use client";
import React from "react";
import { ExperimentRecord } from "@/types/evidence";
import { VisualExperimentPackage } from "@/types/visualization";
import { Activity, ExternalLink } from "lucide-react";

export function VisualComparison({
  exp1,
  exp2,
  visualPkg1,
  visualPkg2,
}: {
  exp1: ExperimentRecord;
  exp2: ExperimentRecord;
  visualPkg1?: VisualExperimentPackage;
  visualPkg2?: VisualExperimentPackage;
}) {
  const number = (v: number | null | undefined, unit: string) =>
    v == null ? "Not reported" : `${v} ${unit}`;

  const render = (exp: ExperimentRecord, pkg?: VisualExperimentPackage) => {
    // Look for verified image/schematic/frame asset
    const asset = pkg?.assets.find(
      (a) =>
        a.experimentId === exp.id &&
        a.localPath &&
        (a.format === "image" || a.format === "frames" || a.format === "svg")
    );

    const rows = [
      ["Material", exp.material],
      ["Gravity", exp.gravity],
      ["Oxygen", number(exp.oxygen_pct, "%")],
      ["Airflow", number(exp.airflow_cm_s, "cm/s")],
      ["Pressure", number(exp.pressure_kpa, "kPa")],
      ["Platform", exp.platform],
      ["Measurements", exp.measurements.join(", ").replaceAll("_", " ")],
    ];

    return (
      <section className="studio-panel p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-base">{exp.investigation}</h2>
          <p className="text-xs text-[#9EA2A7] mt-1">
            {exp.programme} · {exp.platform}
          </p>
        </div>

        {asset?.localPath ? (
          <div className="bg-black rounded-lg p-2 border border-[#303134]">
            <img
              src={asset.localPath}
              alt={`${exp.investigation} NASA media`}
              className="w-full h-52 object-contain rounded"
            />
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <span className="text-[#9EA2A7] text-[11px] truncate max-w-[260px]">
                {asset.title}
              </span>
              <a
                href={asset.locator?.url || exp.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#DDA36B] inline-flex items-center gap-1 hover:underline shrink-0"
              >
                Source <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ) : (
          <div className="h-52 rounded-lg bg-[#0B0C0E] border border-[#303134] flex flex-col items-center justify-center p-4 text-center space-y-2">
            <Activity className="w-6 h-6 text-[#737F8C]" />
            <span className="text-xs font-semibold text-[#F3F2EF]">
              Sensor-Instrumented Run (Telemetry Only)
            </span>
            <p className="text-[11px] text-[#9EA2A7] max-w-xs leading-relaxed">
              NASA documented this flight run using radiometer, thermocouple, and gas arrays rather than public camera footage.
            </p>
            <a
              href={exp.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#DDA36B] hover:underline inline-flex items-center gap-1 mt-1"
            >
              Inspect NASA scientific record <ExternalLink size={11} />
            </a>
          </div>
        )}

        <dl>
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-2 gap-3 border-b border-[#303134] py-2 text-xs"
            >
              <dt className="text-[#9EA2A7]">{k}</dt>
              <dd className="font-medium text-[#F3F2EF]">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-[#9EA2A7] leading-5">{exp.finding}</p>
        <a
          href={exp.source_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#DDA36B] inline-flex items-center gap-1 hover:underline"
        >
          Original NASA source <ExternalLink size={12} />
        </a>
      </section>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#9EA2A7]">
        Conditions, geometry and measurement definitions may differ. Matching labels alone do not establish scientific comparability; check each source.
      </p>
      <div className="grid lg:grid-cols-2 gap-4">
        {render(exp1, visualPkg1)}
        {render(exp2, visualPkg2)}
      </div>
    </div>
  );
}
