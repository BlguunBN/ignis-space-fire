"use client";

import React from "react";
import { Info } from "lucide-react";

export function ExperimentApparatusDiagram() {
  return (
    <div className="bg-[#0C0F13] border border-[#303741] rounded-xl p-5 text-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#303741]">
        <div>
          <span className="font-bold text-[#F3F5F7] text-sm block">
            ISS Combustion Integrated Rack (CIR) Flow Duct Schematic
          </span>
          <span className="text-[11px] text-[#A1AAB5]">
            Hardware architecture for SoFIE-GEL and BASS-II investigations
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1B2027] text-[#E99847] border border-[#303741]">
          Geometry Schematic
        </span>
      </div>

      {/* SVG Apparatus */}
      <div className="w-full flex justify-center py-4 bg-[#15191F]/40 rounded-lg border border-[#303741]">
        <svg
          viewBox="0 0 680 260"
          className="w-full max-w-2xl h-auto text-slate-300 font-mono"
        >
          {/* Chamber Outline */}
          <rect
            x="40"
            y="20"
            width="600"
            height="220"
            rx="12"
            fill="#0C0F13"
            stroke="#303741"
            strokeWidth="2"
          />
          <text x="60" y="45" fill="#737F8C" fontSize="11" fontWeight="bold">
            CIR HERMETIC COMBUSTION VESSEL (100 L)
          </text>

          {/* Flow Duct */}
          <rect
            x="100"
            y="70"
            width="480"
            height="120"
            rx="6"
            fill="#15191F"
            stroke="#303741"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text x="110" y="90" fill="#78A9D8" fontSize="10">
            CONTROLLED FLOW DUCT (100 mm x 100 mm)
          </text>

          {/* Forced Airflow Inflow Arrows */}
          <path
            d="M 60 130 L 95 130 M 85 124 L 95 130 L 85 136"
            stroke="#78A9D8"
            strokeWidth="2"
            fill="none"
          />
          <text x="50" y="160" fill="#78A9D8" fontSize="10" textAnchor="middle">
            Oxidizer Inflow
          </text>
          <text x="50" y="172" fill="#A1AAB5" fontSize="9" textAnchor="middle">
            (0 - 20 cm/s)
          </text>

          {/* Solid Specimen Holder & PMMA Slab */}
          <rect
            x="300"
            y="125"
            width="120"
            height="10"
            rx="2"
            fill="#E99847"
            stroke="#E99847"
          />
          <text x="360" y="120" fill="#E99847" fontSize="11" fontWeight="bold" textAnchor="middle">
            PMMA Solid Specimen (0.5 mm)
          </text>

          {/* Microgravity Flame Envelope */}
          <ellipse
            cx="330"
            cy="115"
            rx="35"
            ry="25"
            fill="none"
            stroke="#D97777"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x="330" y="85" fill="#D97777" fontSize="10" textAnchor="middle">
            Spherical Flame Front (0g)
          </text>

          {/* High-speed Camera & Sensors */}
          <rect
            x="310"
            y="200"
            width="100"
            height="25"
            rx="4"
            fill="#1B2027"
            stroke="#5CB59B"
            strokeWidth="1.5"
          />
          <text x="360" y="216" fill="#5CB59B" fontSize="10" textAnchor="middle">
            Color Video Camera
          </text>
          <line x1="360" y1="195" x2="360" y2="140" stroke="#5CB59B" strokeWidth="1" strokeDasharray="2 2" />

          {/* Exhaust / Scrubber */}
          <path
            d="M 585 130 L 620 130 M 610 124 L 620 130 L 610 136"
            stroke="#737F8C"
            strokeWidth="2"
            fill="none"
          />
          <text x="630" y="155" fill="#737F8C" fontSize="10" textAnchor="middle">
            Exhaust Scrubber
          </text>
        </svg>
      </div>

      <div className="flex items-start gap-2 text-xs text-[#A1AAB5]">
        <Info className="w-4 h-4 text-[#78A9D8] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#F3F5F7]">Apparatus Function:</strong> Fans deliver a laminar opposed oxidizer flow (2 to 20 cm/s) across the solid fuel slab mounted inside the sealed Combustion Integrated Rack. Camera sensors capture orthogonal views at up to 30 frames per second to quantify burning rates without gravitational convection.
        </p>
      </div>
    </div>
  );
}
