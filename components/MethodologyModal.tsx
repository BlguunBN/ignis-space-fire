"use client";

import React from "react";
import { X, ShieldAlert, Award, ExternalLink } from "lucide-react";

interface MethodologyModalProps {
  onClose: () => void;
}

export function MethodologyModal({ onClose }: MethodologyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#191A1D] border border-[#303134] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#303134] flex items-center justify-between bg-[#111214]">
          <div>
            <h2 className="text-base font-bold text-[#F3F2EF] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#DDA36B]" />
              Scientific Methodology, Provenance & Boundaries
            </h2>
            <p className="text-xs text-[#9EA2A7] mt-0.5">
              NASA Space Apps Ulaanbaatar 2026 — Team Twinkle Twinkle
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#191A1D] text-[#9EA2A7] hover:text-[#F3F2EF] border border-[#303134] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#9EA2A7] leading-relaxed">
          {/* Scientific Caution */}
          <div className="p-3.5 rounded-xl bg-[#0B0C0E] border border-[#DDA36B]/40">
            <h3 className="text-xs font-bold text-[#DDA36B] flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-4 h-4" />
              Microgravity Boundary vs. Lunar / Martian Gravity
            </h3>
            <p>
              Microgravity (~0g) removes buoyancy-driven convection, causing rounded flame fronts, slower ignition, and radiation-dominated extinction. However, the Moon (0.16g) and Mars (0.38g) are partial-gravity regimes where buoyancy is weakened but active.
            </p>
            <p className="mt-1.5 text-[#F3F2EF] font-medium">
              IGNIS deliberately flags this domain mismatch rather than presenting unvalidated mathematical extrapolations to Martian surface conditions.
            </p>
          </div>

          {/* Transparent Relevance Model */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#F3F2EF] uppercase tracking-wider">
              Transparent Evidence Relevance Score Formula
            </h3>
            <p>
              The dashboard ranks research relevance using a deterministic model so engineers can verify why each experiment matched their mission query:
            </p>

            <div className="bg-[#0B0C0E] p-3 rounded-xl border border-[#303134] font-mono text-[#78A9D8] space-y-1 text-[11px]">
              <div>Score = 0.30 × Material Similarity</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 × Atmosphere (O₂ & Pressure) Match</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 × Forced Airflow Velocity Match</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.15 × Phenomenon & Target Measurement Match</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 × Scale & Platform Relevance (Cygnus / ISS MSG / CIR)</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.05 × Metadata Completeness</div>
            </div>

            <p className="text-[11px]">
              <strong className="text-[#F3F2EF]">Missing Variable Policy:</strong> If a NASA study does not explicitly report a parameter, it is represented as <code className="text-[#DDA36B]">null</code> and rendered as &quot;Not reported&quot;. It is never replaced with terrestrial defaults (21% O₂, 101.3 kPa, 0 cm/s).
            </p>
          </div>

          {/* AI Grounding Architecture */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#F3F2EF] uppercase tracking-wider">
              AI Grounding Architecture (NVIDIA Nemotron-30B)
            </h3>
            <p>
              When AI interpretation is requested, the client sends the query and trusted record IDs to the server (<code className="text-[#78A9D8]">POST /api/interpret</code>). The server loads the authentic records directly from verified JSON and prompts the model with strict grounding rules:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li>
                <strong>Strict Context:</strong> The model is supplied only with the top 3-5 ranked NASA investigation records.
              </li>
              <li>
                <strong>Reasoning Chain:</strong> The model generates internal scientific reasoning steps before finalizing output.
              </li>
              <li>
                <strong>Offline Fallback:</strong> If no API key is present or connectivity drops during live hackathon demos, IGNIS executes structured synthesis deterministically.
              </li>
            </ul>
          </div>

          {/* Data Sources and Licensing */}
          <div className="space-y-2 border-t border-[#303134] pt-4">
            <h3 className="text-xs font-bold text-[#F3F2EF] uppercase tracking-wider">
              Data Sources & Open Attribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-[#0B0C0E] rounded-lg border border-[#303134]">
                <span className="font-semibold text-[#F3F2EF] block">NASA Physical Sciences Informatics</span>
                <span className="text-[#737F8C]">DOIs: 10.60555/0t15-1z43, 10.60555/mbq8-0451</span>
              </div>
              <div className="p-2.5 bg-[#0B0C0E] rounded-lg border border-[#303134]">
                <span className="font-semibold text-[#F3F2EF] block">NASA Technical Reports Server</span>
                <span className="text-[#737F8C]">Open REST API (citations & technical reports)</span>
              </div>
            </div>
            <p className="text-[11px] text-[#737F8C]">
              Software is released under the <strong className="text-[#F3F2EF]">Apache-2.0</strong> open source license, adhering to NASA Space Apps Challenge terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
