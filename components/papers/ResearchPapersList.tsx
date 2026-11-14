"use client";

import React, { useState, useMemo } from "react";
import papersData from "@/data/papers.json";
import { ResearchPaper } from "@/types/paper";
import { ExternalLink, BookOpen, Search, ShieldCheck } from "lucide-react";

export function ResearchPapersList() {
  const papers = papersData as ResearchPaper[];
  const [selectedProgramme, setSelectedProgramme] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const programmes = useMemo(() => {
    const list = Array.from(new Set(papers.map((p) => p.programme)));
    return ["ALL", ...list];
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const matchProg =
        selectedProgramme === "ALL" || paper.programme === selectedProgramme;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        paper.title.toLowerCase().includes(term) ||
        paper.authors.some((a) => a.toLowerCase().includes(term)) ||
        paper.journal.toLowerCase().includes(term) ||
        paper.summary.toLowerCase().includes(term) ||
        paper.relevance.toLowerCase().includes(term);
      return matchProg && matchSearch;
    });
  }, [papers, selectedProgramme, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#191A1D] border border-[#303134] rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#DDA36B]" />
          <span className="font-semibold text-[#F3F2EF]">
            Peer-Reviewed Papers & Technical Reports ({filteredPapers.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Programme Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#9EA2A7]">Programme:</span>
            <select
              aria-label="Filter papers by programme"
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="bg-[#111214] border border-[#303134] text-[#F3F2EF] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              {programmes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <label className="flex items-center gap-1.5 bg-[#111214] border border-[#303134] rounded-lg px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-[#9EA2A7]" />
            <input
              type="text"
              placeholder="Search papers or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-[#F3F2EF] outline-none placeholder:text-[#9EA2A7] w-36 sm:w-48"
            />
          </label>
        </div>
      </div>

      {/* Grid of Papers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPapers.map((paper) => (
          <article
            key={paper.id}
            className="studio-panel p-5 flex flex-col justify-between space-y-4 border border-[#303134] hover:border-[#DDA36B]/50 transition"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#111214] border border-[#303134] text-[#DDA36B]">
                  {paper.programme}
                </span>
                <span className="text-[11px] text-[#9EA2A7]">{paper.year}</span>
              </div>

              <h3 className="font-semibold text-sm text-[#F3F2EF] leading-snug">
                {paper.title}
              </h3>

              <p className="text-[11px] text-[#9EA2A7] leading-relaxed">
                {paper.authors.join(", ")}
              </p>

              <p className="text-[11px] text-[#737F8C] italic">
                {paper.journal}
              </p>

              <div className="pt-2 border-t border-[#303134]/60 space-y-1.5 text-xs">
                <p className="text-[#F3F2EF] leading-relaxed">
                  <strong className="text-[#9EA2A7] font-normal">Findings: </strong>
                  {paper.summary}
                </p>
                <p className="text-[#DDA36B] leading-relaxed">
                  <strong className="text-[#9EA2A7] font-normal">Relevance: </strong>
                  {paper.relevance}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#303134] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] text-[#737F8C]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {paper.verified_source}
              </span>

              <a
                href={paper.url}
                target="_blank"
                rel="noreferrer"
                className="studio-link inline-flex items-center gap-1.5 text-xs text-[#F3F2EF] hover:text-[#DDA36B]"
              >
                {paper.doi ? "View DOI" : "NASA Report"}
                <ExternalLink size={12} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
