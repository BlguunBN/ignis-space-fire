"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Flame,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Wind,
  Download,
  Activity,
  Sliders,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Scan,
  Camera,
  Bot,
  Gauge,
  Thermometer,
} from "lucide-react";

interface EnvironmentPreset {
  id: string;
  name: string;
  pressureAtm: number;
  o2Pct: number;
  gravity: "µg" | "1g" | "0.16g" | "0.38g";
  notes: string;
}

const PRESETS: EnvironmentPreset[] = [
  {
    id: "iss",
    name: "ISS Standard",
    pressureAtm: 1.0,
    o2Pct: 21,
    gravity: "µg",
    notes: "1.00 atm · 21% O₂ · µg (NASA OCHMO-TB-003 baseline)",
  },
  {
    id: "shuttle-spacewalk",
    name: "Shuttle Pre-EVA",
    pressureAtm: 0.69,
    o2Pct: 27,
    gravity: "µg",
    notes: "0.69 atm · 27% O₂ · µg (Pre-spacewalk denitrogenation)",
  },
  {
    id: "iss-airlock",
    name: "ISS Airlock Pre-EVA",
    pressureAtm: 0.69,
    o2Pct: 27,
    gravity: "µg",
    notes: "0.69 atm · 27% O₂ · µg (Quest airlock campout profile)",
  },
  {
    id: "orion-lunar",
    name: "Orion Lunar Design",
    pressureAtm: 0.69,
    o2Pct: 30,
    gravity: "µg",
    notes: "0.69 atm · 30% O₂ · µg (Artemis cabin baseline standard)",
  },
  {
    id: "orion-full",
    name: "Orion Full Pressure",
    pressureAtm: 1.0,
    o2Pct: 26,
    gravity: "µg",
    notes: "1.00 atm · 26% O₂ · µg (Exploration transit atmosphere)",
  },
  {
    id: "soyuz",
    name: "Soyuz Richest Air",
    pressureAtm: 0.93,
    o2Pct: 28,
    gravity: "µg",
    notes: "0.93 atm · 28% O₂ · µg (Roscosmos contingency atmosphere)",
  },
  {
    id: "exploration",
    name: "Exploration Atmosphere",
    pressureAtm: 0.56,
    o2Pct: 34,
    gravity: "µg",
    notes: "0.56 atm (57 kPa) · 34% O₂ · µg (NASA Exploration baseline)",
  },
];

interface CombustionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
}

export function CombustionSimulatorModal({
  isOpen,
  onClose,
  onAskAI,
}: CombustionSimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<"physics" | "diagnostics">("physics");

  // Physics Simulation States (Image 4)
  const [selectedPreset, setSelectedPreset] = useState<string>("iss");
  const [o2Pct, setO2Pct] = useState<number>(21);
  const [pressureAtm, setPressureAtm] = useState<number>(1.0);
  const [gravityMode, setGravityMode] = useState<"µg" | "1g">("µg");
  const [fuelType, setFuelType] = useState<"Methanol" | "Heptane" | "n-Decane">("Methanol");
  const [diluent, setDiluent] = useState<"Nitrogen" | "+ CO2" | "+ Helium">("Nitrogen");
  const [initialDropletMm, setInitialDropletMm] = useState<number>(2.5);

  // Simulation Running State
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0); // 0 to 1
  const [currentDiameterMm, setCurrentDiameterMm] = useState<number>(2.5);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [airCursorActive, setAirCursorActive] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // CV Diagnostics States (Image 2)
  const [diagSequence, setDiagSequence] = useState<"rtdfs" | "sofie" | "hotwire">("rtdfs");
  const [cvFilter, setCvFilter] = useState<"raw" | "chemiluminescence" | "edges" | "pyrometry">("chemiluminescence");
  const [scanlineYPct, setScanlineYPct] = useState<number>(44);
  const [thresholdSensitivity, setThresholdSensitivity] = useState<number>(45);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derived Physics Metrics
  // Burning rate constant K (mm^2/s) depends on fuel, oxygen, pressure, diluent
  const baseK = fuelType === "Methanol" ? 0.56 : fuelType === "Heptane" ? 0.72 : 0.85;
  const o2Multiplier = (o2Pct / 21) ** 0.45;
  const pressureMultiplier = (pressureAtm / 1.0) ** 0.12;
  const diluentMultiplier = diluent === "+ CO2" ? 0.82 : diluent === "+ Helium" ? 1.15 : 1.0;
  const burningRateK = Math.round(baseK * o2Multiplier * pressureMultiplier * diluentMultiplier * 100) / 100;

  // Total burn time according to d^2 law: t_burn = d0^2 / K
  const totalBurnTimeSec = Math.round(((initialDropletMm ** 2) / burningRateK) * 10) / 10;

  // Extinction probability
  // Low oxygen (<15%) or heavy CO2 diluent increases radiative extinction probability
  let extinctionProbability = 17;
  let predictionStatus = "Burns to completion";
  if (o2Pct < 14) {
    extinctionProbability = 89;
    predictionStatus = "Radiative extinction limit (Flame quenches)";
  } else if (o2Pct < 17) {
    extinctionProbability = 52;
    predictionStatus = "Marginal extinction boundary";
  } else if (diluent === "+ CO2") {
    extinctionProbability = 38;
    predictionStatus = "Radiative cooling near boundary";
  }

  // Handle Preset Selection
  const applyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESETS.find((pr) => pr.id === presetId);
    if (p) {
      setO2Pct(p.o2Pct);
      setPressureAtm(p.pressureAtm);
      setGravityMode(p.gravity === "1g" ? "1g" : "µg");
    }
  };

  // Keyboard shortcut: Space to toggle burn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggleBurn();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBurning]);

  // Simulation Loop
  useEffect(() => {
    if (!isBurning) return;

    const intervalMs = 50;
    const dt = intervalMs / 1000;

    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const nextTime = prev + dt;
        if (nextTime >= totalBurnTimeSec) {
          setIsBurning(false);
          setCurrentDiameterMm(0);
          setBurnProgress(1);
          return totalBurnTimeSec;
        }

        // d^2 law: d(t) = sqrt(max(0, d0^2 - K * t))
        const remainingD2 = Math.max(0, initialDropletMm ** 2 - burningRateK * nextTime);
        const nextD = Math.sqrt(remainingD2);
        setCurrentDiameterMm(Math.round(nextD * 100) / 100);
        setBurnProgress(nextTime / totalBurnTimeSec);
        return nextTime;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isBurning, initialDropletMm, burningRateK, totalBurnTimeSec]);

  // Canvas Flame Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw dark chamber background with subtle radial grid
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 240);
      bgGrad.addColorStop(0, "#080c14");
      bgGrad.addColorStop(1, "#030407");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Chamber crosshairs and mm scales
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 150, cy);
      ctx.lineTo(cx + 150, cy);
      ctx.moveTo(cx, cy - 150);
      ctx.lineTo(cx, cy + 150);
      ctx.stroke();

      // Droplet visual radius in pixels
      const dropletRadiusPx = Math.max(2, (currentDiameterMm / initialDropletMm) * 22);

      // If burning, draw flame
      if (isBurning || elapsedTime > 0) {
        const flicker = Math.sin(frame * 0.2) * 1.5 + Math.cos(frame * 0.3) * 0.8;
        const flameRadiusPx = Math.max(8, dropletRadiusPx * 3.8 + flicker);

        // Air cursor interaction drift
        let driftX = 0;
        let driftY = 0;
        if (airCursorActive) {
          const dx = cursorPos.x - cx;
          const dy = cursorPos.y - cy;
          driftX = (dx / canvas.width) * 25;
          driftY = (dy / canvas.height) * 25;
        }

        if (gravityMode === "µg") {
          // Microgravity: Pure Spherical Chemiluminescence & Soot Halo
          // 1. Outer Blue Chemiluminescent Zone (CH* 431nm band)
          const outerBlue = ctx.createRadialGradient(
            cx + driftX,
            cy + driftY,
            dropletRadiusPx,
            cx + driftX,
            cy + driftY,
            flameRadiusPx * 1.3
          );
          outerBlue.addColorStop(0, "rgba(56, 189, 248, 0)");
          outerBlue.addColorStop(0.65, "rgba(56, 189, 248, 0.25)");
          outerBlue.addColorStop(0.85, "rgba(37, 99, 235, 0.65)");
          outerBlue.addColorStop(1, "rgba(30, 58, 138, 0)");

          ctx.fillStyle = outerBlue;
          ctx.beginPath();
          ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 1.3, 0, Math.PI * 2);
          ctx.fill();

          // 2. Middle Warm Radiative Soot Cloud
          const innerWarm = ctx.createRadialGradient(
            cx + driftX,
            cy + driftY,
            dropletRadiusPx * 0.8,
            cx + driftX,
            cy + driftY,
            flameRadiusPx * 0.95
          );
          innerWarm.addColorStop(0, "rgba(254, 215, 170, 0.7)");
          innerWarm.addColorStop(0.4, "rgba(251, 146, 60, 0.5)");
          innerWarm.addColorStop(0.75, "rgba(234, 88, 12, 0.3)");
          innerWarm.addColorStop(1, "rgba(180, 83, 9, 0)");

          ctx.fillStyle = innerWarm;
          ctx.beginPath();
          ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 0.95, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Earth 1g: Buoyant Upward Teardrop Plume
          const plumeH = flameRadiusPx * 2.4;
          const grad1g = ctx.createLinearGradient(cx, cy + dropletRadiusPx, cx, cy - plumeH);
          grad1g.addColorStop(0, "rgba(56, 189, 248, 0.6)");
          grad1g.addColorStop(0.2, "rgba(251, 146, 60, 0.8)");
          grad1g.addColorStop(0.7, "rgba(234, 88, 12, 0.6)");
          grad1g.addColorStop(1, "rgba(239, 68, 68, 0)");

          ctx.fillStyle = grad1g;
          ctx.beginPath();
          ctx.moveTo(cx - flameRadiusPx * 0.9, cy);
          ctx.quadraticCurveTo(cx - flameRadiusPx * 0.8, cy - plumeH * 0.5, cx, cy - plumeH);
          ctx.quadraticCurveTo(cx + flameRadiusPx * 0.8, cy - plumeH * 0.5, cx + flameRadiusPx * 0.9, cy);
          ctx.arc(cx, cy, flameRadiusPx * 0.9, 0, Math.PI, false);
          ctx.fill();
        }
      }

      // Draw Center Liquid Droplet (Methanol/Heptane sphere)
      if (currentDiameterMm > 0) {
        const dropGrad = ctx.createRadialGradient(
          cx - dropletRadiusPx * 0.3,
          cy - dropletRadiusPx * 0.3,
          1,
          cx,
          cy,
          dropletRadiusPx
        );
        dropGrad.addColorStop(0, "rgba(240, 249, 255, 0.9)");
        dropGrad.addColorStop(0.5, "rgba(186, 230, 253, 0.6)");
        dropGrad.addColorStop(1, "rgba(56, 189, 248, 0.3)");

        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, dropletRadiusPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [
    isBurning,
    currentDiameterMm,
    initialDropletMm,
    gravityMode,
    fuelType,
    elapsedTime,
    airCursorActive,
    cursorPos,
  ]);

  const toggleBurn = () => {
    if (isBurning) {
      setIsBurning(false);
    } else {
      if (elapsedTime >= totalBurnTimeSec || currentDiameterMm <= 0) {
        resetSimulation();
      }
      setIsBurning(true);
    }
  };

  const resetSimulation = () => {
    setIsBurning(false);
    setElapsedTime(0);
    setCurrentDiameterMm(initialDropletMm);
    setBurnProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#090b10] border border-white/[0.08] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-white/[0.08] bg-[#0c0f16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold font-mono text-slate-100 uppercase tracking-wider">
                  Microgravity Combustion Physics & Simulation Engine
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  FLEX / SoFIE Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Simulate droplet extinction, sphericity dynamics, and chemiluminescent profiles across NASA flight environments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Tabs */}
            <div className="flex rounded-md bg-white/[0.03] p-0.5 border border-white/[0.06] text-xs font-mono">
              <button
                onClick={() => setActiveTab("physics")}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === "physics"
                    ? "bg-cyan-500/20 text-cyan-300 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Physics Simulation (d² Law)
              </button>
              <button
                onClick={() => setActiveTab("diagnostics")}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === "diagnostics"
                    ? "bg-cyan-500/20 text-cyan-300 font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Optical Diagnostics & CV Filter
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/[0.04] transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {activeTab === "physics" ? (
            /* TAB 1: Physics Droplet Simulator (Image 4) */
            <div className="space-y-4">
              {/* 01 Where - Environment Presets Bar */}
              <div className="p-3 rounded-lg border border-white/[0.06] bg-[#0c0f16] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold">
                    01 Where (Flight Cabin & Spacecraft Presets)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    NASA OCHMO-TB-003 Habitable Atmosphere Standard
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`p-2 rounded border text-left font-mono transition-all ${
                        selectedPreset === p.id
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-sm"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      <div className="font-semibold text-[11px] truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.pressureAtm} atm · {p.o2Pct}% O₂
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Simulation Workspace Grid: Controls | Visual Canvas | Output Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 02 The Air - Left Sliders Panel (4 Cols) */}
                <div className="lg:col-span-3 p-3.5 rounded-lg border border-white/[0.06] bg-[#0c0f16] space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-slate-300 font-semibold text-xs">02 The Air</span>
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  </div>

                  {/* Oxygen Concentration */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Oxygen (O₂)</span>
                      <span className="text-cyan-300 font-bold">{o2Pct}%</span>
                    </div>
                    <input
                      type="range"
                      min="13"
                      max="40"
                      step="1"
                      value={o2Pct}
                      onChange={(e) => {
                        setO2Pct(parseFloat(e.target.value));
                        setSelectedPreset("custom");
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Tested: 13%</span>
                      <span>40%</span>
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Pressure</span>
                      <span className="text-cyan-300 font-bold">
                        {pressureAtm} atm ({(pressureAtm * 14.696).toFixed(1)} psia)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="2.0"
                      step="0.05"
                      value={pressureAtm}
                      onChange={(e) => {
                        setPressureAtm(parseFloat(e.target.value));
                        setSelectedPreset("custom");
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0.25 atm</span>
                      <span>2.0 atm</span>
                    </div>
                  </div>

                  {/* Gravity Mode */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Gravity Level</span>
                      <span className="text-cyan-300 font-bold">{gravityMode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setGravityMode("µg")}
                        className={`py-1 rounded text-center text-xs transition-colors ${
                          gravityMode === "µg"
                            ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200"
                            : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        µg (Microgravity)
                      </button>
                      <button
                        onClick={() => setGravityMode("1g")}
                        className={`py-1 rounded text-center text-xs transition-colors ${
                          gravityMode === "1g"
                            ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                            : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        1g (Earth Normal)
                      </button>
                    </div>
                  </div>

                  {/* Fuel Selection */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[11px] block">Fuel Hydrocarbon</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(["Methanol", "Heptane", "n-Decane"] as const).map((fuel) => (
                        <button
                          key={fuel}
                          onClick={() => setFuelType(fuel)}
                          className={`py-1 text-[11px] rounded border transition-colors ${
                            fuelType === fuel
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                              : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                          }`}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diluent Selection */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[11px] block">Atmosphere Diluent</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(["Nitrogen", "+ CO2", "+ Helium"] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDiluent(d)}
                          className={`py-1 text-[11px] rounded border transition-colors ${
                            diluent === d
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                              : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Droplet Initial Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Droplet Diameter (d₀)</span>
                      <span className="text-cyan-300 font-bold">{initialDropletMm.toFixed(2)} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0.9"
                      max="4.7"
                      step="0.1"
                      value={initialDropletMm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setInitialDropletMm(val);
                        if (!isBurning) setCurrentDiameterMm(val);
                      }}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0.9 mm</span>
                      <span>4.7 mm</span>
                    </div>
                  </div>
                </div>

                {/* 03 The Flame - Center Live Canvas Viewport (6 Cols) */}
                <div className="lg:col-span-6 p-3.5 rounded-lg border border-white/[0.06] bg-[#0c0f16] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span className="text-slate-300 font-semibold">03 The Flame</span>
                      <span className="text-[10px] text-slate-500">
                        {gravityMode === "µg" ? "Spherical Symmetry (0g)" : "Buoyant Teardrop (1g)"}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300">
                      t {elapsedTime.toFixed(1)} / {totalBurnTimeSec.toFixed(1)} s · d {currentDiameterMm.toFixed(2)} mm
                    </div>
                  </div>

                  {/* Canvas Viewport */}
                  <div
                    className="relative w-full aspect-[16/10] bg-black rounded-lg border border-white/[0.08] overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCursorPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={560}
                      height={350}
                      className="w-full h-full object-contain cursor-crosshair"
                    />

                    {/* Overlay Prompt */}
                    {!isBurning && elapsedTime === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <button
                          onClick={toggleBurn}
                          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Ignite Droplet (or Spacebar)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Canvas Control Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <button
                        onClick={toggleBurn}
                        className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-semibold transition-colors ${
                          isBurning
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                            : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                        }`}
                      >
                        {isBurning ? "Pause Burn" : "Ignite Droplet"}
                      </button>
                      <button
                        onClick={resetSimulation}
                        className="px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] flex items-center gap-1"
                        title="Reset simulation"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                      <button
                        onClick={() => setAirCursorActive(!airCursorActive)}
                        className={`px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1 text-[11px] ${
                          airCursorActive
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.06]"
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>Air from cursor</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      d² law: d(t) = √(d₀² - K·t)
                    </span>
                  </div>

                  {/* Real-time d^2 Law Curve Mini-chart */}
                  <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Droplet Diameter over Time (d²)</span>
                      <span>Burn Progress: {(burnProgress * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-75"
                        style={{ width: `${burnProgress * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 04 Prediction - Right Outputs & Scientific Metrics (3 Cols) */}
                <div className="lg:col-span-3 p-3.5 rounded-lg border border-white/[0.06] bg-[#0c0f16] space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-slate-300 font-semibold text-xs">04 Prediction</span>
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  </div>

                  {/* Extinction Status */}
                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Flame Extinction Status
                    </span>
                    <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          extinctionProbability > 50 ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                      />
                      <span>{predictionStatus}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {extinctionProbability}% radiative extinction risk
                    </div>
                  </div>

                  {/* Burning Rate Constant */}
                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Burning Rate Constant (K)
                    </span>
                    <div className="text-lg font-bold text-cyan-300">
                      {burningRateK.toFixed(2)} <span className="text-xs font-normal text-slate-400">mm²/s</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Learned from NASA FLEX tests</span>
                  </div>

                  {/* Estimated Burn Time */}
                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Total Burn Time
                    </span>
                    <div className="text-lg font-bold text-amber-300">
                      {totalBurnTimeSec.toFixed(1)} <span className="text-xs font-normal text-slate-400">s</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      A {initialDropletMm.toFixed(2)} mm {fuelType} droplet
                    </span>
                  </div>

                  {/* Confidence Level */}
                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Evidence Grounding
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Empirical Flight Data</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Tested on ISS CIR Multi-user Droplet Combustion Apparatus (MDCA) under PSI-69.
                    </p>
                  </div>

                  {/* Action: Ask AI Copilot */}
                  {onAskAI && (
                    <button
                      onClick={() =>
                        onAskAI(
                          `Explain the flame extinction limit and burning rate constant K=${burningRateK} mm²/s for a ${initialDropletMm}mm ${fuelType} droplet at ${o2Pct}% O2 and ${pressureAtm} atm in microgravity.`
                        )
                      }
                      className="w-full py-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask Nemotron AI Copilot</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Optical Diagnostics & CV Filter (Image 2) */
            <div className="space-y-4 font-mono">
              {/* Sequence Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 text-xs">
                <button
                  onClick={() => setDiagSequence("rtdfs")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "rtdfs"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  RTDFS 0.2s Quiescent Spherical Flame
                </button>
                <button
                  onClick={() => setDiagSequence("sofie")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "sofie"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  SoFIE GEL Opposed-Flow 0.5mm PMMA
                </button>
                <button
                  onClick={() => setDiagSequence("hotwire")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "hotwire"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  Ionized Hot-Wire Ignition Sequence
                </button>
              </div>

              {/* Viewport and Right Sidebar Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Viewport & Cross-Section Spectrum (8 Cols) */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-2">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>VIEWPORT: 640x360 · Quiescent 0g</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300 uppercase">FILTER: {cvFilter}</span>
                        <button className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200">
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Frame</span>
                        </button>
                      </div>
                    </div>

                    {/* Synthesized Image Sequence Filmstrip Canvas */}
                    <div className="relative w-full aspect-[16/9] bg-black rounded border border-white/[0.06] overflow-hidden flex items-center justify-center p-2">
                      <div className="grid grid-cols-7 gap-1 w-full h-full items-center">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div
                            key={i}
                            className={`relative aspect-square rounded flex items-center justify-center overflow-hidden border ${
                              cvFilter === "chemiluminescence"
                                ? "bg-blue-950/40 border-cyan-500/30"
                                : cvFilter === "pyrometry"
                                ? "bg-amber-950/40 border-amber-500/30"
                                : cvFilter === "edges"
                                ? "bg-slate-900 border-white/40"
                                : "bg-black border-white/10"
                            }`}
                          >
                            {/* Stylized flame crescent */}
                            <div
                              className={`w-3/4 h-3/4 rounded-full ${
                                cvFilter === "chemiluminescence"
                                  ? "bg-gradient-to-t from-cyan-400 to-blue-600 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                                  : cvFilter === "pyrometry"
                                  ? "bg-gradient-to-t from-yellow-300 via-orange-500 to-red-600"
                                  : cvFilter === "edges"
                                  ? "border-2 border-emerald-400 rounded-full bg-transparent"
                                  : "bg-gradient-to-t from-orange-400 to-amber-600"
                              }`}
                              style={{
                                transform: `scale(${0.6 + (i % 7) * 0.08}) translateY(${(i % 3) * 2}px)`,
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Scanline Indicator Overlay */}
                      <div
                        className="absolute left-0 right-0 border-t border-cyan-400/80 border-dashed pointer-events-none flex items-center justify-between px-2 text-[10px] text-cyan-300 bg-cyan-400/10"
                        style={{ top: `${scanlineYPct}%` }}
                      >
                        <span>SCANLINE Y = {Math.round((scanlineYPct / 100) * 360)}px</span>
                        <span>SPECTRAL EXTRACTION</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 text-center">
                      Hover crosshair over flame canvas to inspect local spectral intensity & temperature.
                    </div>
                  </div>

                  {/* Cross-Section Luminosity Profile Chart */}
                  <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">
                        Cross-Section Luminosity Profile (Scanline Y = {Math.round((scanlineYPct / 100) * 360)}px)
                      </span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-cyan-400">— Blue (CH* 431nm)</span>
                        <span className="text-amber-400">— Red (Thermal Soot)</span>
                      </div>
                    </div>

                    {/* Simulated SVG Spectrum Profile */}
                    <div className="h-20 w-full bg-black/60 rounded border border-white/[0.04] p-2 flex items-end justify-between gap-1 overflow-hidden">
                      {Array.from({ length: 64 }).map((_, idx) => {
                        const distFromCenter = Math.abs(idx - 32);
                        const blueHeight = Math.max(5, 75 - distFromCenter * 2.3 + Math.sin(idx * 0.8) * 8);
                        const sootHeight = Math.max(2, 45 - distFromCenter * 1.8 + Math.cos(idx * 0.5) * 6);

                        return (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full gap-0.5">
                            <div
                              className="w-full bg-cyan-400/80 rounded-t"
                              style={{ height: `${blueHeight}%` }}
                            />
                            <div
                              className="w-full bg-amber-500/80 rounded-t"
                              style={{ height: `${sootHeight}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Scanline Y Slider */}
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="text-slate-400 text-[11px] whitespace-nowrap">Adjust Scanline Y:</span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={scanlineYPct}
                        onChange={(e) => setScanlineYPct(parseFloat(e.target.value))}
                        className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-cyan-300 text-[11px] font-bold w-10 text-right">{scanlineYPct}%</span>
                    </div>
                  </div>
                </div>

                {/* CV Filter Modes & Morphological Metrics (4 Cols) */}
                <div className="lg:col-span-4 space-y-3">
                  {/* CV Filter Modes */}
                  <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
                      <span className="text-slate-300 font-semibold">CV FILTER MODES</span>
                      <span className="text-[10px] text-slate-500">OPENCV EMULATOR</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <button
                        onClick={() => setCvFilter("raw")}
                        className={`p-2 rounded text-left border transition-colors ${
                          cvFilter === "raw"
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="font-semibold">1. Raw Capture</div>
                        <div className="text-[9px] text-slate-500">Unfiltered NASA frame</div>
                      </button>

                      <button
                        onClick={() => setCvFilter("chemiluminescence")}
                        className={`p-2 rounded text-left border transition-colors ${
                          cvFilter === "chemiluminescence"
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="font-semibold">2. Chemiluminescence</div>
                        <div className="text-[9px] text-slate-500">CH* blue vs soot ratio</div>
                      </button>

                      <button
                        onClick={() => setCvFilter("edges")}
                        className={`p-2 rounded text-left border transition-colors ${
                          cvFilter === "edges"
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="font-semibold">3. Edge Contours</div>
                        <div className="text-[9px] text-slate-500">Canny / Otsu perimeter</div>
                      </button>

                      <button
                        onClick={() => setCvFilter("pyrometry")}
                        className={`p-2 rounded text-left border transition-colors ${
                          cvFilter === "pyrometry"
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="font-semibold">4. Pyrometry</div>
                        <div className="text-[9px] text-slate-500">False-color gradient map</div>
                      </button>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Threshold Sensitivity:</span>
                        <span className="text-cyan-300 font-bold">{thresholdSensitivity}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={thresholdSensitivity}
                        onChange={(e) => setThresholdSensitivity(parseInt(e.target.value, 10))}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Morphological Flame Metrics */}
                  <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-2.5">
                    <span className="text-xs text-slate-300 font-semibold block border-b border-white/[0.06] pb-2">
                      MORPHOLOGICAL FLAME METRICS
                    </span>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Sphericity Index (Ψ):</span>
                      <span className="text-cyan-300 font-bold">98.6%</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Peak Flame Core Temp:</span>
                      <span className="text-amber-400 font-bold">1620 K</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Chemiluminescent Ratio:</span>
                      <span className="text-slate-200 font-bold">0.82 (Dominant CH*)</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Radiation Loss Fraction:</span>
                      <span className="text-slate-200 font-bold">Xrad ≈ 0.38</span>
                    </div>
                  </div>

                  {/* Multimodal AI Vision Button */}
                  <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-2">
                    <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                      <Bot className="w-4 h-4" />
                      <span>Nemotron AI Flame Vision</span>
                    </span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Analyze frame spectrum to extract spacecraft compartment fire propagation and suppression safety boundaries.
                    </p>
                    <button
                      onClick={() =>
                        onAskAI &&
                        onAskAI(
                          `Analyze the optical diagnostics of this quiescent 0g flame: Sphericity=98.6%, Peak Temp=1620K, Chemiluminescent Ratio=0.82, Xrad=0.38. Does this indicate radiative extinction risk in exploration atmospheres?`
                        )
                      }
                      className="w-full py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Run AI Flame Diagnostics</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
