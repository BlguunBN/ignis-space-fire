"use client";

import React, { useState } from "react";
import { VisualExperimentPackage, VisualScene } from "@/types/visualization";
import { FrameSequencePlayer } from "@/components/experiment/FrameSequencePlayer";
import { ExperimentApparatusDiagram } from "@/components/experiment/ExperimentApparatusDiagram";
import { ConditionInspector } from "@/components/experiment/ConditionInspector";
import { ExperimentRecord } from "@/types/evidence";
import { ExternalLink, CheckCircle2, ChevronRight, Layers, Compass, Camera, FileCheck2, ShieldAlert } from "lucide-react";

interface PaperVisualStoryboardProps {
  pkg: VisualExperimentPackage;
  experiment: ExperimentRecord;
}

export function PaperVisualStoryboard({ pkg, experiment }: PaperVisualStoryboardProps) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(1); // Default to observation (Scene 2)

  const scenes = pkg.scenes;
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  const getSceneIcon = (kind: VisualScene["kind"]) => {
    switch (kind) {
      case "setup":
        return <Compass className="w-3.5 h-3.5 text-[#E99847]" />;
      case "observation":
        return <Camera className="w-3.5 h-3.5 text-[#5CB59B]" />;
      case "findings":
        return <FileCheck2 className="w-3.5 h-3.5 text-[#78A9D8]" />;
      case "limitations":
        return <ShieldAlert className="w-3.5 h-3.5 text-[#D97777]" />;
    }
  };

  const sequenceAsset = pkg.assets.find((a) => a.id === "sofie-rtdfs-sequence");
  const stillAsset = pkg.assets.find((a) => a.id === "sofie-pmma-still");

  return (
    <div className="space-y-5 text-xs">
      {/* Storyboard Step Navigator Bar */}
      <div className="bg-[#1B2027] border border-[#303741] p-2 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {scenes.map((scene, idx) => {
            const isActive = activeSceneIndex === idx;
            return (
              <button
                key={scene.id}
                onClick={() => setActiveSceneIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-[#0C0F13] text-[#F3F5F7] border border-[#E99847] font-semibold"
                    : "text-[#A1AAB5] hover:text-[#F3F5F7] hover:bg-[#15191F]"
                }`}
              >
                <span>{getSceneIcon(scene.kind)}</span>
                <span>{scene.title}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-[#737F8C] px-2 hidden sm:inline">
          Verified Scene {activeSceneIndex + 1} of {scenes.length}
        </span>
      </div>

      {/* Main Studio 60 / 40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 60% Visual Evidence Viewer */}
        <div className="lg:col-span-7 space-y-4">
          {currentScene.kind === "setup" && <ExperimentApparatusDiagram />}

          {currentScene.kind === "observation" && sequenceAsset && (
            <FrameSequencePlayer asset={sequenceAsset} />
          )}

          {(currentScene.kind === "findings" || currentScene.kind === "limitations") && stillAsset && (
            <div className="bg-[#1B2027] border border-[#303741] rounded-xl overflow-hidden p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#303741]">
                <span className="font-bold text-[#F3F5F7] text-sm">
                  {stillAsset.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0C0F13] text-[#5CB59B] border border-[#5CB59B]/40">
                  Original Flight Snapshot
                </span>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-[#303741]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stillAsset.localPath}
                  alt={stillAsset.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px] text-[#A1AAB5] flex items-center justify-between font-mono pt-1">
                <span>Credit: {stillAsset.nasaCredit}</span>
                <a
                  href={stillAsset.locator.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#78A9D8] hover:text-[#F3F5F7] flex items-center gap-1"
                >
                  Source Record
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Current Scene Context Caption */}
          <div className="bg-[#15191F] border border-[#303741] p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-[#E99847] tracking-wider">
                Scientific Narrative & Observation
              </span>
              <span className="text-[10px] text-[#5CB59B] flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> reviewed by team
              </span>
            </div>
            <p className="text-[#F3F5F7] text-xs leading-relaxed">{currentScene.caption}</p>
          </div>
        </div>

        {/* Right 40% Evidence & Provenance Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <ConditionInspector experiment={experiment} />
        </div>
      </div>
    </div>
  );
}
