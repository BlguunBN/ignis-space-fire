"use client";
import React, { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

export function ImageInspector({ src, alt }: { src: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return <TransformWrapper key={src} minScale={1} maxScale={5} limitToBounds>
    {({ zoomIn, zoomOut, resetTransform }) => <div className="space-y-2">
      <div className="flex gap-2 text-xs" aria-label="Image inspection controls">
        <button type="button" className="studio-link" onClick={() => zoomIn()}>Zoom in</button>
        <button type="button" className="studio-link" onClick={() => zoomOut()}>Zoom out</button>
        <button type="button" className="studio-link" onClick={() => resetTransform()}>Reset view</button>
      </div>
      {failedSrc === src ? <p role="status" className="p-6 text-[#9EA2A7]">Image could not be loaded. Open the source link below.</p> :
        <div className="bg-black rounded-lg overflow-hidden">
          <TransformComponent wrapperStyle={{ width: "100%" }} contentStyle={{ width: "100%" }}>
            <img src={src} alt={alt} onError={() => setFailedSrc(src)} className="w-full max-h-[520px] object-contain" />
          </TransformComponent>
        </div>}
    </div>}
  </TransformWrapper>;
}
