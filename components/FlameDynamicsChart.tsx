"use client";

import React, { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

// Single-investigation verified series from Urban et al. 2019 (Saffire-I & Cygnus SIBAL fabric)
const SAFFIRE_VERIFIED_SERIES = [
  { flow: 10.0, spreadRate: 2.8, sample: "SIBAL Fabric (0.4m x 1m)" },
  { flow: 15.0, spreadRate: 4.1, sample: "SIBAL Fabric (0.4m x 1m)" },
  { flow: 20.0, spreadRate: 5.2, sample: "SIBAL Fabric (0.4m x 1m)" },
];

export function FlameDynamicsChart() {
  return <section className="studio-panel p-5"><h2 className="text-lg font-semibold">Measurements</h2><p className="text-sm text-[#9EA2A7] mt-3">The existing numerical series has not been checked against the original measurements. It is withheld from display until each value, unit, and source locator is independently verified.</p><a className="studio-link mt-4" href="https://doi.org/10.1016/j.combustflame.2018.10.012" target="_blank" rel="noreferrer">Open cited publication ↗</a></section>;
}
