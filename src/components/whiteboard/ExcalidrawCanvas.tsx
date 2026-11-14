"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Download, RotateCcw, Sparkles, Bot, Layers } from "lucide-react";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full min-h-[500px] flex items-center justify-center bg-[#0c0f14] text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Loading Excalidraw Freehand Canvas...</span>
        </div>
      </div>
    ),
  }
);

interface ExcalidrawCanvasProps {
  onExportBrief?: (elements: any) => void;
}

export function ExcalidrawCanvas({ onExportBrief }: ExcalidrawCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const handleReset = () => {
    if (excalidrawAPI) {
      excalidrawAPI.resetScene();
    }
  };

  // AI Agent: Insert Schematic Scaffolds into Freehand Canvas
  const handleInsertDropletSchematic = async () => {
    if (!excalidrawAPI) return;
    try {
      const rawElements = [
        {
          type: "rectangle",
          x: 150,
          y: 100,
          width: 400,
          height: 300,
          backgroundColor: "#1e293b",
          strokeColor: "#38bdf8",
          fillStyle: "solid",
          strokeWidth: 2,
          roughness: 1,
        },
        {
          type: "text",
          x: 165,
          y: 115,
          text: "NASA CIR Chamber (Quiescent 0g)",
          fontSize: 16,
          strokeColor: "#38bdf8",
        },
        {
          type: "ellipse",
          x: 320,
          y: 220,
          width: 60,
          height: 60,
          backgroundColor: "#0284c7",
          strokeColor: "#38bdf8",
          fillStyle: "solid",
        },
        {
          type: "ellipse",
          x: 290,
          y: 190,
          width: 120,
          height: 120,
          backgroundColor: "transparent",
          strokeColor: "#f59e0b",
          strokeWidth: 2,
          strokeStyle: "dashed",
        },
        {
          type: "text",
          x: 300,
          y: 320,
          text: "Spherical Flame Zone",
          fontSize: 12,
          strokeColor: "#f59e0b",
        },
        {
          type: "arrow",
          x: 180,
          y: 250,
          points: [[0, 0], [100, 0]],
          strokeColor: "#10b981",
          strokeWidth: 2,
        },
        {
          type: "text",
          x: 180,
          y: 260,
          text: "Diffusion Influx",
          fontSize: 12,
          strokeColor: "#10b981",
        },
      ];

      let formattedElements: any[] = [];
      try {
        const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
        if (typeof convertToExcalidrawElements === "function") {
          formattedElements = convertToExcalidrawElements(rawElements as any);
        }
      } catch (e) {
        // Fallback below
      }

      if (!formattedElements || formattedElements.length === 0) {
        formattedElements = rawElements.map((el, idx) => ({
          id: `circ-el-${Date.now()}-${idx}`,
          type: el.type,
          x: el.x || 0,
          y: el.y || 0,
          width: (el as any).width || 0,
          height: (el as any).height || 0,
          angle: 0,
          strokeColor: el.strokeColor || "#ffffff",
          backgroundColor: (el as any).backgroundColor || "transparent",
          fillStyle: (el as any).fillStyle || "solid",
          strokeWidth: (el as any).strokeWidth || 1,
          strokeStyle: (el as any).strokeStyle || "solid",
          roughness: (el as any).roughness ?? 1,
          opacity: 100,
          groupIds: [],
          frameId: null,
          roundness: null,
          seed: Math.floor(Math.random() * 1000000),
          version: 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
          ...((el as any).text ? { text: (el as any).text, fontSize: (el as any).fontSize || 14, fontFamily: 1, textAlign: "left", verticalAlign: "top" } : {}),
          ...((el as any).points ? { points: (el as any).points, lastCommittedPoint: null, startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: "arrow" } : {}),
        }));
      }

      const existingElements = excalidrawAPI.getSceneElements() || [];
      excalidrawAPI.updateScene({
        elements: [...existingElements, ...formattedElements],
        appState: { viewBackgroundColor: "#0c0f16" },
      });
    } catch (err) {
      console.warn("Excalidraw schematic insertion error:", err);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative rounded-lg overflow-hidden border border-white/[0.08] bg-[#0c0f16]">
      {/* Top action toolbar overlay */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 font-mono text-xs">
        <button
          onClick={handleInsertDropletSchematic}
          className="px-2.5 py-1 bg-[#1a202c] hover:bg-[#2d3748] text-cyan-300 rounded border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
          title="AI Agent inserts NASA CIR Droplet Chamber diagram"
        >
          <Bot className="w-3 h-3 text-cyan-400" />
          <span>AI Insert Chamber</span>
        </button>
        <button
          onClick={handleReset}
          className="px-2.5 py-1 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 rounded border border-white/10 flex items-center gap-1 transition-colors"
          title="Reset canvas"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Canvas</span>
        </button>
      </div>

      <div className="flex-1 w-full h-full min-h-[550px] relative">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          theme="dark"
          initialData={{
            appState: {
              theme: "dark",
              viewBackgroundColor: "#0c0f16",
              currentItemStrokeColor: "#f59e0b",
            },
          }}
        />
      </div>
    </div>
  );
}
