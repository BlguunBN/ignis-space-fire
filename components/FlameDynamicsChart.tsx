"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell
} from "recharts";
import { BarChart3, Info } from "lucide-react";
import data from "@/data/experiments.json";
import type { ExperimentRecord } from "@/types/evidence";

/**
 * Visualizes indexed evidence counts rather than inventing cross-experiment
 * flame-spread measurements. Counts describe this local corpus ONLY.
 */
export function FlameDynamicsChart() {
  const rows = useMemo(() => {
    const result = new Map<string, { name: string; records: number; markedVerified: number }>();
    for (const record of data as ExperimentRecord[]) {
      const existing = result.get(record.programme) || {name:record.programme, records:0, markedVerified:0};
      existing.records += 1;
      if (record.verification_status === "verified") existing.markedVerified += 1;
      result.set(record.programme, existing);
    }
    return Array.from(result.values()).sort((a,b)=>b.records-a.records);
  }, []);
  return (
    <section className="ignis-panel overflow-hidden" aria-label="Evidence record distribution">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div>
          <p className="ignis-kicker">RESEARCH LANDSCAPE</p>
          <h2 className="mt-1 flex items-center gap-2 text-sm font-medium"><BarChart3 className="h-4 w-4 text-[#e2ad73]"/> Indexed records by programme</h2>
        </div>
        <span className="text-[11px] text-[#9fa1a2]">Current dataset only</span>
      </div>
      <div className="px-3 pb-3 pt-5 sm:px-5">
        <div className="h-[220px] w-full" aria-label="Number of indexed evidence records in each programme">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{top:5,right:10,bottom:10,left:-24}}>
              <CartesianGrid vertical={false} stroke="#333437" strokeOpacity={0.7}/>
              <XAxis dataKey="name" tick={{fill:"#a6a8aa",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{fill:"#85888b",fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip cursor={{fill:"#252629"}} contentStyle={{background:"#191a1c",border:"1px solid #3a3b3d",borderRadius:8,color:"#eee",fontSize:12}}
                formatter={(count)=>[count,"Indexed records"]}/>
              <Bar dataKey="records" radius={[4,4,0,0]} barSize={34}>
                {rows.map((row,index)=><Cell key={row.name} fill={index===0?"#d5a473":"#6e7279"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#999c9f]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d2a57c]"/>
          Counts represent records in this small indexed workspace, not NASA's total experiments or numerical flame behavior. A record's verification label has not been independently audited here.
        </p>
      </div>
    </section>
  );
}
