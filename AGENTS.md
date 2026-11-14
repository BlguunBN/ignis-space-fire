# AGENTS.md

IGNIS — Next.js 14 App Router app for NASA Space Apps Ulaanbaatar 2026. Ranks NASA
microgravity combustion evidence against an engineering inquiry, then synthesizes a
grounded answer. No database, no auth, no test suite.

## Current state — do not assume the UI exists

- Only route is `POST /api/interpret`. There is **no `app/page.tsx`**, so `/` is a 404.
  `next build` emits exactly `/api/interpret` and `/404`; verified at build time.
- `lib/ranking.ts` (`rankEvidence`) and `components/EvidenceCard.tsx` are written but
  imported by nothing, and no code loads `data/*.json` at runtime. Wire them up rather
  than assuming they already are.
- `clsx`, `tailwind-merge`, `recharts` are installed but unused everywhere.
- `main` has no commits yet; the whole tree is untracked.

## Commands

```bash
npm run dev                  # next dev
npm run build                # next build — the only meaningful full check
npx tsc --noEmit             # strict TS pass, fast
python scripts/validate.py   # validates data/experiments.json, exit 1 on failure
python scripts/fetch_ntrs.py "query"   # live NTRS API call, needs network
```

- `npm test` is `node --test` with **zero test files**: it exits 0 printing `# tests 0`.
  Never cite it as evidence that something works.
- `npm run lint` is `next lint` with no ESLint config and no `eslint` dependency, so it
  drops into interactive setup. Don't run it in automation; there is no formatter either.

## Data and evidence contract

- Corpus: `data/experiments.json` (10 records); citations: `data/papers.json`;
  provenance: `data/sources.json`. Record shape: `ExperimentRecord` in `types/evidence.ts`.
- `scripts/validate.py` enforces required fields, unique `id`, `source_url` starting with
  `http`, and a non-empty `limitations` array. It only *warns* on non-`microgravity`
  records, so add-field changes must also update `REQUIRED_FIELDS` there.
- Scoring is deterministic arithmetic in `lib/ranking.ts`: 0.30 material / 0.20 atmosphere
  / 0.20 airflow / 0.15 phenomenon / 0.10 platform / 0.05 completeness → 0–100, banded
  HIGH ≥ 80, MODERATE ≥ 60, LOW ≥ 35, else SPARSE. Changing weights means changing the
  header comment and any confidence copy that quotes those bands.
- `/api/interpret` does **not** rank; it trusts the request body (`{ query, topRanked }`)
  and only synthesizes. Ranking belongs to the caller.

## Scientific-integrity rules (product requirement, not style)

These are deliberately encoded in the LLM system prompt and the deterministic copy.
Preserve them in any new output path:

- The score is research *relevance* to an inquiry, never a fire-risk or hazard
  probability. Never render it as a risk percentage.
- Never extrapolate ~0 g results quantitatively to Lunar (0.16 g) or Martian (0.38 g).
- Every claim cites its record (`source_url`, DOI or `psi_id`); emit "not reported in the
  indexed evidence" instead of inventing a missing value.
- Keep the microgravity caveat in `lib/ranking.ts`'s `limitationsWarning` and the
  limitations list in `buildDeterministicSynthesis`.

## LLM path

- `generateGroundedInterpretation` calls OpenAI (`gpt-4o-mini`, JSON mode) only when a key
  is passed **and** `process.env.OPENAI_API_KEY` is set; otherwise it returns the
  deterministic synthesis with `aiMode: "deterministic_fallback"`. Offline demo is a hard
  requirement — never make the fallback throw or require a key.
- `OPENAI_API_KEY` lives in `.env.local` (gitignored). It is the only env var read.

## Conventions

- TypeScript strict, `allowJs` on. The `@/*` alias maps to the repo root, not `src/`.
- Tailwind v3 with a hand-rolled dark-only UI (`<html className="dark">`, no theme toggle);
  palette is hardcoded slate plus `nasa.*` in `tailwind.config.ts`. Base tokens live in
  `app/globals.css`. No component library.
- Components are `"use client"` React with `lucide-react` icons; server code (`app/api/*`)
  never imports client components.
- Python scripts are stdlib-only, no requirements file, no venv.
- `.opencode/` and `.agent-state/` are agent tool state, not app source.
