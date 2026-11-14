# AGENTS.md — IGNIS Research Workspace

IGNIS — Next.js 14 App Router application for NASA Space Apps Ulaanbaatar 2026 (Team Twinkle Twinkle).
Transforms decades of NASA microgravity combustion research into a searchable, traceable,
and scientifically grounded fire-safety intelligence workspace.

## Stack & Architecture

- **Framework:** Next.js 14.2.x (App Router), React 18.3, TypeScript 5, Tailwind CSS 3.4.
- **Search & Ranking:** `lib/ranking.ts` combining deterministic weighted physics scoring with `Fuse.js` fuzzy natural language matching.
- **UI & Visualization:** Custom calm scientific dark theme (`#0C0F13`), Recharts empirical flame dynamics plots, TanStack Table master comparison matrix, side-by-side compare modal.
- **AI Synthesis:** `lib/synthesis.ts` and `POST /api/interpret` with NVIDIA Nemotron-30B Reasoning Model (NIM) + 100% offline deterministic fallback.
- **Data & Python:** Local JSON corpus (`data/experiments.json`, `data/papers.json`, `data/sources.json`), `scripts/validate.py`, and `scripts/extract_pdf.py` (`pdfplumber`).

## Commands

```bash
npm run dev                  # Local development server (http://localhost:3000)
npm run build                # Next.js production build & typecheck
npm test                     # Node test runner (tests/ranking.test.mjs)
npx tsc --noEmit             # TypeScript strict check
python scripts/validate.py   # Validates scientific schema in data/experiments.json
python scripts/extract_pdf.py <pdf_path>  # Extracts tables and parameters from research PDFs
```

## Data and Evidence Contract

- `types/evidence.ts` defines `ExperimentRecord`. Missing conditions (`oxygen_pct`, `pressure_kpa`, `airflow_cm_s`) are represented as `null` and displayed as `"Not reported"`. Never substitute terrestrial defaults (21%, 101.3 kPa, 0 cm/s).
- Every verified record includes `record_type`, `verification_status`, and `source_locator`.
- Evidence Gap Matrix (`lib/coverage.ts`) computes coverage binned from real indexed records; zero count means `"No indexed evidence"`, never `"Untested by NASA"`.

## Scientific-Integrity Rules

- The score is research *relevance* to an engineering inquiry, NEVER a physical fire danger or hazard probability metric.
- Never extrapolate microgravity (~0g) results quantitatively to Lunar (0.16g) or Martian (0.38g) gravity without dedicated testing (e.g. FLARE).
- Grounding constraint: Every synthesized claim cites its record (`source_url`, DOI, or `psi_id`). If absent, output `"not reported in the indexed evidence"`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
