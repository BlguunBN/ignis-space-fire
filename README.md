# IGNIS — Space Fire Evidence Intelligence

IGNIS is a research workspace for exploring NASA microgravity combustion investigations, built for the Space Apps Flame in Freefall challenge by Team Twinkle Twinkle.

Ask a question or choose a preset, inspect ranked source-linked investigation summaries, compare two studies, and create a cited brief. The Evidence Map shows coverage of the current indexed subset; an empty cell does not mean NASA has never studied that combination. Sources & Methods explains the scope and ranking. A contextual NASA SoFIE image is identified separately from the selected investigation.

## Evidence and limitations

The current workspace exposes three source-reviewed **investigation summaries**: Saffire-I, Saffire-II, and BASS-II. They are not individual experimental runs, and missing conditions are shown as not reported. See [the evidence audit](docs/evidence-audit.md) for field-level sources and limitations. `data/experiments.json` is a candidate index containing records and values that have not all been reviewed; `lib/sourceReviewedRecords.ts` applies corrections and controls eligibility. The Python validator checks structure and basic numerical ranges, not scientific truth. PDF extraction likewise produces candidates that require manual source review.

Ranking indicates relevance to a query, not fire danger or probability. Different experiments may not be directly comparable. Microgravity results cannot be used to predict lunar or Martian fire behavior without appropriate evidence. The current small corpus limits what can be found and what the map can show.

Interpretation uses a deterministic source-linked fallback and optionally an NVIDIA model when `NVIDIA_API_KEY` is configured. Model output is checked for allowed source identifiers, but automated checks cannot establish scientific correctness; consult the original sources before using any result. The simulation and older visual components remain in the repository but are not part of the rebuilt research workflow.

## Run locally

Requires Node.js compatible with Next.js 16 and Python 3 for validation. Install the existing dependencies with `npm install`, then run:

```sh
npm run dev
npm test
python -m unittest discover -s tests -p "test_*.py"
python scripts/validate.py
npx tsc --noEmit
npm run build
```

Open http://localhost:3000. The optional server-side `NVIDIA_API_KEY` belongs in `.env.local`; never commit credentials. `npm run lint` currently uses the removed `next lint` command and needs a separately configured linter.

## Sources and license

The primary sources are NASA's [Physical Sciences Informatics repository](https://psi.nasa.gov/physci/repo/search?q=combustion) and the records linked in the audit. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attributions and [LICENSE](LICENSE) for the project license.
