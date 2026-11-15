# FLARE — Fire Laboratory for Analysis, Research & Exploration

**NASA Space Apps Challenge 2026 · Flame in Freefall**

FLARE is an interactive research workspace for exploring NASA microgravity combustion investigations and identifying useful evidence for fire safety in crewed habitats. It connects research discovery, comparison, source inspection, exploratory simulation, and guided AI research actions.

## The research problem

NASA publishes combustion investigations through the [Physical Sciences Informatics (PSI) repository](https://psi.nasa.gov/physci/repo) and the [NASA Technical Reports Server](https://ntrs.nasa.gov/). Finding experiments that apply to a specific spacecraft safety question can be difficult. Different studies use different fuels, oxygen concentrations, airflow regimes, enclosures, and measurement methods, so their results should not be combined without examining those differences.

FLARE supports a workflow: **ask a safety question → find relevant studies → rank by relevance → examine the source and conditions → compare the evidence → identify limitations and research gaps**.

## What the prototype implements

- **Research explorer:** Search and filter indexed records by material, investigation, gravity, oxygen, pressure, and airflow.
- **Explainable relevance ranking:** Question-specific, transparent heuristic that highlights topic, material match, available conditions, and provenance. The relevance index is **not** a measured fire-risk probability or a scientific confidence score.
- **Comparison and evidence brief:** Compare investigations, flag differing experimental conditions, create a source-linked summary and disclose the internal review status of each record.
- **Guided AI research actions:** NVIDIA Nemotron is connected through a server-side API integration, with app tools for filtering, source inspection, hypothesis setup, simulation configuration and other workflow steps. The UI exposes a guided pipeline; this is **not** a claim of a fully autonomous external research agent. The application has a deterministic fallback if the API is unavailable.
- **Exploratory combustion lab:** Visualizes possible behavior under changes in gravity, oxygen, airflow and fuel using simplified models. It is not a validated predictive safety simulator.
- **Research gap and whiteboard tools:** Highlight missing combinations within the indexed data and support follow-up research planning. Missing indexed records do not prove research is absent elsewhere.

## Research corpus and provenance

The current `src/data/experiments.json` contains **50 indexed research records**: **12 tagged NASA PSI**, **20 tagged NASA NTRS**, and **18 tagged peer-reviewed**. The dataset labels **34 as internally 'verified'** and **16 as 'needs_review'**. These labels describe the project's internal curation status, not independent NASA endorsement or validation.

Relevant investigation links include:
- [FLEX / PSI-69](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69)
- [Saffire-I / PSI-98](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98)
- [Saffire-II / PSI-99](https://psi.nasa.gov/physci/repo/data/investigations/PSI-99)
- [BASS / PSI-25](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25)
- [SAME / PSI-102](https://psi.nasa.gov/physci/repo/data/investigations/PSI-102)

Check each paper's original experimental measurements and locator before citing it in an engineering or safety context. The supplied claims, quotations, source locators and review labels have **not** been independently authenticated as part of this README.

## Why the distinctions matter

- A relevant experiment is not automatically applicable to a specific spacecraft or habitat.
- A study comparing microgravity with terrestrial gravity cannot automatically predict fire behavior at lunar (0.16g) or Martian (0.38g) gravity.
- An internally checked citation is not proof that the original NASA report supports every generated interpretation.
- Simulations explore assumptions; they are not certification, spacecraft fire-risk estimates or substitutes for physical testing.

## Run locally

Requires an appropriate version of Node.js for Next.js 16.

```bash
npm install
cp .env.example .env.local
npm run dev
```

For NVIDIA-backed responses, configure a valid `NVIDIA_API_KEY` **only on the server**. Never expose API keys in browser code or public screenshots.

```bash
npm test
npx tsc --noEmit
```

Tests should be run locally or in CI before merging changes. Their passing status is not asserted here.

## Competition materials

See [judging-ready submission copy](docs/SPACE_APPS_SUBMISSION.md) and [validation and demo checklist](docs/VALIDATION_AND_DEMO.md).

## Third-party acknowledgement

Frontend and workflow dependencies include Next.js, React, TypeScript, Tailwind CSS, Supabase, NVIDIA APIs, D3, Recharts, React Flow, Excalidraw, Fuse.js, and Citation.js. Interface patterns have been informed by [bklit](https://bklit.com/), [Lightswind](https://lightswind.com/), [KokonutUI](https://kokonutui.com/), and [21st.dev](https://21st.dev/). See `package.json` for dependencies and consult original repositories for licensing. NASA datasets and publications remain attributed to their source institutions.

## License

See [LICENSE](LICENSE) for the repository license.
