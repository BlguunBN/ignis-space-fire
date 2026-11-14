"use client";

import React, { useState, useEffect } from "react";
import { ImageInspector } from "@/components/experiment/ImageInspector";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ExternalLink,
  Layers,
  Clock,
  Camera,
  Activity,
  CheckCircle2,
  Wind,
} from "lucide-react";

interface MeasurementPoint {
  t_sec: number;
  spread_rate_mm_s?: number;
  note?: string;
}

interface ReplayViewerProps {
  framesPattern?: string;
  frameCount?: number;
  intervalSeconds?: number;
  staticPath?: string;
  schematicPath?: string;
  title: string;
  caption: string;
  nasaCredit: string;
  sourceUrl?: string;
  measurementSeries?: MeasurementPoint[];
  programme?: string;
}

export function ReplayViewer({
  framesPattern,
  frameCount = 0,
  intervalSeconds,
  staticPath,
  schematicPath,
  title,
  caption,
  nasaCredit,
  sourceUrl,
  measurementSeries = [],
  programme,
}: ReplayViewerProps) {
  const hasFrames = Boolean(framesPattern && frameCount > 1);
  const hasStaticImage = Boolean(staticPath && !hasFrames);
  const isEmpiricalSeries = !hasFrames && !hasStaticImage && measurementSeries.length > 0;

  // View mode for empirical series: 'tracker' vs 'blueprint'
  const [empiricalView, setEmpiricalView] = useState<"tracker" | "blueprint">("tracker");

  // Frame sequence state
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrame, setCompareFrame] = useState(1);

  // Empirical series scrub state
  const [seriesIndex, setSeriesIndex] = useState(0);

  // Reset when target changes
  useEffect(() => {
    setCurrentFrame(1);
    setSeriesIndex(0);
    setIsPlaying(false);
  }, [framesPattern, staticPath, title]);

  // Animation timer for frames
  useEffect(() => {
    if (!isPlaying || !intervalSeconds || frameCount < 2) return;

    const timer = setInterval(() => {
      setCurrentFrame((f) => (f >= frameCount ? 1 : f + 1));
    }, (intervalSeconds * 1000) / playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, intervalSeconds, frameCount, playbackSpeed]);

  // Animation timer for empirical series
  useEffect(() => {
    if (!isPlaying || !isEmpiricalSeries || measurementSeries.length < 2) return;

    const timer = setInterval(() => {
      setSeriesIndex((idx) => (idx >= measurementSeries.length - 1 ? 0 : idx + 1));
    }, 2000 / playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, isEmpiricalSeries, measurementSeries, playbackSpeed]);

  const getFramePath = (idx: number) => {
    if (!framesPattern) return staticPath || "";
    return framesPattern.replace(/\{(?:idx|index)\}/g, String(idx).padStart(2, "0"));
  };

  const activePoint = isEmpiricalSeries
    ? measurementSeries[seriesIndex] || measurementSeries[0]
    : null;

  return (
    <div className="space-y-4 p-4 bg-[#111214] border border-[#303134] rounded-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#303134]">
        <div>
          <div className="flex items-center gap-2">
            {hasFrames ? (
              <Camera className="w-4 h-4 text-[#DDA36B]" />
            ) : (
              <Activity className="w-4 h-4 text-emerald-400" />
            )}
            <h3 className="text-sm font-semibold text-[#F3F2EF]">{title}</h3>
          </div>
          <p className="text-xs text-[#9EA2A7] mt-0.5">{caption}</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {hasFrames && (
            <button
              type="button"
              onClick={() => setCompareMode(!compareMode)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                compareMode
                  ? "bg-[#DDA36B]/20 text-[#DDA36B] border-[#DDA36B]/60"
                  : "bg-[#191A1D] text-[#9EA2A7] border-[#303134] hover:text-[#F3F2EF]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{compareMode ? "Exit Compare" : "Compare 2 Frames"}</span>
            </button>
          )}

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded bg-[#191A1D] text-[#DDA36B] border border-[#303134] hover:border-[#DDA36B]/50 flex items-center gap-1 font-medium"
            >
              <span>NASA Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Display: Frame Sequence, Static Image, OR Empirical Series Visualizer */}
      {hasFrames ? (
        /* 1. Real NASA Flight Frame Sequence */
        <div className="space-y-3">
          <div className="w-full min-h-[300px] flex items-center justify-center bg-black/60 rounded-lg overflow-hidden border border-[#23262A]">
            {compareMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full p-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] px-1 text-[#9EA2A7]">
                    <span>Frame A (Reference)</span>
                    <span className="font-mono text-[#DDA36B]">Frame {currentFrame} / {frameCount}</span>
                  </div>
                  <div className="h-64 rounded overflow-hidden border border-[#303134]">
                    <ImageInspector
                      src={getFramePath(currentFrame)}
                      alt={`${title} Frame ${currentFrame}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] px-1 text-[#9EA2A7]">
                    <span>Frame B (Compare)</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-blue-400">Frame {compareFrame} / {frameCount}</span>
                      <input
                        type="range"
                        min={1}
                        max={frameCount}
                        value={compareFrame}
                        onChange={(e) => setCompareFrame(Number(e.target.value))}
                        className="w-20 accent-blue-400"
                      />
                    </div>
                  </div>
                  <div className="h-64 rounded overflow-hidden border border-[#303134]">
                    <ImageInspector
                      src={getFramePath(compareFrame)}
                      alt={`${title} Frame ${compareFrame}`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <ImageInspector
                  src={getFramePath(currentFrame)}
                  alt={`${title} Frame ${currentFrame}`}
                />
              </div>
            )}
          </div>

          {/* Time & Observation Callout */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1 text-xs">
            <div className="flex items-center gap-2 text-[#9EA2A7]">
              <Clock className="w-3.5 h-3.5 text-[#DDA36B]" />
              <span>NASA Elapsed Time:</span>
              <span className="font-mono text-sm font-semibold text-[#F3F2EF]">
                {intervalSeconds ? ((currentFrame - 1) * intervalSeconds).toFixed(2) : "N/A"} s
              </span>
              {intervalSeconds && (
                <span className="text-[10px] text-[#9EA2A7]">
                  (Δt = {intervalSeconds}s cadence)
                </span>
              )}
            </div>

            <div className="text-xs text-[#9EA2A7]">
              Credit: <span className="text-[#F3F2EF]">{nasaCredit}</span>
            </div>
          </div>

          {/* Active Frame Phase Annotation */}
          {measurementSeries[currentFrame - 1]?.note && (
            <div className="px-3 py-1.5 rounded bg-[#191A1D] border border-[#303134] text-xs font-mono text-[#DDA36B]">
              Phase Annotation: {measurementSeries[currentFrame - 1].note}
            </div>
          )}

          {/* Frame Scrubber Controls */}
          <div className="space-y-2 pt-2 border-t border-[#23262A]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous frame"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame((f) => (f <= 1 ? frameCount : f - 1));
                }}
                className="p-1.5 rounded hover:bg-[#191A1D] text-[#9EA2A7] hover:text-[#F3F2EF]"
              >
                <SkipBack size={18} />
              </button>

              <button
                type="button"
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled={!intervalSeconds}
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-lg bg-[#DDA36B] hover:bg-[#c99059] text-black p-2 font-medium transition-colors disabled:opacity-40"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <button
                type="button"
                aria-label="Next frame"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame((f) => (f >= frameCount ? 1 : f + 1));
                }}
                className="p-1.5 rounded hover:bg-[#191A1D] text-[#9EA2A7] hover:text-[#F3F2EF]"
              >
                <SkipForward size={18} />
              </button>

              <button
                type="button"
                aria-label="Reset sequence"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentFrame(1);
                }}
                className="p-1.5 rounded hover:bg-[#191A1D] text-[#9EA2A7] hover:text-[#F3F2EF]"
                title="Reset to frame 1"
              >
                <RotateCcw size={16} />
              </button>

              <input
                type="range"
                min={1}
                max={frameCount}
                value={currentFrame}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrame(Number(e.target.value));
                }}
                className="flex-1 min-w-28 accent-[#DDA36B]"
              />

              <span className="text-xs font-mono text-[#F3F2EF] whitespace-nowrap">
                {currentFrame} / {frameCount}
              </span>

              <select
                aria-label="Playback speed"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-[#191A1D] border border-[#303134] rounded px-2 py-1 text-xs text-[#F3F2EF]"
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1.0×</option>
                <option value={2}>2.0×</option>
              </select>
            </div>

            {/* Filmstrip thumbnails */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1">
              {Array.from({ length: frameCount }, (_, i) => {
                const frameIdx = i + 1;
                const isSelected = currentFrame === frameIdx;
                return (
                  <button
                    key={frameIdx}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrame(frameIdx);
                    }}
                    className={`shrink-0 w-14 h-11 rounded border overflow-hidden transition-all ${
                      isSelected
                        ? "border-[#DDA36B] ring-1 ring-[#DDA36B]"
                        : "border-[#303134] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getFramePath(frameIdx)}
                      alt=""
                      className="w-full h-full object-contain bg-black"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : hasStaticImage ? (
        /* 2. Static NASA Flight Image */
        <div className="w-full bg-black/60 rounded-lg overflow-hidden border border-[#23262A] p-2">
          <ImageInspector src={staticPath!} alt={title} />
        </div>
      ) : (
        /* 3. Authentic NASA Flight Empirical Progression & Apparatus Visualizer (Saffire / BASS-II) */
        <div className="space-y-4">
          {schematicPath && (
            <div className="flex items-center gap-2 p-1 bg-[#191A1D] border border-[#303134] rounded-lg text-xs w-fit">
              <button
                type="button"
                onClick={() => setEmpiricalView("tracker")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  empiricalView === "tracker"
                    ? "bg-[#DDA36B] text-black"
                    : "text-[#9EA2A7] hover:text-[#F3F2EF]"
                }`}
              >
                Dynamic Flight Flame Tracker
              </button>
              <button
                type="button"
                onClick={() => setEmpiricalView("blueprint")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  empiricalView === "blueprint"
                    ? "bg-[#DDA36B] text-black"
                    : "text-[#9EA2A7] hover:text-[#F3F2EF]"
                }`}
              >
                Apparatus CAD Blueprint
              </button>
            </div>
          )}

          {empiricalView === "blueprint" && schematicPath ? (
            <div className="w-full bg-[#0A0C0F] border border-[#23262A] rounded-lg p-3">
              <img
                src={schematicPath}
                alt={`${title} Blueprint`}
                className="w-full h-auto max-h-[420px] object-contain rounded"
              />
            </div>
          ) : (
            <>
              {/* Apparatus Vector Schematic with Dynamic Flame Position */}
              <div className="w-full p-4 bg-[#0A0C0F] border border-[#23262A] rounded-lg">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#23262A] mb-3">
              <span className="font-semibold text-[#F3F2EF] font-mono text-[11px] uppercase tracking-wider">
                {title.includes("Saffire")
                  ? "Cygnus Flight Flow Tunnel Apparatus (1.0m SIBAL Sample)"
                  : "ISS Microgravity Science Glovebox (MSG) Flow Tunnel"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191A1D] text-emerald-400 border border-emerald-900/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Flight Calibrated Geometry
              </span>
            </div>

            <svg viewBox="0 0 680 180" className="w-full h-auto text-slate-300 font-mono">
              {/* Outer Tunnel Duct */}
              <rect
                x="40"
                y="20"
                width="600"
                height="140"
                rx="8"
                fill="#0C0F13"
                stroke="#303134"
                strokeWidth="2"
              />
              <text x="60" y="42" fill="#6B7280" fontSize="10" fontWeight="bold">
                {title.includes("Saffire")
                  ? "CYGNUS CARGO VEHICLE FLIGHT TUNNEL (0.5m x 0.5m DUCT)"
                  : "ISS MSG HERMETIC FLOW DUCT (100mm x 100mm)"}
              </text>

              {/* Airflow arrow stream */}
              <path
                d="M 60 90 L 120 90 M 110 84 L 120 90 L 110 96"
                stroke="#60A5FA"
                strokeWidth="2"
                fill="none"
              />
              <text x="90" y="115" fill="#60A5FA" fontSize="9" textAnchor="middle">
                Forced Airflow
              </text>

              {/* Sample Slab / Fabric */}
              <rect
                x="160"
                y="85"
                width="360"
                height="10"
                rx="2"
                fill="#DDA36B"
                stroke="#B47842"
              />
              <text x="340" y="80" fill="#DDA36B" fontSize="10" textAnchor="middle" fontWeight="bold">
                {title.includes("Saffire")
                  ? "SIBAL Cotton-Fiberglass Fabric (0.4m x 1.0m)"
                  : "Solid PMMA Polymer Specimen (2cm x 10cm)"}
              </text>

              {/* Dynamic Flame Front based on active scrub index */}
              {(() => {
                const totalSteps = measurementSeries.length;
                const progressRatio = totalSteps > 1 ? seriesIndex / (totalSteps - 1) : 0.5;
                const flameX = 180 + progressRatio * 300;
                return (
                  <g>
                    {/* Flame glow */}
                    <ellipse
                      cx={flameX}
                      cy="82"
                      rx="32"
                      ry="22"
                      fill="rgba(245, 158, 11, 0.25)"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    {/* Inner core */}
                    <ellipse
                      cx={flameX}
                      cy="85"
                      rx="14"
                      ry="10"
                      fill="rgba(59, 130, 246, 0.7)"
                    />
                    <text
                      x={flameX}
                      y="52"
                      fill="#F59E0B"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      Flame Front (t = {activePoint?.t_sec}s)
                    </text>
                  </g>
                );
              })()}

              {/* Exhaust Section */}
              <path
                d="M 540 90 L 600 90 M 590 84 L 600 90 L 590 96"
                stroke="#6B7280"
                strokeWidth="2"
                fill="none"
              />
              <text x="570" y="115" fill="#6B7280" fontSize="9" textAnchor="middle">
                To Scrubber
              </text>
            </svg>
          </div>

          {/* Time Scrubber through Flight Measurements */}
          <div className="p-3.5 bg-[#191A1D] border border-[#303134] rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9EA2A7] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#DDA36B]" />
                Scrub Stamped Flight Timeline:
                <strong className="text-[#F3F2EF] font-mono text-sm ml-1">
                  t = {activePoint?.t_sec} s
                </strong>
              </span>

              <span className="font-mono text-emerald-400 font-semibold text-xs">
                Observed Spread Rate: {activePoint?.spread_rate_mm_s?.toFixed(2) ?? "—"} mm/s
              </span>
            </div>

            {/* Scrubber slider and controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSeriesIndex((idx) => (idx <= 0 ? measurementSeries.length - 1 : idx - 1));
                }}
                className="p-1.5 rounded hover:bg-[#111214] text-[#9EA2A7] hover:text-[#F3F2EF]"
                aria-label="Previous observation"
              >
                <SkipBack size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-[#DDA36B] hover:bg-[#c99059] text-black transition-colors"
                aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSeriesIndex((idx) => (idx >= measurementSeries.length - 1 ? 0 : idx + 1));
                }}
                className="p-1.5 rounded hover:bg-[#111214] text-[#9EA2A7] hover:text-[#F3F2EF]"
                aria-label="Next observation"
              >
                <SkipForward size={16} />
              </button>

              <input
                type="range"
                min={0}
                max={measurementSeries.length - 1}
                value={seriesIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setSeriesIndex(Number(e.target.value));
                }}
                className="flex-1 accent-[#DDA36B]"
              />

              <span className="text-xs font-mono text-[#F3F2EF]">
                Step {seriesIndex + 1} / {measurementSeries.length}
              </span>
            </div>

            {/* Active Phase Annotation */}
            {activePoint?.note && (
              <div className="p-2 rounded bg-[#111214] border border-[#303134] text-xs font-mono text-[#DDA36B]">
                Recorded Observation: {activePoint.note}
              </div>
            )}
          </div>

          {/* Measured Spread Rate Curve Plot */}
          <div className="p-3.5 bg-[#111214] border border-[#303134] rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F3F2EF] uppercase tracking-wider text-[11px]">
                Empirical Spread Rate Progression
              </span>
              <span className="text-[10px] text-[#9EA2A7] font-mono">
                Direct NASA measurements
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={measurementSeries}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#23262A" />
                  <XAxis
                    dataKey="t_sec"
                    stroke="#6B7280"
                    fontSize={10}
                    tickFormatter={(v) => `${v}s`}
                  />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={10}
                    unit=" mm/s"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#191A1D",
                      border: "1px solid #303134",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    formatter={(val: any) => [`${val} mm/s`, "Spread Rate"]}
                    labelFormatter={(t) => `Elapsed: ${t} s`}
                  />
                  <Line
                    type="monotone"
                    dataKey="spread_rate_mm_s"
                    stroke="#34D399"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#34D399" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}
