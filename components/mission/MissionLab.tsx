"use client";
import React, { useEffect, useRef, useState } from "react";
import { ImgComparisonSlider } from "@img-comparison-slider/react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ImageInspector } from "@/components/experiment/ImageInspector";
import { ResearchPapersList } from "@/components/papers/ResearchPapersList";
import { BookOpen } from "lucide-react";

const source = "https://svs.gsfc.nasa.gov/31394/#media_group_380278";
const steps = [
  { title: "Research context", text: "NASA studies combustion in microgravity to improve understanding of fire and spacecraft safety." },
  { title: "Setup", text: "NASA describes a thin fabric sheet burning in a quiescent chamber in microgravity." },
  { title: "Observation", text: "NASA reports periodic brightening and dimming; the published montage images are 0.2 seconds apart." },
  { title: "Limits", text: "The montage is imagery, not a calibrated measurement. Crop alignment and chronological order need independent review." },
  { title: "Original source", text: "Consult NASA's original image and caption for the investigation context." },
];
const nodes = steps.map((step, i) => ({ id: String(i), position: { x: i * 190, y: 20 }, data: { label: step.title }, draggable: false }));
const edges = steps.slice(1).map((_, i) => ({ id: `${i}-${i + 1}`, source: String(i), target: String(i + 1) }));
const outline = `# NASA thin-fabric observation\n## Context\n- Microgravity combustion research\n## Setup\n- Thin fabric sheet in a quiescent chamber\n## Observation\n- NASA describes periodic brightening and dimming\n- Montage images are 0.2 seconds apart\n## Limitations\n- Cropped tiles and their order require independent review\n- Imagery is not a quantitative measurement\n## Source\n- [NASA SVS 31394](${source})`;

function SourceMap() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let element: HTMLElement | undefined;
    import("@markmap/element").then(() => {
      if (!active || !container.current) return;
      element = document.createElement("markmap-view");
      element.setAttribute("theme", "minimal");
      element.setAttribute("color-scheme", "dark");
      element.setAttribute("toolbar", "");
      element.style.height = "340px";
      (element as HTMLElement & { markdown: string }).markdown = outline;
      container.current.appendChild(element);
    }).catch(() => {});
    return () => { active = false; element?.remove(); };
  }, []);
  return <><div ref={container}/><details className="text-sm text-[#9EA2A7]"><summary className="cursor-pointer">Accessible source outline</summary><ul className="list-disc pl-5 mt-3 space-y-1">{steps.map(step => <li key={step.title}><strong>{step.title}:</strong> {step.text}</li>)}</ul></details></>;
}

export function MissionLab() {
  const [step, setStep] = useState(0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Mission Lab</h1>
        <p className="text-sm text-[#9EA2A7] mt-2">
          Inspect NASA flight footage, visual comparative evidence, and peer-reviewed mission research papers.
        </p>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <section className="studio-panel p-4 space-y-3">
          <h2 className="font-semibold">NASA montage inspector</h2>
          <ImageInspector src="/nasa/rtdfs/nasa-montage.png" alt="NASA montage of thin fabric burning in microgravity"/>
          <p className="text-xs text-[#9EA2A7]">
            Original NASA montage; NASA states images are 0.2 seconds apart.{" "}
            <a href={source} target="_blank" rel="noreferrer" className="text-[#DDA36B]">NASA source ↗</a>
          </p>
        </section>
        <section className="studio-panel p-4 space-y-3">
          <h2 className="font-semibold">Compare montage tiles</h2>
          <p className="text-xs text-[#9EA2A7]">
            Two equally sized crops from the top row of the same NASA montage. Alignment and chronological order have not been independently reviewed; appearance is not a measurement.
          </p>
          <ImgComparisonSlider className="w-full" aria-label="Compare two NASA montage tiles">
            <img slot="first" src="/nasa/rtdfs/tile-1.png" alt="First tile in the top row of NASA's thin-fabric montage" style={{width:"100%"}}/>
            <img slot="second" src="/nasa/rtdfs/tile-2.png" alt="Second tile in the top row of NASA's thin-fabric montage" style={{width:"100%"}}/>
          </ImgComparisonSlider>
          <p className="text-xs text-[#9EA2A7]">
            Crops: original 1920 × 1080 montage, top row, x=272–547 and 547–822; y=0–180. NASA credit.{" "}
            <a href={source} target="_blank" rel="noreferrer" className="text-[#DDA36B]">Original image and caption ↗</a>
          </p>
        </section>
      </div>

      <section className="studio-panel p-4">
        <h2 className="font-semibold">Investigation path</h2>
        <p className="text-xs text-[#9EA2A7] mt-2">
          Select a step to read its source-backed context. Arrows show reading order, not scientific causation.
        </p>
        <div className="h-56 mt-3" aria-label="Investigation path diagram">
          <ReactFlow nodes={nodes} edges={edges} onNodeClick={(_, node) => setStep(Number(node.id))} nodesConnectable={false} nodesDraggable={false} fitView colorMode="dark">
            <Background/>
            <Controls showInteractive={false}/>
          </ReactFlow>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {steps.map((s,i) => (
            <button key={s.title} className="studio-link" aria-pressed={step===i} onClick={()=>setStep(i)}>
              {s.title}
            </button>
          ))}
        </div>
        <p className="text-sm mt-4">
          {steps[step].text}{" "}
          <a className="text-[#DDA36B]" href={source} target="_blank" rel="noreferrer">NASA source ↗</a>
        </p>
      </section>

      <section className="studio-panel p-4">
        <h2 className="font-semibold">NASA source outline</h2>
        <p className="text-xs text-[#9EA2A7] mt-2">
          A navigable outline of NASA's public image description, not a paper extraction.
        </p>
        <SourceMap/>
      </section>

      {/* NASA Mission Research Papers & Publications */}
      <section className="space-y-4 pt-4 border-t border-[#303134]">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#DDA36B]" />
            NASA Mission Research Papers & Publications
          </h2>
          <p className="text-xs text-[#9EA2A7] mt-1.5">
            Verified peer-reviewed scientific literature and NASA Technical Reports Server (NTRS) records supporting microgravity mission architecture, fire suppression protocols, and spacecraft safety standards.
          </p>
        </div>
        <ResearchPapersList />
      </section>
    </div>
  );
}
