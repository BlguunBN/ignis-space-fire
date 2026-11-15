# IGNIS Dashboard — Mission-Evidence Redesign

**Date:** 2026-11-15  
**Status:** Implementation on a feature branch (dashboard only)

## Product position

IGNIS is a research decision-support workspace, not a validated spacecraft hazard predictor. Its purpose is to help users discover NASA microgravity combustion investigations, inspect supporting sources, compare tested conditions, identify data gaps, and produce cited fire-safety research briefs.

**North-star question:** What does the indexed experimental evidence actually tell us about this spacecraft fire-safety question, and where does the evidence stop?

Primary users: habitat/fire-safety engineers, combustion researchers, and first-time hackathon evaluators.

## Dashboard information architecture

1. **Product promise** — clear mission statement, primary "Explore evidence" action, secondary "Open flame lab"
2. **Research pathway** — Discover, Verify, Compare, Interpret
3. **Collection provenance** — indexed records, marked-verified records, NASA PSI source-type records, oxygen coverage
4. **Coverage matrix** — observed indexed-record counts by material class and gravity regime
5. **Condition completeness** — oxygen, airflow and pressure availability / total
6. **Investigation shortcuts** — distinct investigations, source indicators, tested conditions
7. **Grounded question starters** — links to existing assistant with citation-oriented questions
8. **Source quality** — counts labelled as metadata, never a safety certification

### Visual direction

- Dark graphite canvas and flat cards, minimal shadows and hairline borders
- Amber as a navigation accent, not an indication of risk severity
- Desktop: 2-column hero; four KPIs; 7/5 evidence/parameter split; 7/5 investigation/questions split
- Mobile: stacked sections, 44px primary buttons, horizontally scrolling labelled coverage table
- Clear keyboard focus, semantic headings and accessible text labels

## Implementation map

| File | Role |
|---|---|
| src/components/ExecutiveAnalyticsDashboard.tsx | Derived data summary, coverage matrix, topic shortcuts, grounded questions |
| src/app/page.tsx | Passes existing Explorer, Simulator, Coverage, Sources and Assistant callbacks |
| src/components/Header.tsx | Existing sidebar preserved |
| tests/overview-presentation.test.tsx | Regression tests for missing values and navigation entrypoints |

## Scientific integrity

- No invented fire-risk score. Heatmap cells represent counts of indexed records only.
- A Moon/Mars relevance score requires validated habitat condition matching and uncertainty handling. It is not estimated from existing record counts.
- Null oxygen, pressure or airflow values remain unreported and are never treated as zero.
- A record marked verified in this repository is not independently certified by NASA.
- Source labels describe metadata only and do not imply NASA endorsement.
- Simulated output is a model demonstration, not an observed experimental result.
- Topic tabs use keyword matching, not a learned model or validated ranking.
- Dataset records may be experiment runs, study summaries, or findings; do not count them all as unique independent studies.

## Phase 2 backlog (not part of the dashboard patch)

### Priority 1
- Make the main search entry state persistent between Overview and Explorer.
- The current analysis selection initializes to every record. Start comparison with 0 selected or a deliberate short list and limit comparisons to 2–3 chosen records.
- Add a condition matcher for habitat cases (oxygen, pressure, ventilation, materials, and gravity) that explicitly lists missing values and condition differences.
- Enable full coverage matrix click-through by both gravity and material.
- Enforce claim-level source citations across investigation cards, chat, and brief export.

### Priority 2
- Consolidate stacked dialogs into a persistent investigation detail layout.
- Add navigable URLs, bookmarks and browser history support for research states.
- Export a reproducible, citation-backed evidence brief.
- Group repeated experiment runs under parent investigations.

### Future
- Validated habitat profiles and domain-aware relevance ranking, with transparent scoring.
- Simulation uncertainty and sensitivity analysis.
- Saved workspaces after storage/auth requirements are established.

## Acceptance criteria

- Existing Explorer, Coverage, Simulator, Sources and Assistant features open from the dashboard.
- Stats recompute when a staged user record enters the active corpus.
- Null O2, airflow and pressure values never generate a fabricated measurement.
- Every matrix cell describes an indexed-record count, not risk.
- Keyboard interactions, responsive overflow, and focus states work.
- Run npm run lint, npm test, and npm run build on a complete checkout.
- Visually verify 375x812, 768x1024 and 1440x900.
- Primary evidence and provenance remain accessible before treating an output as safety guidance.

## Out of scope

No change to experiment data, AI models, scientific scoring, database, authentication, ingestion, or simulator physics.
