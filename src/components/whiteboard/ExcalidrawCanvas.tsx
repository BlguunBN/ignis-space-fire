"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Download, RotateCcw, Sparkles } from "lucide-react";
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

  return (
    <div className="h-full w-full flex flex-col relative rounded-lg overflow-hidden border border-white/[0.08] bg-[#121212]">
      {/* Top action toolbar overlay */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 font-mono text-xs">
        <button
          onClick={handleReset}
          className="px-2.5 py-1 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 rounded border border-white/10 flex items-center gap-1 transition-colors"
          title="Reset canvas"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Canvas</span>
        </button>
      </div>

      <div className="h-[600px] w-full">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          theme="dark"
          initialData={{
            appState: {
              theme: "dark",
              viewBackgroundColor: "#121212",
              currentItemStrokeColor: "#f59e0b",
            },
          }}
        />
      </div>
    </div>
  );
}
