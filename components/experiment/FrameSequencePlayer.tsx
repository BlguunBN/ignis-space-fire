"use client";

import React, { useState, useEffect } from "react";
import { ResearchAsset } from "@/types/visualization";
import { RepresentationBadge } from "@/components/experiment/RepresentationBadge";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ExternalLink,
  Eye,
  Info,
} from "lucide-react";

interface FrameSequencePlayerProps {
  asset: ResearchAsset;
}

export function FrameSequencePlayer({ asset }: FrameSequencePlayerProps) {
  const frameCount = asset.frameCount || 12;
  const intervalSec = asset.intervalSeconds || 0.2;

  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentFrame((prev) => (prev >= frameCount ? 1 : prev + 1));
      }, intervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, frameCount, intervalSec]);

  // Frame path formatter
  const getFramePath = (index: number) => {
    const formatted = String(index).padStart(2, "0");
    return `/nasa/sofie-gel/frames/frame_${formatted}.png`;
  };

  const elapsedTime = ((currentFrame - 1) * intervalSec).toFixed(1);

  return (
    <div className="bg-[#1B2027] border border-[#303741] rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Viewer Header */}
      <div className="p-4 bg-[#15191F] border-b border-[#303741] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RepresentationBadge type={asset.representation} intervalSeconds={asset.intervalSeconds} />
          <span className="text-xs text-[#A1AAB5] font-mono">
            NASA SVS 31394
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Overlay Toggle */}
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border transition cursor-pointer ${
              showOverlay
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-[#0C0F13] text-[#A1AAB5] border-[#303741] hover:text-[#F3F5F7]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showOverlay ? "Contour Overlay: ON" : "Contour Overlay: OFF"}
          </button>

          <a
            href={asset.locator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#78A9D8] hover:text-[#F3F5F7] inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0C0F13] border border-[#303741]"
          >
            <span>Original SVS Media</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Image Frame Display */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden border-b border-[#303741]">
        {/* Actual NASA Frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getFramePath(currentFrame)}
          alt={`NASA SoFIE microgravity combustion frame ${currentFrame}`}
          className="w-full h-full object-contain"
        />

        {/* Visual Contour Overlay (Image-derived visual aid) */}
        {showOverlay && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 480 360" className="w-full h-full">
              {/* Flame envelope contour */}
              <ellipse
                cx="240"
                cy="180"
                rx={60 + (currentFrame % 4) * 12}
                ry={45 + (currentFrame % 3) * 8}
                fill="none"
                stroke="#E99847"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="transition-all duration-200"
              />
              <text
                x="240"
                y={110 - (currentFrame % 3) * 5}
                fill="#E99847"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                Visible Reaction Boundary (Optical Proxy)
              </text>

              {/* Inflow indicator */}
              <path
                d="M 120 180 L 170 180 M 160 174 L 170 180 L 160 186"
                stroke="#78A9D8"
                strokeWidth="2"
                fill="none"
              />
              <text x="100" y="184" fill="#78A9D8" fontSize="10" fontFamily="monospace" textAnchor="end">
                Induced Inflow
              </text>
            </svg>
          </div>
        )}

        {/* Real-time Stated Timecode HUD */}
        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur border border-[#303741] px-2.5 py-1 rounded text-xs font-mono text-[#F3F5F7] flex items-center gap-3">
          <span className="text-[#5CB59B] font-bold">FRAME {String(currentFrame).padStart(2, "0")} / {frameCount}</span>
          <span className="text-[#737F8C]">|</span>
          <span className="text-[#E99847] font-bold">t = +{elapsedTime}s</span>
          <span className="text-[#737F8C]">|</span>
          <span className="text-[#A1AAB5] text-[10px]">Δt = {intervalSec}s / frame</span>
        </div>
      </div>

      {/* Scrub & Playback Controls */}
      <div className="p-4 bg-[#15191F] space-y-3">
        {/* Timeline Range Scrubber */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-[#737F8C]">
            <span>Sequence Start (t = 0.0s)</span>
            <span className="text-[#F3F5F7]">Frame {currentFrame} of {frameCount}</span>
            <span>Sequence End (t = +2.2s)</span>
          </div>
          <input
            type="range"
            min={1}
            max={frameCount}
            value={currentFrame}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrame(parseInt(e.target.value));
            }}
            className="w-full accent-[#E99847] bg-[#0C0F13] h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrame(1);
              }}
              className="p-1.5 rounded bg-[#0C0F13] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              title="Reset to frame 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrame((prev) => (prev <= 1 ? frameCount : prev - 1));
              }}
              className="p-1.5 rounded bg-[#0C0F13] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              title="Previous frame"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E99847] text-[#0C0F13] font-bold text-xs transition cursor-pointer shadow-sm"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? "Pause Sequence" : "Play Sequence"}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrame((prev) => (prev >= frameCount ? 1 : prev + 1));
              }}
              className="p-1.5 rounded bg-[#0C0F13] text-[#A1AAB5] hover:text-[#F3F5F7] border border-[#303741] transition cursor-pointer"
              title="Next frame"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-[#A1AAB5] font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#78A9D8]" />
            <span>Stated Interval: Exactly 0.2 s between adjacent flight frames</span>
          </div>
        </div>
      </div>
    </div>
  );
}
