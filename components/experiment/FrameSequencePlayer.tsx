"use client";
import React, { useEffect, useState } from "react";
import { ResearchAsset } from "@/types/visualization";
import { ImageInspector } from "@/components/experiment/ImageInspector";
import { Play, Pause, SkipBack, SkipForward, ExternalLink } from "lucide-react";
export function FrameSequencePlayer({ asset }: { asset: ResearchAsset }) {
  const count = asset.frameCount ?? 0;
  const interval = asset.intervalSeconds;
  const [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => { setFrame(1); setPlaying(false); }, [asset.id]);
  useEffect(() => { if (!playing || !interval || count < 2) return; const timer = setInterval(() => setFrame(f => f >= count ? 1 : f + 1), interval * 1000 / speed); return () => clearInterval(timer); }, [playing, interval, count, speed]);
  if (!asset.framesPattern || !count) return <p className="p-6 text-sm text-[#9EA2A7]">Frame sequence unavailable.</p>;
  const path = (n: number) => asset.framesPattern!.replace(/\{(?:idx|index)\}/g, String(n).padStart(2, "0"));
  return <div className="space-y-3">
    <ImageInspector key={asset.id} src={path(frame)} alt={`${asset.title}, frame ${frame} of ${count}`} />
    <div className="flex items-center gap-3 flex-wrap text-xs text-[#9EA2A7]"><span>Original imagery · {asset.nasaCredit}</span><a className="text-[#DDA36B] inline-flex items-center gap-1" href={asset.locator.url} target="_blank" rel="noreferrer">Source <ExternalLink size={12}/></a></div>
    <div className="flex items-center gap-3"><button aria-label="Previous frame" onClick={() => {setPlaying(false); setFrame(f => f <= 1 ? count : f-1);}}><SkipBack size={18}/></button><button aria-label={playing ? "Pause" : "Play"} disabled={!interval} onClick={() => setPlaying(!playing)} className="rounded-lg bg-[#DDA36B] text-black p-2 disabled:opacity-50">{playing ? <Pause size={16}/> : <Play size={16}/>}</button><button aria-label="Next frame" onClick={() => {setPlaying(false); setFrame(f => f >= count ? 1 : f+1);}}><SkipForward size={18}/></button><input aria-label="Frame" type="range" min="1" max={count} value={frame} onChange={e => {setPlaying(false); setFrame(Number(e.target.value));}} className="flex-1 min-w-20 accent-[#DDA36B]"/><span className="text-xs whitespace-nowrap">{frame} / {count}</span><select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="bg-[#191A1D] text-xs"><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></div>
    <p className="text-xs text-[#9EA2A7]">{interval ? `Source interval: ${interval} seconds between frames` : "Frame interval not reported"}</p>
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Frame sequence">{Array.from({length:count},(_,i)=><button key={i} onClick={() => {setPlaying(false);setFrame(i+1);}} aria-label={`Show frame ${i+1}`} aria-pressed={frame===i+1} className={`shrink-0 w-16 h-14 rounded border overflow-hidden ${frame===i+1 ? "border-[#DDA36B]" : "border-[#303134]"}`}><img src={path(i+1)} alt="" className="w-full h-full object-contain bg-black"/></button>)}</div>
  </div>;
}
