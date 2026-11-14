"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  ExternalLink,
  Flame,
  Wind,
  Compass,
  Gauge,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
} from "lucide-react";

interface ExternalDemoEmbedProps {
  initialUrl?: string;
  title?: string;
}

export function ExternalDemoEmbed({
  title = "MySimulator Spacecraft Fire Safety & Flame Ball Interactive",
}: ExternalDemoEmbedProps) {
  // Simulator Controls
  const [gravity, setGravity] = useState<number>(0.0); // 0 = 0g microgravity, 1 = 1g
  const [oxygen, setOxygen] = useState<number>(21.0);  // 10% - 30%
  const [ventilation, setVentilation] = useState<number>(0.2); // 0 to 1
  const [isBurning, setIsBurning] = useState<boolean>(true);
  const [isExtinguished, setIsExtinguished] = useState<boolean>(false);

  // Live Readouts
  const [flameRadiusMm, setFlameRadiusMm] = useState<number>(50.0);
  const [flameTempK, setFlameTempK] = useState<number>(1400);
  const [burnRateMgS, setBurnRateMgS] = useState<number>(1.2);
  const [coPpm, setCoPpm] = useState<number>(12);
  const [statusText, setStatusText] = useState<{ label: string; type: "ok" | "warn" | "danger" }>({
    label: "STABLE DIFFUSION FLAME",
    type: "ok",
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Orbit angle controls
  const [rotX, setRotX] = useState<number>(0.2);
  const [rotY, setRotY] = useState<number>(0.0);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Handle Ignition
  const handleIgnite = () => {
    setIsBurning(true);
    setIsExtinguished(false);
  };

  // Handle Suppress / Vent
  const handleSuppress = () => {
    setIsBurning(false);
    setIsExtinguished(true);
  };

  const handleReset = () => {
    setGravity(0.0);
    setOxygen(21.0);
    setVentilation(0.2);
    setIsBurning(true);
    setIsExtinguished(false);
    setCoPpm(0);
  };

  // 3D Canvas Rendering & Physics Loop (Reverse-Engineered from MySimulator CC BY 4.0)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let simTime = 0;
    let internalRadiusM = isBurning ? 0.05 : 0.0;
    let internalTempK = isBurning ? 1400 : 300;
    let internalBurnMgS = isBurning ? 1.0 : 0.0;
    let internalCoPpm = coPpm;
    let selfExtinctTimer = 0;

    // 3D Smoke & Flame particle system
    const nFlame = 64;
    const flameDirs: Array<{ x: number; y: number; z: number; phase: number; speed: number }> = [];
    for (let i = 0; i < nFlame; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random());
      const sinP = Math.sin(phi);
      flameDirs.push({
        x: r * sinP * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * sinP * Math.sin(theta),
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.5,
      });
    }

    const nSmoke = 45;
    const smokeParticles: Array<{ x: number; y: number; z: number; life: number; spinR: number; ang: number }> = [];
    for (let i = 0; i < nSmoke; i++) {
      smokeParticles.push({
        x: 0,
        y: 0.2 + Math.random() * 0.8,
        z: 0,
        life: Math.random(),
        spinR: 0.05 + Math.random() * 0.15,
        ang: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      const dt = 0.033; // ~30 fps step
      simTime += dt;

      // Physics model
      const o2Factor = oxygen / 21.0;
      const vent = ventilation;
      const choke = (1 - gravity) * (1 - vent);
      const sustain = o2Factor * (1 - 0.7 * choke);

      // Self-extinction check: in microgravity without ventilation, the flame chokes
      if (isBurning && sustain < 0.22) {
        selfExtinctTimer += dt;
        if (selfExtinctTimer > 2.5) {
          setIsBurning(false);
          setIsExtinguished(true);
        }
      } else {
        selfExtinctTimer = Math.max(0, selfExtinctTimer - dt * 2);
      }

      // Target radius: 0g diffusion flames are smaller; 1g buoyant flames stretch bigger
      const targetRadiusM = isBurning
        ? 0.05 + 0.09 * gravity + 0.02 * o2Factor * (1 - gravity * 0.4)
        : 0.0;
      internalRadiusM += (targetRadiusM - internalRadiusM) * Math.min(1, dt * 3);

      const targetTempK = isBurning ? 1400 + 900 * gravity + 500 * Math.min(1, o2Factor) : 300;
      internalTempK += (targetTempK - internalTempK) * Math.min(1, dt * 2);

      const targetBurnMgS = isBurning ? 0.4 + 2.6 * o2Factor * (0.8 + 0.4 * gravity) : 0;
      internalBurnMgS += (targetBurnMgS - internalBurnMgS) * Math.min(1, dt * 2.5);

      // CO production and decay
      const coProdRate = isBurning ? internalBurnMgS * (1.4 - Math.min(1.2, o2Factor)) * 3.2 : 0;
      const coDecay = 6 * vent + 0.4;
      internalCoPpm += (coProdRate - internalCoPpm * coDecay * 0.02) * dt * 10;
      internalCoPpm = Math.max(0, internalCoPpm);

      // Update React state readouts periodically
      if (Math.floor(simTime * 30) % 5 === 0) {
        setFlameRadiusMm(Math.max(0, internalRadiusM * 1000));
        setFlameTempK(Math.round(internalTempK));
        setBurnRateMgS(Math.max(0, internalBurnMgS));
        setCoPpm(Math.round(internalCoPpm));

        if (!isBurning && !isExtinguished && internalRadiusM < 0.005) {
          setStatusText({ label: "STANDBY", type: "ok" });
        } else if (isExtinguished) {
          setStatusText({
            label: selfExtinctTimer > 0 ? "SELF-EXTINGUISHED (CHOKED)" : "SUPPRESSED",
            type: "warn",
          });
        } else if (isBurning && sustain < 0.28) {
          setStatusText({ label: "NEAR EXTINCTION LIMIT", type: "danger" });
        } else if (isBurning && oxygen > 24 && gravity < 0.15) {
          setStatusText({ label: "HAZARD: O₂-ENRICHED FLAME", type: "danger" });
        } else if (isBurning) {
          setStatusText({
            label: gravity < 0.15 ? "STABLE DIFFUSION FLAME" : "BUOYANT FLAME BURNING",
            type: "ok",
          });
        }
      }

      // Draw 3D Chamber Scene
      const width = canvas.width;
      const height = canvas.height;
      ctx.fillStyle = "#07090D";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 30;

      // 3D Perspective Projection Helper
      const project = (px: number, py: number, pz: number) => {
        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Perspective division
        const fov = 400;
        const depth = fov / (fov + z2 + 250);
        return {
          x: cx + x1 * depth * 220,
          y: cy - y2 * depth * 220,
          scale: depth,
        };
      };

      // Draw Chamber Wireframe Box
      ctx.strokeStyle = "#1E242C";
      ctx.lineWidth = 1;
      const boxSize = 1.0;
      const corners = [
        [-boxSize, -0.2, -boxSize],
        [boxSize, -0.2, -boxSize],
        [boxSize, -0.2, boxSize],
        [-boxSize, -0.2, boxSize],
        [-boxSize, 1.4, -boxSize],
        [boxSize, 1.4, -boxSize],
        [boxSize, 1.4, boxSize],
        [-boxSize, 1.4, boxSize],
      ].map(([x, y, z]) => project(x, y, z));

      // Floor grid
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        ctx.moveTo(corners[i].x, corners[i].y);
        ctx.lineTo(corners[next].x, corners[next].y);
        ctx.moveTo(corners[i + 4].x, corners[i + 4].y);
        ctx.lineTo(corners[next + 4].x, corners[next + 4].y);
        ctx.moveTo(corners[i].x, corners[i].y);
        ctx.lineTo(corners[i + 4].x, corners[i + 4].y);
      }
      ctx.stroke();

      // Ventilation Flow Arrows
      if (vent > 0.05) {
        ctx.strokeStyle = "rgba(96, 165, 250, 0.25)";
        ctx.fillStyle = "rgba(96, 165, 250, 0.4)";
        for (let row = -0.6; row <= 0.6; row += 0.4) {
          const arrowX = -0.8 + ((simTime * vent * 1.5 + row) % 1.6);
          const pStart = project(arrowX, 0.2, row);
          const pEnd = project(arrowX + 0.15, 0.2, row);
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();
        }
      }

      // Burner / Fuel Base
      const burnerCenter = project(0, 0, 0);
      ctx.beginPath();
      ctx.arc(burnerCenter.x, burnerCenter.y, 10 * burnerCenter.scale, 0, Math.PI * 2);
      ctx.fillStyle = "#475569";
      ctx.fill();
      ctx.strokeStyle = "#94A3B8";
      ctx.stroke();

      // Render 3D Flame Particles
      const stretch = gravity;
      const rr = internalRadiusM * 2.8;

      if (internalRadiusM > 0.005) {
        for (let i = 0; i < nFlame; i++) {
          const d = flameDirs[i];
          const jitter = 1 + 0.12 * Math.sin(simTime * d.speed * 4 + d.phase);
          const pr = rr * jitter;

          // Stretch upward for gravity (buoyant teardrop plume), stay spherical at 0g
          const yStretch = 1 + stretch * 2.2 * Math.max(0, d.y);
          const px = d.x * pr * (1 - stretch * 0.15);
          const py = 0.15 + d.y * pr * yStretch + stretch * 0.08;
          const pz = d.z * pr * (1 - stretch * 0.15);

          const proj = project(px, py, pz);
          const pSize = Math.max(1.5, (4 + (1 - d.y) * 4) * proj.scale);

          // Color gradient from blue core to yellow/orange tip
          let particleColor = "rgba(59, 130, 246, 0.75)"; // blue reaction
          if (d.y > 0.1) {
            particleColor = "rgba(245, 158, 11, 0.85)"; // luminous yellow
          }
          if (d.y > 0.5 && stretch > 0.3) {
            particleColor = "rgba(239, 68, 68, 0.65)"; // soot tip
          }

          ctx.beginPath();
          ctx.arc(proj.x, proj.y, pSize, 0, Math.PI * 2);
          ctx.fillStyle = particleColor;
          ctx.fill();
        }

        // Central Flame Glow Halo
        const flameCore = project(0, 0.15 + (stretch * 0.1), 0);
        const grad = ctx.createRadialGradient(
          flameCore.x,
          flameCore.y,
          3,
          flameCore.x,
          flameCore.y,
          rr * 90 * flameCore.scale
        );
        grad.addColorStop(0, "rgba(254, 240, 138, 0.85)");
        grad.addColorStop(0.35, "rgba(245, 158, 11, 0.5)");
        grad.addColorStop(0.7, "rgba(59, 130, 246, 0.3)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(flameCore.x, flameCore.y, rr * 90 * flameCore.scale, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Smoke particles (only in 1g / buoyant plume)
      if (isBurning && stretch > 0.25) {
        for (let i = 0; i < nSmoke; i++) {
          const sp = smokeParticles[i];
          sp.y += dt * (0.3 + 0.5 * stretch);
          sp.ang += dt * 0.8;
          sp.life -= dt * 0.3;
          if (sp.life <= 0 || sp.y > 1.3) {
            sp.life = 1;
            sp.y = 0.3 + Math.random() * 0.1;
            sp.ang = Math.random() * Math.PI * 2;
          }

          const px = Math.cos(sp.ang) * sp.spinR;
          const pz = Math.sin(sp.ang) * sp.spinR;
          const spProj = project(px, sp.y, pz);

          ctx.beginPath();
          ctx.arc(spProj.x, spProj.y, 4 * spProj.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(156, 163, 175, ${sp.life * 0.35})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gravity, oxygen, ventilation, isBurning, isExtinguished, rotX, rotY]);

  // Mouse Drag for 3D Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setRotY((y) => y + dx * 0.01);
    setRotX((x) => Math.max(-0.4, Math.min(0.8, x + dy * 0.01)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="space-y-4 p-4 bg-[#111214] border border-[#303134] rounded-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#303134]">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-[#F3F2EF]">{title}</h3>
          </div>
          <p className="text-xs text-[#9EA2A7] mt-0.5">
            Self-contained 3D simulation running client-side with full orbital controls. Zero external iframe dependency.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded bg-[#191A1D] border border-[#303134] text-[#9EA2A7] hover:text-[#F3F2EF]"
            title="Reset simulation parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <a
            href="https://www.mysimulator.uk/space/space-fire-safety/"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded bg-[#191A1D] text-purple-400 border border-[#303134] hover:border-purple-400/50 flex items-center gap-1 font-medium"
          >
            <span>Open on MySimulator.uk</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main 3D Simulation Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 3D WebGL Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-2">
          <div
            className="w-full h-[360px] sm:h-[420px] rounded-lg bg-black border border-[#303134] overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={700}
              height={420}
              className="w-full h-full block"
            />

            {/* Orbit Help Badge */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 border border-[#303134] text-[10px] text-[#9EA2A7] font-mono pointer-events-none">
              Drag to orbit 3D camera
            </div>

            {/* Status Badge in canvas */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                  statusText.type === "ok"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : statusText.type === "warn"
                    ? "bg-amber-950/80 text-amber-300 border-amber-800"
                    : "bg-red-950/80 text-red-300 border-red-800"
                }`}
              >
                {statusText.label}
              </span>
            </div>

            {/* Live Telemetry Overlay in canvas */}
            <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-black/75 border border-[#303134]">
                <div className="text-[10px] text-[#9EA2A7]">Flame Radius</div>
                <div className="font-bold text-[#DDA36B]">{flameRadiusMm.toFixed(1)} mm</div>
              </div>
              <div className="p-2 rounded bg-black/75 border border-[#303134]">
                <div className="text-[10px] text-[#9EA2A7]">Flame Temp</div>
                <div className="font-bold text-amber-400">
                  {isBurning ? `${flameTempK} K` : "— K"}
                </div>
              </div>
              <div className="p-2 rounded bg-black/75 border border-[#303134]">
                <div className="text-[10px] text-[#9EA2A7]">Burn Rate</div>
                <div className="font-bold text-blue-400">{burnRateMgS.toFixed(2)} mg/s</div>
              </div>
              <div className="p-2 rounded bg-black/75 border border-[#303134]">
                <div className="text-[10px] text-[#9EA2A7]">CO Product</div>
                <div className={`font-bold ${coPpm > 40 ? "text-red-400" : "text-emerald-400"}`}>
                  {coPpm} ppm
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Sliders & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3.5 bg-[#191A1D] border border-[#303134] rounded-lg space-y-3 text-xs">
            <h4 className="font-semibold text-[#F3F2EF] uppercase tracking-wider text-[11px] pb-1 border-b border-[#303134]">
              3D Physical Controls
            </h4>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleIgnite}
                className="py-2 px-3 rounded-lg bg-[#DDA36B] hover:bg-[#c99059] text-black font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Ignite</span>
              </button>
              <button
                type="button"
                onClick={handleSuppress}
                className="py-2 px-3 rounded-lg bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-800 font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Suppress / Vent</span>
              </button>
            </div>

            {/* Gravity Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-[#9EA2A7] flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#DDA36B]" />
                  Gravity Level
                </span>
                <span className="font-mono text-[#DDA36B] font-semibold">
                  {gravity === 0 ? "0.00g (Microgravity)" : `${gravity.toFixed(2)}g`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={gravity}
                onChange={(e) => setGravity(Number(e.target.value))}
                className="w-full accent-[#DDA36B]"
              />
              <div className="flex justify-between text-[10px] text-[#9EA2A7]">
                <span>0g (Spherical)</span>
                <span>0.38g (Mars)</span>
                <span>1g (Earth Plume)</span>
              </div>
            </div>

            {/* Oxygen Concentration */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#9EA2A7] flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  Cabin Oxygen
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {oxygen.toFixed(1)}% O₂
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={0.5}
                value={oxygen}
                onChange={(e) => setOxygen(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-[#9EA2A7]">
                <span>12% (Hypoxic)</span>
                <span>21% (Nominal)</span>
                <span>30% (Enriched)</span>
              </div>
            </div>

            {/* Ventilation Flow */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#9EA2A7] flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-400" />
                  Ventilation Flow
                </span>
                <span className="font-mono text-blue-400 font-semibold">
                  {Math.round(ventilation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ventilation}
                onChange={(e) => setVentilation(Number(e.target.value))}
                className="w-full accent-blue-400"
              />
              <div className="flex justify-between text-[10px] text-[#9EA2A7]">
                <span>0% (Quiescent Choke)</span>
                <span>100% (High Draft)</span>
              </div>
            </div>

            {/* Physics Insight Callout */}
            <div className="p-2.5 rounded bg-[#111214] text-[11px] text-[#9EA2A7] space-y-1 border border-[#303134]">
              <div className="text-[#F3F2EF] font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#DDA36B]" />
                Microgravity Physics:
              </div>
              <p>
                At 0g with 0% ventilation, the flame ball forms a sphere and chokes in its own combustion products, triggering self-extinction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attribution & Provenance Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#191A1D] border border-[#303134] text-xs text-[#9EA2A7]">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[#F3F2EF]">
            <strong>Attribution Notice:</strong> 3D physical model adapted and reverse-engineered from{" "}
            <a
              href="https://www.mysimulator.uk"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:underline"
            >
              MySimulator.uk
            </a>{" "}
            under Creative Commons Attribution 4.0 International (CC BY 4.0).
          </p>
          <p className="text-[11px] text-[#9EA2A7]">
            <strong>Standalone & Offline:</strong> Runs completely client-side in WebGL/Canvas to bypass external frame embedding restrictions (<code className="font-mono text-[#DDA36B]">X-Frame-Options: SAMEORIGIN</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
