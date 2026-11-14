"use client";

import React from "react";
import { X, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";

interface MethodologyModalProps {
  onClose: () => void;
}

export function MethodologyModal({ onClose }: MethodologyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Scientific Methodology & Provenance
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              NASA Space Apps Ulaanbaatar 2026 — Flame in Freefall
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Scientific Caution */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4" />
              The Microgravity Boundary vs. Lunar/Martian Gravity
            </h3>
            <p>
              A foundational principle of IGNIS is scientific validity. Microgravity (~0g) removes buoyancy-driven convection, yielding spherical flames and low-momentum transport. However, the Moon (0.16g) and Mars (0.38g) are partial-gravity regimes where buoyancy is weakened but active.
            </p>
            <p className="mt-2 text-amber-200/90 font-medium">
              IGNIS deliberately flags domain mismatches rather than presenting unvalidated mathematical extrapolations to Martian surface conditions.
            </p>
          </div>

          {/* Transparent Relevance Model */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Transparent Evidence Relevance Score Formula
            </h3>
            <p className="text-slate-400">
              The dashboard ranks research relevance using a deterministic model so engineers can verify why each experiment matched their mission query:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-cyan-300 space-y-1 text-[11px]">
              <div>Score = 0.30 × Material Similarity</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 × Atmosphere (O₂ & Pressure) Similarity</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.20 × Forced Airflow Velocity Similarity</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.15 × Phenomenon & Measurement Match</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10 × Scale & Platform Relevance (Cygnus / ISS MSG / CIR)</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.05 × Metadata Completeness</div>
            </div>

            <p className="text-slate-400 text-[11px]">
              <strong>Missing Variable Degradation:</strong> If a NASA study does not explicitly report a parameter (e.g. ambient pressure), it is never guessed or replaced with standard terrestrial values (101.3 kPa). The score degrades confidence and explicitly surfaces the omission.
            </p>
          </div>

          {/* AI Grounding Architecture */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              AI Grounding Architecture (Baseline-First)
            </h3>
            <p className="text-slate-400">
              IGNIS follows a resilient architecture where the core ranking and filtering are 100% deterministic. When AI interpretation is triggered:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                <strong>Strict Context:</strong> The model is supplied only with the top 3-5 ranked NASA investigation records.
              </li>
              <li>
                <strong>Hallucination Defense:</strong> The prompt forbids estimating fire probabilities or inventing chamber parameters.
              </li>
              <li>
                <strong>Offline Fallback:</strong> If no external API key is present or connectivity drops during live hackathon demos, IGNIS executes structured synthesis deterministically.
              </li>
            </ul>
          </div>

          {/* Data Sources and Licensing */}
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Data Sources & Open Attribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-semibold text-white block">NASA Physical Sciences Informatics</span>
                <span className="text-slate-400">DOIs: 10.60555/0t15-1z43, 10.60555/mbq8-0451, CC0-1.0</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="font-semibold text-white block">NASA Technical Reports Server</span>
                <span className="text-slate-400">Public REST API (citations & technical reports)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Software is released under the <strong>Apache-2.0</strong> open source license, adhering to NASA Space Apps Challenge terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
