"use client";

import React, { useRef, useEffect, useState } from "react";
import { Sparkles, AlertTriangle, Wind, Compass } from "lucide-react";

interface ConceptFlameCanvasProps {
  gravityMode: number; // 0 = 0g microgravity, 1 = 1g Earth
  airflowCmS: number;  // 0 to 30 cm/s
  onToggleGravity?: (mode: number) => void;
  onAirflowChange?: (flow: number) => void;
}

export function ConceptFlameCanvas({
  gravityMode,
  airflowCmS,
  onToggleGravity,
  onAirflowChange,
}: ConceptFlameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalGravity, setInternalGravity] = useState(gravityMode);
  const [internalFlow, setInternalFlow] = useState(airflowCmS);

  // Sync props
  useEffect(() => {
    setInternalGravity(gravityMode);
  }, [gravityMode]);

  useEffect(() => {
    setInternalFlow(airflowCmS);
  }, [airflowCmS]);

  const handleGravityChange = (g: number) => {
    setInternalGravity(g);
    onToggleGravity?.(g);
  };

  const handleFlowChange = (f: number) => {
    setInternalFlow(f);
    onAirflowChange?.(f);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Soot particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      alpha: number;
    }> = [];

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2 + 20;

    const render = () => {
      time += 0.05;

      // Clear with dark chamber background
      ctx.fillStyle = "#0A0C0F";
      ctx.fillRect(0, 0, width, height);

      // Grid / Chamber chamber lines
      ctx.strokeStyle = "#1A1E24";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Airflow stream arrows
      if (internalFlow > 0) {
        ctx.strokeStyle = "rgba(96, 165, 250, 0.25)";
        ctx.fillStyle = "rgba(96, 165, 250, 0.4)";
        ctx.lineWidth = 1;

        const flowOffset = (time * internalFlow * 1.5) % 40;
        for (let row = 40; row < height - 30; row += 45) {
          ctx.beginPath();
          ctx.moveTo(20, row);
          ctx.lineTo(width - 30, row);
          ctx.stroke();

          // Arrowhead
          const ax = ((20 + flowOffset + (row * 3)) % (width - 60)) + 30;
          ctx.beginPath();
          ctx.moveTo(ax, row - 3);
          ctx.lineTo(ax + 6, row);
          ctx.lineTo(ax, row + 3);
          ctx.fill();
        }
      }

      // Fuel Droplet / Specimen at center
      const dropletRadius = 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dropletRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#94A3B8";
      ctx.fill();
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flame rendering based on gravity regime
      const isMicrogravity = internalGravity === 0;
      const flowDeflection = (internalFlow / 30) * 45; // pixels deflection to right
      const flicker = Math.sin(time * 3) * 2 + Math.cos(time * 5) * 1.5;

      if (isMicrogravity) {
        // --- 0g Microgravity Spherical Diffusion Flame ---
        const flameRadius = 45 + flicker;
        const flameCenterOffsetX = flowDeflection * 0.4;

        // Radial diffuse glow
        const glowGrad = ctx.createRadialGradient(
          centerX + flameCenterOffsetX,
          centerY,
          dropletRadius,
          centerX + flameCenterOffsetX,
          centerY,
          flameRadius + 20
        );
        glowGrad.addColorStop(0, "rgba(59, 130, 246, 0.85)"); // Blue reaction zone at base
        glowGrad.addColorStop(0.35, "rgba(234, 179, 8, 0.7)"); // Luminous yellow/orange
        glowGrad.addColorStop(0.7, "rgba(239, 68, 68, 0.4)");  // Soot radiation outer rim
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        // Slightly stretched circle if flow exists
        ctx.ellipse(
          centerX + flameCenterOffsetX,
          centerY,
          flameRadius + (internalFlow > 0 ? flowDeflection * 0.5 : 0),
          flameRadius,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Spherical Soot Shell Ring
        ctx.beginPath();
        ctx.ellipse(
          centerX + flameCenterOffsetX,
          centerY,
          flameRadius * 0.82,
          flameRadius * 0.82,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "rgba(249, 115, 22, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for 0g flame
        ctx.fillStyle = "#93C5FD";
        ctx.font = "11px monospace";
        ctx.fillText("Spherical Diffusion Boundary (0g)", centerX - 90, centerY - flameRadius - 15);
      } else {
        // --- 1g Terrestrial Buoyant Upward Teardrop Plume ---
        const plumeHeight = 90 + flicker * 2;
        const plumeWidth = 32;

        ctx.save();
        ctx.translate(centerX, centerY);

        const plumeGrad = ctx.createLinearGradient(0, dropletRadius, 0, -plumeHeight);
        plumeGrad.addColorStop(0, "rgba(59, 130, 246, 0.9)");   // Bright blue anchor
        plumeGrad.addColorStop(0.2, "rgba(234, 179, 8, 0.85)"); // Intense yellow luminous core
        plumeGrad.addColorStop(0.7, "rgba(239, 68, 68, 0.6)");  // Orange soot plume
        plumeGrad.addColorStop(1, "rgba(100, 100, 100, 0)");    // Upward thermal dissipation

        ctx.beginPath();
        ctx.moveTo(-plumeWidth * 0.8, 0);
        // Left curve up to tip
        ctx.bezierCurveTo(
          -plumeWidth,
          -plumeHeight * 0.4,
          -plumeWidth * 0.3 + flowDeflection * 0.4,
          -plumeHeight * 0.8,
          flowDeflection,
          -plumeHeight
        );
        // Right curve down from tip
        ctx.bezierCurveTo(
          plumeWidth * 0.3 + flowDeflection * 0.6,
          -plumeHeight * 0.8,
          plumeWidth,
          -plumeHeight * 0.4,
          plumeWidth * 0.8,
          0
        );
        ctx.closePath();
        ctx.fillStyle = plumeGrad;
        ctx.fill();

        ctx.restore();

        // 1g buoyant chimney label
        ctx.fillStyle = "#FBBF24";
        ctx.font = "11px monospace";
        ctx.fillText("Buoyant Convective Updraft (1g)", centerX - 85, centerY - plumeHeight - 20);
      }

      // Spawn soot / convection smoke particles
      if (Math.random() < (isMicrogravity ? 0.3 : 0.7)) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 20,
          y: centerY + (Math.random() - 0.5) * 10,
          vx: (internalFlow / 20) * 0.8 + (Math.random() - 0.5) * 0.5,
          vy: isMicrogravity ? (Math.random() - 0.5) * 0.6 : -1.8 - Math.random() * 1.5,
          life: 0,
          maxLife: isMicrogravity ? 80 : 50,
          size: Math.random() * 3 + 1,
          alpha: 0.6,
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, 0.6 * (1 - p.life / p.maxLife));

        ctx.fillStyle = `rgba(156, 163, 175, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [internalGravity, internalFlow]);

  return (
    <div className="space-y-3 p-4 bg-[#111214] border border-[#303134] rounded-xl">
      {/* Warning Header */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block uppercase tracking-wider text-amber-400">
            Educational Concept Illustration · Not Quantitative Forecast
          </span>
          <p className="text-[11px] text-amber-200/90 mt-0.5">
            This visual renderer demonstrates qualitative hydrodynamic tendencies (buoyant updraft vs spherical diffusion). It is <strong>NOT</strong> a validated chemical kinetics or toxic gas dispersion model.
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full flex justify-center bg-black rounded-lg border border-[#303134] overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={320}
          className="w-full max-w-2xl h-auto"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 px-2 py-1 rounded bg-black/70 border border-[#303134] text-[10px] font-mono text-[#9EA2A7]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Reaction Zone
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Soot Luminous Shell
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> Smoke Particles
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#303134]">
        {/* Gravity Regime Switch */}
        <div className="p-3 bg-[#191A1D] border border-[#303134] rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#F3F2EF] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#DDA36B]" />
              Gravity Mode
            </span>
            <span className="font-mono text-xs text-[#DDA36B]">
              {internalGravity === 0 ? "0g (Orbital Microgravity)" : "1g (Terrestrial Sea Level)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleGravityChange(0)}
              className={`py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                internalGravity === 0
                  ? "bg-[#DDA36B] text-black"
                  : "bg-[#111214] text-[#9EA2A7] hover:text-[#F3F2EF] border border-[#303134]"
              }`}
            >
              0g Microgravity
            </button>
            <button
              type="button"
              onClick={() => handleGravityChange(1)}
              className={`py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                internalGravity === 1
                  ? "bg-[#DDA36B] text-black"
                  : "bg-[#111214] text-[#9EA2A7] hover:text-[#F3F2EF] border border-[#303134]"
              }`}
            >
              1g Earth Gravity
            </button>
          </div>
          <p className="text-[10px] text-[#9EA2A7]">
            {internalGravity === 0
              ? "0g eliminates buoyant updraft; heat and mass transfer occur by symmetric molecular diffusion."
              : "1g produces strong buoyant chimney, accelerating upward airflow and elongating the flame."}
          </p>
        </div>

        {/* Forced Airflow Slider */}
        <div className="p-3 bg-[#191A1D] border border-[#303134] rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#F3F2EF] flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-blue-400" />
              Duct Airflow
            </span>
            <span className="font-mono text-xs text-blue-400">
              {internalFlow.toFixed(1)} cm/s
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={30}
            step={2}
            value={internalFlow}
            onChange={(e) => handleFlowChange(Number(e.target.value))}
            className="w-full accent-blue-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-[#9EA2A7]">
            <span>0 cm/s (Quiescent)</span>
            <span>15 cm/s (Nominal ISS)</span>
            <span>30 cm/s (Max Draft)</span>
          </div>
          <p className="text-[10px] text-[#9EA2A7]">
            Forced flow sweeps fuel vapor downstream, stretching the flame front into a convective tail.
          </p>
        </div>
      </div>
    </div>
  );
}
