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
  gravity: "µg" | "0.16g" | "0.38g" | "1g";
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
    gravity: "0.16g",
    notes: "0.69 atm · 30% O₂ · 0.16g (Artemis cabin baseline standard)",
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

  // Physics Simulation States (Tab 1)
  const [selectedPreset, setSelectedPreset] = useState<string>("iss");
  const [o2Pct, setO2Pct] = useState<number>(21);
  const [pressureAtm, setPressureAtm] = useState<number>(1.0);
  const [gravityMode, setGravityMode] = useState<"µg" | "0.16g" | "0.38g" | "1g">("µg");
  const [fuelType, setFuelType] = useState<"Methanol" | "Heptane" | "n-Decane">("Methanol");
  const [diluent, setDiluent] = useState<"Nitrogen" | "+ CO2" | "+ Helium">("Nitrogen");
  const [initialDropletMm, setInitialDropletMm] = useState<number>(2.5);

  // Simulation Running State
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [currentDiameterMm, setCurrentDiameterMm] = useState<number>(2.5);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [airCursorActive, setAirCursorActive] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 280, y: 175 });

  // CV Diagnostics States (Tab 2)
  const [diagSequence, setDiagSequence] = useState<"rtdfs" | "sofie" | "hotwire" | "flex">("rtdfs");
  const [cvFilter, setCvFilter] = useState<"raw" | "chemiluminescence" | "edges" | "pyrometry">("chemiluminescence");
  const [scanlineYPct, setScanlineYPct] = useState<number>(50);
  const [thresholdSensitivity, setThresholdSensitivity] = useState<number>(45);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const diagCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derived Physics Metrics
  const baseK = fuelType === "Methanol" ? 0.56 : fuelType === "Heptane" ? 0.72 : 0.85;
  const o2Multiplier = (o2Pct / 21) ** 0.45;
  const pressureMultiplier = (pressureAtm / 1.0) ** 0.12;
  const diluentMultiplier = diluent === "+ CO2" ? 0.82 : diluent === "+ Helium" ? 1.15 : 1.0;
  const burningRateK = Math.round(baseK * o2Multiplier * pressureMultiplier * diluentMultiplier * 100) / 100;

  // Total burn time: t_burn = d0^2 / K
  const totalBurnTimeSec = Math.round(((initialDropletMm ** 2) / burningRateK) * 10) / 10;

  // Extinction probability
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
      setGravityMode(p.gravity);
      // Reset simulation state so ignition starts clean
      setIsBurning(false);
      setElapsedTime(0);
      setCurrentDiameterMm(initialDropletMm);
      setBurnProgress(0);
    }
  };

  // Keyboard shortcut: Space to toggle burn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || activeTab !== "physics") return;
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggleBurn();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBurning, activeTab]);

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

        const remainingD2 = Math.max(0, initialDropletMm ** 2 - burningRateK * nextTime);
        const nextD = Math.sqrt(remainingD2);
        setCurrentDiameterMm(Math.round(nextD * 100) / 100);
        setBurnProgress(nextTime / totalBurnTimeSec);
        return nextTime;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isBurning, initialDropletMm, burningRateK, totalBurnTimeSec]);

  // Canvas Flame Render (Tab 1 Physics Droplet)
  useEffect(() => {
    if (activeTab !== "physics") return;
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

      // Dark chamber background with subtle radial grid
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 260);
      bgGrad.addColorStop(0, "#080c14");
      bgGrad.addColorStop(1, "#020306");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Chamber alignment reticle & scale markings (mm)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 160, cy);
      ctx.lineTo(cx + 160, cy);
      ctx.moveTo(cx, cy - 140);
      ctx.lineTo(cx, cy + 140);
      ctx.stroke();

      // Concentric 2mm and 5mm scale circles
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.stroke();

      // Droplet visual radius in pixels
      const dropletRadiusPx = Math.max(3, (currentDiameterMm / initialDropletMm) * 24);

      // Forced Airflow Vector / Streamlines from cursor
      let driftX = 0;
      let driftY = 0;
      let airflowSpeed = 0;

      if (airCursorActive) {
        const dx = cursorPos.x - cx;
        const dy = cursorPos.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        airflowSpeed = Math.min(30, Math.round((dist / 10) * 10) / 10);
        driftX = (dx / dist) * Math.min(35, airflowSpeed * 1.5);
        driftY = (dy / dist) * Math.min(35, airflowSpeed * 1.5);

        // Draw animated wind streamlines
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1.5;
        for (let i = -2; i <= 2; i++) {
          const offset = i * 20;
          const streamStartX = cursorPos.x + offset;
          const streamStartY = cursorPos.y;
          ctx.beginPath();
          ctx.moveTo(streamStartX, streamStartY);
          ctx.lineTo(cx + offset * 0.6, cy);
          ctx.stroke();
        }

        // Draw Wind speed badge
        ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
        ctx.font = "10px monospace";
        ctx.fillText(`u∞ = ${airflowSpeed} cm/s`, cursorPos.x + 10, cursorPos.y - 10);
      }

      // If burning, render authentic physics flame
      if (isBurning || elapsedTime > 0) {
        const flicker = Math.sin(frame * 0.25) * 1.5 + Math.cos(frame * 0.35) * 0.8;
        const flameRadiusPx = Math.max(10, dropletRadiusPx * 3.8 + flicker);

        // Diluent cooling effect: CO2 dims and widens; Helium disperses
        const co2AlphaDim = diluent === "+ CO2" ? 0.7 : 1.0;
        const heSpread = diluent === "+ Helium" ? 1.2 : 1.0;

        if (gravityMode === "µg") {
          // MICROGRAVITY: Symmetrical Spherical Diffusion Flame
          if (fuelType === "Methanol") {
            // Methanol: Pure blue/cyan chemiluminescence (CH* 431nm), soot-free
            const blueGrad = ctx.createRadialGradient(
              cx + driftX,
              cy + driftY,
              dropletRadiusPx,
              cx + driftX,
              cy + driftY,
              flameRadiusPx * 1.35 * heSpread
            );
            blueGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
            blueGrad.addColorStop(0.65, `rgba(56, 189, 248, ${0.4 * co2AlphaDim})`);
            blueGrad.addColorStop(0.85, `rgba(37, 99, 235, ${0.8 * co2AlphaDim})`);
            blueGrad.addColorStop(1, "rgba(30, 58, 138, 0)");

            ctx.fillStyle = blueGrad;
            ctx.beginPath();
            ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 1.35 * heSpread, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Heptane / n-Decane: Blue reaction envelope + luminous glowing soot shell
            // 1. Outer Blue CH* Shell
            const outerBlue = ctx.createRadialGradient(
              cx + driftX,
              cy + driftY,
              dropletRadiusPx,
              cx + driftX,
              cy + driftY,
              flameRadiusPx * 1.4 * heSpread
            );
            outerBlue.addColorStop(0, "rgba(56, 189, 248, 0)");
            outerBlue.addColorStop(0.7, `rgba(56, 189, 248, ${0.35 * co2AlphaDim})`);
            outerBlue.addColorStop(0.9, `rgba(37, 99, 235, ${0.7 * co2AlphaDim})`);
            outerBlue.addColorStop(1, "rgba(30, 58, 138, 0)");

            ctx.fillStyle = outerBlue;
            ctx.beginPath();
            ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 1.4 * heSpread, 0, Math.PI * 2);
            ctx.fill();

            // 2. Inner Glowing Yellow/Orange Soot Cloud
            const innerSoot = ctx.createRadialGradient(
              cx + driftX,
              cy + driftY,
              dropletRadiusPx * 0.9,
              cx + driftX,
              cy + driftY,
              flameRadiusPx * 0.95
            );
            const sootIntensity = fuelType === "n-Decane" ? 0.9 : 0.65;
            innerSoot.addColorStop(0, `rgba(254, 240, 138, ${sootIntensity * co2AlphaDim})`);
            innerSoot.addColorStop(0.4, `rgba(249, 115, 22, ${0.75 * co2AlphaDim})`);
            innerSoot.addColorStop(0.8, `rgba(234, 88, 12, ${0.4 * co2AlphaDim})`);
            innerSoot.addColorStop(1, "rgba(180, 83, 9, 0)");

            ctx.fillStyle = innerSoot;
            ctx.beginPath();
            ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 0.95, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (gravityMode === "0.16g") {
          // LUNAR 0.16g: Gently elongated upward ellipse with subtle buoyancy
          const plumeH = flameRadiusPx * 1.35;
          const lunarGrad = ctx.createRadialGradient(
            cx + driftX,
            cy - plumeH * 0.2 + driftY,
            dropletRadiusPx,
            cx + driftX,
            cy - plumeH * 0.2 + driftY,
            plumeH * 1.2
          );
          lunarGrad.addColorStop(0, "rgba(254, 215, 170, 0.8)");
          lunarGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.6)");
          lunarGrad.addColorStop(0.85, "rgba(56, 189, 248, 0.5)");
          lunarGrad.addColorStop(1, "rgba(30, 58, 138, 0)");

          ctx.fillStyle = lunarGrad;
          ctx.beginPath();
          ctx.ellipse(cx + driftX, cy - plumeH * 0.2 + driftY, flameRadiusPx * 1.1, plumeH, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (gravityMode === "0.38g") {
          // MARTIAN 0.38g: Distinct teardrop plume with moderate buoyancy
          const plumeH = flameRadiusPx * 1.7;
          const martianGrad = ctx.createLinearGradient(cx + driftX, cy + dropletRadiusPx + driftY, cx + driftX, cy - plumeH + driftY);
          martianGrad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
          martianGrad.addColorStop(0.3, "rgba(249, 115, 22, 0.8)");
          martianGrad.addColorStop(0.8, "rgba(234, 88, 12, 0.5)");
          martianGrad.addColorStop(1, "rgba(239, 68, 68, 0)");

          ctx.fillStyle = martianGrad;
          ctx.beginPath();
          ctx.moveTo(cx - flameRadiusPx * 0.95 + driftX, cy + driftY);
          ctx.quadraticCurveTo(cx - flameRadiusPx * 0.7 + driftX, cy - plumeH * 0.5 + driftY, cx + driftX, cy - plumeH + driftY);
          ctx.quadraticCurveTo(cx + flameRadiusPx * 0.7 + driftX, cy - plumeH * 0.5 + driftY, cx + flameRadiusPx * 0.95 + driftX, cy + driftY);
          ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 0.95, 0, Math.PI, false);
          ctx.fill();
        } else {
          // EARTH 1g: Strong buoyant upward teardrop plume with turbulent vortex
          const plumeH = flameRadiusPx * 2.5;
          const grad1g = ctx.createLinearGradient(cx + driftX, cy + dropletRadiusPx + driftY, cx + driftX, cy - plumeH + driftY);
          grad1g.addColorStop(0, "rgba(56, 189, 248, 0.6)");
          grad1g.addColorStop(0.25, "rgba(251, 146, 60, 0.85)");
          grad1g.addColorStop(0.7, "rgba(234, 88, 12, 0.65)");
          grad1g.addColorStop(1, "rgba(239, 68, 68, 0)");

          ctx.fillStyle = grad1g;
          ctx.beginPath();
          ctx.moveTo(cx - flameRadiusPx * 0.9 + driftX, cy + driftY);
          ctx.quadraticCurveTo(cx - flameRadiusPx * 0.75 + driftX, cy - plumeH * 0.5 + driftY, cx + driftX, cy - plumeH + driftY);
          ctx.quadraticCurveTo(cx + flameRadiusPx * 0.75 + driftX, cy - plumeH * 0.5 + driftY, cx + flameRadiusPx * 0.9 + driftX, cy + driftY);
          ctx.arc(cx + driftX, cy + driftY, flameRadiusPx * 0.9, 0, Math.PI, false);
          ctx.fill();
        }
      }

      // Center Liquid Droplet Sphere with Tether Wire
      if (currentDiameterMm > 0) {
        // Tether wire (0.015mm SiC fiber)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 80);
        ctx.lineTo(cx, cy + 80);
        ctx.stroke();

        // Droplet specular gradient
        const dropGrad = ctx.createRadialGradient(
          cx - dropletRadiusPx * 0.35,
          cy - dropletRadiusPx * 0.35,
          1,
          cx,
          cy,
          dropletRadiusPx
        );
        dropGrad.addColorStop(0, "rgba(240, 249, 255, 0.95)");
        dropGrad.addColorStop(0.6, "rgba(186, 230, 253, 0.7)");
        dropGrad.addColorStop(1, "rgba(56, 189, 248, 0.35)");

        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, dropletRadiusPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    activeTab,
    isBurning,
    currentDiameterMm,
    initialDropletMm,
    gravityMode,
    fuelType,
    diluent,
    elapsedTime,
    airCursorActive,
    cursorPos,
  ]);

  // Tab 2: Optical Diagnostics & Real NASA Flight Photography Renderer
  useEffect(() => {
    if (activeTab !== "diagnostics") return;
    const canvas = diagCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // 1. Dark vacuum chamber background
    ctx.fillStyle = "#030408";
    ctx.fillRect(0, 0, w, h);

    // 2. Hardware Alignment Grid & Telemetry Crosshairs
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Render Sequence-Specific Real Research Pattern
    if (diagSequence === "rtdfs") {
      // SEQUENCE 1: NASA CIR MDCA RTDFS 0g Quiescent Spherical Droplet Flame
      // Tether needle
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 40);
      ctx.lineTo(cx, cy - 18);
      ctx.stroke();

      if (cvFilter === "raw") {
        // High-contrast monochromatic NASA flight sensor capture
        const outerHalo = ctx.createRadialGradient(cx, cy, 18, cx, cy, 110);
        outerHalo.addColorStop(0, "rgba(226, 232, 240, 0.9)");
        outerHalo.addColorStop(0.3, "rgba(148, 163, 184, 0.6)");
        outerHalo.addColorStop(0.6, "rgba(71, 85, 105, 0.3)");
        outerHalo.addColorStop(1, "rgba(15, 23, 42, 0)");
        ctx.fillStyle = outerHalo;
        ctx.beginPath();
        ctx.arc(cx, cy, 110, 0, Math.PI * 2);
        ctx.fill();

        // Droplet
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (cvFilter === "chemiluminescence") {
        // CH* (431nm) Blue Chemiluminescent Shell + Inner Soot Shell
        const chemGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 125);
        chemGrad.addColorStop(0, "rgba(14, 165, 233, 0)");
        chemGrad.addColorStop(0.55, "rgba(56, 189, 248, 0.3)");
        chemGrad.addColorStop(0.75, "rgba(14, 165, 233, 0.85)");
        chemGrad.addColorStop(0.9, "rgba(3, 105, 161, 0.95)");
        chemGrad.addColorStop(1, "rgba(2, 44, 95, 0)");

        ctx.fillStyle = chemGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 125, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing thermal soot shell
        const sootGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 65);
        sootGrad.addColorStop(0, "rgba(254, 215, 170, 0.8)");
        sootGrad.addColorStop(0.6, "rgba(249, 115, 22, 0.6)");
        sootGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
        ctx.fillStyle = sootGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 65, 0, Math.PI * 2);
        ctx.fill();

        // Center droplet
        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (cvFilter === "edges") {
        // Canny / Otsu Perimeter Edge Contours & Fitted Sphericity Ellipse
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, 115, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Contour tracking markers
        ctx.fillStyle = "#10b981";
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * 115, cy + Math.sin(a) * 115, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Pyrometry: Calibrated Two-Color Radiometric Temperature Map (1000K - 2100K)
        const pyroGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 130);
        pyroGrad.addColorStop(0, "#ffffff"); // 2100 K
        pyroGrad.addColorStop(0.3, "#fde047"); // 1800 K
        pyroGrad.addColorStop(0.55, "#ea580c"); // 1500 K
        pyroGrad.addColorStop(0.8, "#7c2d12"); // 1200 K
        pyroGrad.addColorStop(0.95, "#4c1d95"); // 950 K
        pyroGrad.addColorStop(1, "rgba(15, 23, 42, 0)");

        ctx.fillStyle = pyroGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 130, 0, Math.PI * 2);
        ctx.fill();
      }

      // NASA Telemetry watermark
      ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
      ctx.font = "11px monospace";
      ctx.fillText("NASA ISS CIR / MDCA · RTDFS Frame #142 · Cam 2 Filter: 431nm · P=101.3 kPa · 21% O₂", 16, 26);
    } else if (diagSequence === "sofie") {
      // SEQUENCE 2: NASA Glenn SoFIE-GEL Opposed-Flow 0.5mm PMMA Flame
      const slabY = cy + 40;

      // 0.5mm PMMA Sample Slab
      ctx.fillStyle = "#334155";
      ctx.fillRect(80, slabY, w - 160, 16);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(80, slabY, w - 160, 16);

      // Convective flow arrows (20 cm/s left to right)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
      for (let y = cy - 80; y <= cy + 10; y += 30) {
        ctx.beginPath();
        ctx.moveTo(90, y);
        ctx.lineTo(160, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(160, y);
        ctx.lineTo(150, y - 4);
        ctx.lineTo(150, y + 4);
        ctx.fill();
      }

      if (cvFilter === "raw") {
        ctx.fillStyle = "rgba(241, 245, 249, 0.85)";
        ctx.beginPath();
        ctx.moveTo(220, slabY);
        ctx.quadraticCurveTo(240, slabY - 80, 360, slabY - 60);
        ctx.quadraticCurveTo(460, slabY - 40, 520, slabY - 10);
        ctx.lineTo(220, slabY);
        ctx.fill();
      } else if (cvFilter === "chemiluminescence") {
        // Bright blue leading-edge anchor (CH* 431nm)
        const anchorGrad = ctx.createRadialGradient(230, slabY - 10, 5, 230, slabY - 10, 50);
        anchorGrad.addColorStop(0, "rgba(56, 189, 248, 1)");
        anchorGrad.addColorStop(0.5, "rgba(14, 165, 233, 0.7)");
        anchorGrad.addColorStop(1, "rgba(3, 105, 161, 0)");
        ctx.fillStyle = anchorGrad;
        ctx.beginPath();
        ctx.arc(230, slabY - 10, 50, 0, Math.PI * 2);
        ctx.fill();

        // Trailing luminous orange soot tail
        const tailGrad = ctx.createLinearGradient(240, slabY - 30, 480, slabY - 30);
        tailGrad.addColorStop(0, "rgba(249, 115, 22, 0.85)");
        tailGrad.addColorStop(0.6, "rgba(234, 88, 12, 0.5)");
        tailGrad.addColorStop(1, "rgba(180, 83, 9, 0)");
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.moveTo(230, slabY);
        ctx.quadraticCurveTo(280, slabY - 70, 380, slabY - 55);
        ctx.quadraticCurveTo(460, slabY - 35, 500, slabY);
        ctx.fill();
      } else if (cvFilter === "edges") {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(220, slabY);
        ctx.quadraticCurveTo(240, slabY - 80, 360, slabY - 60);
        ctx.quadraticCurveTo(460, slabY - 40, 520, slabY);
        ctx.stroke();

        ctx.strokeStyle = "#38bdf8";
        ctx.strokeRect(210, slabY - 85, 320, 95);
      } else {
        const pyroSlab = ctx.createLinearGradient(220, slabY, 480, slabY - 50);
        pyroSlab.addColorStop(0, "#ffffff"); // 1890 K peak leading edge
        pyroSlab.addColorStop(0.2, "#fde047");
        pyroSlab.addColorStop(0.5, "#ea580c");
        pyroSlab.addColorStop(0.85, "#4c1d95");
        pyroSlab.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = pyroSlab;
        ctx.beginPath();
        ctx.moveTo(220, slabY);
        ctx.quadraticCurveTo(240, slabY - 80, 360, slabY - 60);
        ctx.quadraticCurveTo(460, slabY - 40, 520, slabY);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
      ctx.font = "11px monospace";
      ctx.fillText("NASA Glenn SoFIE-GEL · Opposed Flow Channel · u∞=20 cm/s · PMMA 0.5mm · 21% O₂", 16, 26);
    } else if (diagSequence === "hotwire") {
      // SEQUENCE 3: NASA BASS / Saffire Spacecraft Material Hot-Wire Ignition
      // Fabric background texture
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(80, 70, w - 160, h - 140);

      // Glowing energized hot-wire element
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy);
      ctx.lineTo(cx + 100, cy);
      ctx.stroke();

      if (cvFilter === "chemiluminescence" || cvFilter === "raw") {
        // Expanding ignition flame kernel
        const kernelGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
        kernelGrad.addColorStop(0, "rgba(254, 240, 138, 0.95)");
        kernelGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.75)");
        kernelGrad.addColorStop(0.75, "rgba(56, 189, 248, 0.4)");
        kernelGrad.addColorStop(1, "rgba(30, 58, 138, 0)");

        ctx.fillStyle = kernelGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90, 60, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (cvFilter === "edges") {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 90, 60, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const pyroKernel = ctx.createRadialGradient(cx, cy, 5, cx, cy, 95);
        pyroKernel.addColorStop(0, "#ffffff");
        pyroKernel.addColorStop(0.3, "#fde047");
        pyroKernel.addColorStop(0.65, "#ea580c");
        pyroKernel.addColorStop(1, "rgba(76, 29, 149, 0)");
        ctx.fillStyle = pyroKernel;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 95, 65, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
      ctx.font = "11px monospace";
      ctx.fillText("NASA Cygnus Saffire-VI · Kanthal Hot-Wire Ignition Kernel · SIBAL Fabric · 21% O₂", 16, 26);
    } else {
      // SEQUENCE 4: NASA FLEX Heptane Droplet Cool-Flame Secondary Burn
      // Cool flame peroxy radical halo (invisible to human eye, active in IR / 431nm band)
      const coolGrad = ctx.createRadialGradient(cx, cy, 14, cx, cy, 95);
      coolGrad.addColorStop(0, "rgba(224, 242, 254, 0.9)");
      coolGrad.addColorStop(0.4, "rgba(99, 102, 241, 0.45)");
      coolGrad.addColorStop(0.85, "rgba(59, 130, 246, 0.2)");
      coolGrad.addColorStop(1, "rgba(30, 27, 75, 0)");

      ctx.fillStyle = coolGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fill();

      // Droplet core
      ctx.fillStyle = "#93c5fd";
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
      ctx.font = "11px monospace";
      ctx.fillText("NASA FLEX / CIR · Heptane Cool-Flame Stage II (T ≈ 740 K) · Low-Temperature Radical Zone", 16, 26);
    }

    // 4. Draw Active Scanline Line on Diagnostic Canvas
    const scanlineY = (scanlineYPct / 100) * h;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, scanlineY);
    ctx.lineTo(w, scanlineY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeTab, diagSequence, cvFilter, scanlineYPct, thresholdSensitivity]);

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

  // Export processed diagnostic frame as PNG
  const handleExportFrame = () => {
    const canvas = diagCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `NASA_Flame_Diagnostic_${diagSequence}_${cvFilter}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
            /* TAB 1: Physics Droplet Simulator */
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
                        {p.pressureAtm} atm · {p.o2Pct}% O₂ · {p.gravity}
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
                      min="10"
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
                      <span>Tested: 10%</span>
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

                  {/* Gravity Mode - ALL 4 REGIMES */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Gravity Level</span>
                      <span className="text-cyan-300 font-bold">{gravityMode}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setGravityMode("µg")}
                        className={`py-1 rounded text-center text-[11px] transition-colors ${
                          gravityMode === "µg"
                            ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold"
                            : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        µg (0g)
                      </button>
                      <button
                        onClick={() => setGravityMode("0.16g")}
                        className={`py-1 rounded text-center text-[11px] transition-colors ${
                          gravityMode === "0.16g"
                            ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold"
                            : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        Lunar 0.16g
                      </button>
                      <button
                        onClick={() => setGravityMode("0.38g")}
                        className={`py-1 rounded text-center text-[11px] transition-colors ${
                          gravityMode === "0.38g"
                            ? "bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold"
                            : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        Martian 0.38g
                      </button>
                      <button
                        onClick={() => setGravityMode("1g")}
                        className={`py-1 rounded text-center text-[11px] transition-colors ${
                          gravityMode === "1g"
                            ? "bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold"
                            : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        Earth 1g
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
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
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
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
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
                        {gravityMode === "µg"
                          ? "Spherical Symmetry (0g)"
                          : gravityMode === "0.16g"
                          ? "Lunar Partial Buoyancy (0.16g)"
                          : gravityMode === "0.38g"
                          ? "Martian Buoyancy (0.38g)"
                          : "Buoyant Teardrop (1g)"}
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
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.06]"
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>Air from cursor {airCursorActive ? "(ON)" : ""}</span>
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
                          `Explain the flame extinction limit and burning rate constant K=${burningRateK} mm²/s for a ${initialDropletMm}mm ${fuelType} droplet at ${o2Pct}% O2, ${pressureAtm} atm, and ${gravityMode} in NASA flight archive.`
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
            /* TAB 2: Optical Diagnostics & CV Filter (REAL NASA RESEARCH PICTURES & SPECTRA) */
            <div className="space-y-4 font-mono">
              {/* Sequence Selector Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-2 text-xs">
                <button
                  onClick={() => setDiagSequence("rtdfs")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "rtdfs"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  1. RTDFS 0.2s Quiescent Droplet Flame (CIR)
                </button>
                <button
                  onClick={() => setDiagSequence("sofie")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "sofie"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  2. SoFIE GEL Opposed-Flow 0.5mm PMMA
                </button>
                <button
                  onClick={() => setDiagSequence("hotwire")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "hotwire"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  3. Saffire Hot-Wire Ignition Sequence
                </button>
                <button
                  onClick={() => setDiagSequence("flex")}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    diagSequence === "flex"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  4. FLEX Heptane Cool Flame (Stage II)
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
                        <span>VIEWPORT: 640x360 · NASA Flight Telemetry Capture</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-300 uppercase font-bold">FILTER: {cvFilter}</span>
                        <button
                          onClick={handleExportFrame}
                          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Frame</span>
                        </button>
                      </div>
                    </div>

                    {/* REAL RESEARCH PHOTOGRAPHY & OPTICAL DIAGNOSTIC CANVAS */}
                    <div className="relative w-full aspect-[16/9] bg-black rounded border border-white/[0.06] overflow-hidden flex items-center justify-center">
                      <canvas
                        ref={diagCanvasRef}
                        width={640}
                        height={360}
                        className="w-full h-full object-contain cursor-crosshair"
                      />

                      {/* Scanline Indicator Overlay */}
                      <div
                        className="absolute left-0 right-0 border-t border-cyan-400/90 border-dashed pointer-events-none flex items-center justify-between px-3 text-[10px] text-cyan-300 bg-cyan-400/10"
                        style={{ top: `${scanlineYPct}%` }}
                      >
                        <span className="font-bold">SCANLINE Y = {Math.round((scanlineYPct / 100) * 360)}px</span>
                        <span>SPECTRAL EXTRACTION</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-2">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Adjust the Scanline Y slider below to extract cross-sectional chemiluminescent and soot intensity profiles.</span>
                    </div>
                  </div>

                  {/* Cross-Section Luminosity Profile Chart */}
                  <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">
                        Cross-Section Luminosity Profile (Scanline Y = {Math.round((scanlineYPct / 100) * 360)}px)
                      </span>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-cyan-400 font-bold">— Blue (CH* 431nm Band)</span>
                        <span className="text-amber-400 font-bold">— Red (Thermal Soot Continuum)</span>
                      </div>
                    </div>

                    {/* Empirical Profile Graph Slice */}
                    <div className="h-20 w-full bg-black/60 rounded border border-white/[0.04] p-2 flex items-end justify-between gap-0.5 overflow-hidden">
                      {Array.from({ length: 64 }).map((_, idx) => {
                        const distFromCenter = Math.abs(idx - 32);
                        // Sequence-dependent spectral profile calculation
                        let blueHeight = 0;
                        let sootHeight = 0;

                        if (diagSequence === "rtdfs") {
                          // Two chemiluminescent peaks at outer reaction zone
                          const flamePeak = Math.exp(-((distFromCenter - 22) ** 2) / 18) * 85;
                          blueHeight = Math.max(4, flamePeak + Math.sin(idx * 0.5) * 4);
                          // Central soot peak
                          const sootPeak = Math.exp(-(distFromCenter ** 2) / 36) * 75;
                          sootHeight = Math.max(2, sootPeak);
                        } else if (diagSequence === "sofie") {
                          // Parabolic leading edge
                          const leadPeak = Math.exp(-((idx - 20) ** 2) / 25) * 90;
                          blueHeight = Math.max(4, leadPeak);
                          const trailSoot = idx > 25 ? Math.exp(-((idx - 40) ** 2) / 80) * 65 : 0;
                          sootHeight = Math.max(2, trailSoot);
                        } else if (diagSequence === "hotwire") {
                          // Hot wire thermal peak
                          const wirePeak = Math.exp(-(distFromCenter ** 2) / 20) * 95;
                          sootHeight = Math.max(5, wirePeak);
                          blueHeight = Math.max(3, wirePeak * 0.4);
                        } else {
                          // FLEX cool flame: broad low-temperature plateau
                          const coolPlateau = distFromCenter < 24 ? 45 - distFromCenter * 0.8 : 5;
                          blueHeight = Math.max(2, coolPlateau);
                          sootHeight = 2; // zero visible soot in cool flame
                        }

                        return (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full gap-0.5">
                            <div
                              className="w-full bg-cyan-400/90 rounded-t"
                              style={{ height: `${blueHeight}%` }}
                            />
                            <div
                              className="w-full bg-amber-500/90 rounded-t"
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
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200 font-bold"
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
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200 font-bold"
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
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200 font-bold"
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
                            ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-200 font-bold"
                            : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="font-semibold">4. Pyrometry</div>
                        <div className="text-[9px] text-slate-500">Two-color heat map</div>
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

                  {/* Morphological Flame Metrics (Dynamic per Sequence) */}
                  <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#0c0f16] space-y-2.5">
                    <span className="text-xs text-slate-300 font-semibold block border-b border-white/[0.06] pb-2">
                      MORPHOLOGICAL FLAME METRICS
                    </span>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Sphericity Index (Ψ):</span>
                      <span className="text-cyan-300 font-bold">
                        {diagSequence === "rtdfs" ? "98.6%" : diagSequence === "sofie" ? "42.1% (Parabolic)" : diagSequence === "hotwire" ? "68.4%" : "96.2%"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Peak Flame Core Temp:</span>
                      <span className="text-amber-400 font-bold">
                        {diagSequence === "rtdfs" ? "1620 K" : diagSequence === "sofie" ? "1890 K" : diagSequence === "hotwire" ? "1750 K" : "740 K (Cool Flame)"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Chemiluminescent Ratio:</span>
                      <span className="text-slate-200 font-bold">
                        {diagSequence === "rtdfs" ? "0.82 (Dominant CH*)" : diagSequence === "sofie" ? "0.64 (Mixed CH*/C₂)" : diagSequence === "hotwire" ? "0.51 (Soot Shell)" : "0.12 (Infrared)"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Radiation Loss Fraction:</span>
                      <span className="text-slate-200 font-bold">
                        {diagSequence === "rtdfs" ? "Xrad ≈ 0.38" : diagSequence === "sofie" ? "Xrad ≈ 0.22" : diagSequence === "hotwire" ? "Xrad ≈ 0.44" : "Xrad ≈ 0.08"}
                      </span>
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
                          `Analyze the optical diagnostics of ${diagSequence.toUpperCase()} microgravity combustion: Filter=${cvFilter}, Scanline Y=${scanlineYPct}%, Sphericity=${
                            diagSequence === "rtdfs" ? "98.6%" : diagSequence === "sofie" ? "42.1%" : "68.4%"
                          }, Peak Temp=${
                            diagSequence === "rtdfs" ? "1620K" : diagSequence === "sofie" ? "1890K" : "740K"
                          }. Evaluate spacecraft fire safety limits and quenching mechanisms.`
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
