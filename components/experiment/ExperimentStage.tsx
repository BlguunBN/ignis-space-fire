"use client";

import { useState } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, ExternalLink, FileText, FlaskConical, Info, Layers3, MoveRight, PlayCircle } from "lucide-react";
import type { ExperimentRecord } from "@/types/evidence";

type ViewMode = "apparatus" | "behavior";
interface ExperimentStageProps {
  experiment: ExperimentRecord;
  onNext?: () => void;
  onPrevious?: () => void;
  onCompare?: () => void;
  selectedForCompare?: boolean;
}

function value(value: number | null | undefined, unit: string) {
  return value === null || value === undefined ? "Not reported" : String(value) + unit;
}

function ExperimentSchematic({ mode, programme }: { mode: ViewMode; programme: string }) {
  const isDroplet = programme.toLowerCase().includes("flex");
  const isSmoke = programme.toLowerCase().includes("same");
  return (
    <div className="relative flex h-full min-h-[265px] items-center justify-center overflow-hidden bg-[#0e1012]">
      <div className="ignis-stage-grid pointer-events-none absolute inset-0 opacity-70" />
      <svg viewBox="0 0 620 340" role="img" aria-label={mode === "apparatus" ? "Conceptual microgravity experimental chamber schematic" : "Qualitative illustration of a microgravity combustion observation"} className="relative h-full min-h-[265px] w-full max-w-[840px]">
        <defs>
          <linearGradient id="chamber" x1="0" x2="1"><stop offset="0" stopColor="#272d32"/><stop offset=".5" stopColor="#121619"/><stop offset="1" stopColor="#2a2f34"/></linearGradient>
          <radialGradient id="flame" cx=".5" cy=".63" r=".55"><stop offset="0" stopColor="#f7d3aa" stopOpacity=".95"/><stop offset=".36" stopColor="#bb9467" stopOpacity=".80"/><stop offset=".65" stopColor="#6e89ad" stopOpacity=".55"/><stop offset="1" stopColor="#6083ba" stopOpacity="0"/></radialGradient>
          <linearGradient id="side" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#71767b"/><stop offset="1" stopColor="#222629"/></linearGradient>
        </defs>
        <g opacity=".75">
          <line x1="70" y1="300" x2="560" y2="300" stroke="#45484a" strokeWidth="1" />
          <line x1="310" y1="22" x2="310" y2="315" stroke="#464a4b" strokeDasharray="3 8" opacity=".35"/>
        </g>
        <rect x="164" y="45" width="292" height="244" rx="12" fill="url(#chamber)" stroke="#676b70" strokeWidth="2" />
        <rect x="179" y="59" width="262" height="216" rx="5" fill="#090c10" stroke="#3d4348"/>
        <rect x="169" y="48" width="282" height="4" fill="#5b6063" opacity=".4"/>
        {[[173,55],[448,55],[173,282],[448,282]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill="#9a9b96" />)}
        {mode === "apparatus" ? (
          <>
            <rect x="291" y="217" width="38" height="15" rx="2" fill="#c7b99f"/>
            <rect x="285" y="232" width="50" height="10" rx="2" fill="#606a70"/>
            <path d={isDroplet ? "M309 194 C280 180 283 146 310 130 C336 149 339 182 309 194Z" : "M308 218 C279 197 288 169 307 144 C324 169 338 193 308 218Z"} fill="url(#flame)" opacity=".9"/>
            {isSmoke && <g stroke="#a1abb8" strokeWidth="1" fill="none" opacity=".55"><path d="M296 163 C278 142 305 137 290 111"/><path d="M316 151 C337 134 308 121 330 102"/></g>}
            <path d="M70 159 H151" stroke="#9eaaa8" strokeWidth="2" strokeDasharray="6 7"/>
            <path d="M146 153 L154 159 L146 165" stroke="#9eaaa8" fill="none" strokeWidth="2"/>
            <text x="70" y="137" fontSize="11" fill="#a7a8a5">Airflow path</text>
            <path d="M458 177 H555" stroke="#87919a" strokeWidth="1"/>
            <text x="467" y="164" fontSize="10" fill="#a7a8a5">Observation</text>
            <text x="467" y="177" fontSize="10" fill="#a7a8a5">window</text>
            <path d="M309 249 V301 H393" stroke="#7f8588" strokeWidth="1" fill="none"/>
            <text x="400" y="303" fontSize="10" fill="#a7a8a5">Fuel sample</text>
            <text x="310" y="91" fontSize="11" fill="#9fa4a8" textAnchor="middle">CHAMBER CONCEPT</text>
          </>
        ) : (
          <>
            <ellipse cx="310" cy="187" rx={isDroplet?53:72} ry={isDroplet?62:70} fill="url(#flame)" opacity=".85"/>
            <rect x="281" y="231" width="58" height="8" rx="2" fill="#a59d8a" />
            <g stroke="#969da3" strokeWidth="1" strokeDasharray="3 5" fill="none" opacity=".8">
              <ellipse cx="310" cy="186" rx="84" ry="79"/>
              <path d="M310 95V277M205 185H415"/>
            </g>
            <text x="310" y="89" fontSize="11" fill="#abb1b3" textAnchor="middle">ILLUSTRATIVE FLAME REGION</text>
            <text x="310" y="264" fontSize="11" fill="#a5adaf" textAnchor="middle">Not experimental imagery</text>
          </>
        )}
        <text x="168" y="27" fontSize="10" fill="#8e9599" letterSpacing="2">MICROGRAVITY · CONCEPT DIAGRAM</text>
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-[#414245] bg-[#17191c]/95 px-2 py-1 text-[10px] text-[#b9bbbd]">Illustrative schematic · not NASA footage</div>
    </div>
  );
}

export function ExperimentStage({ experiment, onNext, onPrevious, onCompare, selectedForCompare }: ExperimentStageProps) {
  const [view, setView] = useState<ViewMode>("apparatus");
  return (
    <section className="ignis-panel overflow-hidden" aria-label="Selected experiment">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[#e2ad73]"/>
          <span className="text-xs font-semibold tracking-wide text-[#e9e9e7]">Experiment workspace</span>
          <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-[#aaaead]">{experiment.programme}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => setView("apparatus")} className={"rounded-md px-3 py-1.5 text-[11px] " + (view==="apparatus"?"bg-[#333436] text-white":"text-[#8d9091] hover:text-white")}>Setup</button>
          <button type="button" onClick={() => setView("behavior")} className={"rounded-md px-3 py-1.5 text-[11px] " + (view==="behavior"?"bg-[#333436] text-white":"text-[#8d9091] hover:text-white")}>Flame concept</button>
          <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block"/>
          <button type="button" onClick={onPrevious} aria-label="Previous experiment" className="rounded-md p-2 text-[#a8a8a8] hover:bg-white/10 hover:text-white"><ChevronLeft className="h-4 w-4"/></button>
          <button type="button" onClick={onNext} aria-label="Next experiment" className="rounded-md p-2 text-[#a8a8a8] hover:bg-white/10 hover:text-white"><ChevronRight className="h-4 w-4"/></button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,.75fr)]">
        <ExperimentSchematic mode={view} programme={experiment.programme}/>
        <div className="flex flex-col border-t border-white/10 bg-[#151618] p-5 xl:border-l xl:border-t-0">
          <span className="ignis-kicker">SELECTED INVESTIGATION</span>
          <h3 className="mt-2 text-xl font-medium leading-tight text-[#f1ede7]">{experiment.investigation}</h3>
          <div className="mt-2 text-xs leading-relaxed text-[#999c9e]">{experiment.platform}</div>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
            {[
              ["Material", experiment.material],
              ["Gravity", experiment.gravity.replace("_", " ")],
              ["Oxygen", value(experiment.oxygen_pct, "%")],
              ["Airflow", value(experiment.airflow_cm_s, " cm/s")],
              ["Pressure", value(experiment.pressure_kpa, " kPa")],
              ["Evidence", experiment.verification_status.replace("_", " ")]
            ].map(([label,text]) => (
              <div key={label} className="min-w-0 border-t border-white/10 pt-2">
                <dt className="text-[10px] uppercase tracking-wider text-[#818689]">{label}</dt>
                <dd className="mt-1 break-words text-xs text-[#e2e1dc]">{text}</dd>
              </div>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <a href={experiment.source_url} target="_blank" rel="noopener noreferrer" className="ignis-button ignis-button-primary inline-flex items-center gap-2">
              View NASA source <ArrowUpRight className="h-3.5 w-3.5"/>
            </a>
            {onCompare && <button type="button" onClick={onCompare} className="ignis-button inline-flex items-center gap-2">
              {selectedForCompare ? <Check className="h-3.5 w-3.5"/> : <Layers3 className="h-3.5 w-3.5"/>}
              {selectedForCompare ? "Selected" : "Add to compare"}
            </button>}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 border-t border-white/10 bg-[#101113] px-4 py-3 text-[11px] text-[#9a9b9e]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e2ad73]"/>
        <p>Visuals illustrate experimental geometry only. They are not reconstructions, source images or calculated flame predictions. Reported conditions and findings require verification against the linked publication.</p>
      </div>
    </section>
  );
}
