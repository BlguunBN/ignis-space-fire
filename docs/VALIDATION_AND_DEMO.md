# FLARE — Validation, impact and live-demo checklist

This file describes tests to **perform**, not results already achieved. Do not present unchecked items as verified.

## Source audit: at least three records

Select at least three records and open the primary investigation or full report. Record whether the source page, material, atmosphere, flow, measurement units, and quoted claim actually agree with the indexed text. A matching database field alone does not prove authenticity.

| Study | Indexed reference | Verify experimentally | Status |
| --- | --- | --- | --- |
| FLEX | https://psi.nasa.gov/physci/repo/data/investigations/PSI-69 | fuel and diameter, reported burn duration, extinction observation, unit conventions | Pending independent source check |
| Saffire-I | https://psi.nasa.gov/physci/repo/data/investigations/PSI-98 | fuel size, actual airflow and oxygen, enclosure configuration, any spread-rate statement | Pending independent source check |
| Saffire-II | https://psi.nasa.gov/physci/repo/data/investigations/PSI-99 | fabric/fuel differences, atmosphere and measurement conditions | Pending independent source check |
| BASS | https://psi.nasa.gov/physci/repo/data/investigations/PSI-25 | solid material, flow regime and suppression/extinction interpretation | Pending independent source check |
| SAME | https://psi.nasa.gov/physci/repo/data/investigations/PSI-102 | aerosol-related findings, whether claims concern detection vs fire behavior | Pending independent source check |

Once a document has been checked, record the primary source's exact section, figure, table or page, the observation, any uncertainty, who checked it and when. If a record is wrong, correct or remove its numerical claim rather than marking it verified.

## Five criteria: evidence required before claiming success

### 1. Validity
- [ ] Open primary NASA sources and confirm at least three high-priority records.
- [ ] Test a valid claim citation, a fabricated claim, and a valid claim ID attached to the wrong record.
- [ ] Verify the evidence brief never calls `needs_review` records independently verified.
- [ ] Demonstrate that simulated lunar and Martian cases are theoretical scenarios, not empirical predictions.
- [ ] Run `npm test` and `npm run lint` and record results.

### 2. Relevance
- [ ] Ask: "Which studies are most relevant to solid spacecraft material flame spread under airflow?"
- [ ] Show question-specific ranking, explanation and warnings.
- [ ] Open a NASA source from a top-ranked record and explain the conditions.
- [ ] Compare two relevant studies and identify at least one confounder.
- [ ] Generate an evidence brief with citations, limitations, and research questions.

### 3. Impact — small usability study (no fabricated results)
Three volunteers is enough for an **exploratory usability demonstration**, not a validated claim about researchers at large. Have participants find two studies, explain a difference, and locate an original source. Alternate whether they use FLARE or manual research first.

Record the following fields for each participant and method:

```csv
participant,method,order,task_completed,completion_seconds,comparison_correct,valid_source_found,notes
P1,manual,1,,,,,
P1,FLARE,2,,,,,
P2,FLARE,1,,,,,
P2,manual,2,,,,,
P3,manual,1,,,,,
P3,FLARE,2,,,,,
```

After testing, report the median completion time for completed tasks, number of correct comparisons, and valid primary source links found. Use exact observed values and disclose the tiny sample. Do not call an invented number an improvement.

### 4. Creativity
- [ ] Demonstrate NVIDIA-backed responses with a real server-side API key; otherwise explicitly identify deterministic fallback.
- [ ] Show the assistant preparing multiple actions (research filters, evidence inspection, hypothesis or simulation).
- [ ] Run the guided steps and demonstrate what changed in the app.
- [ ] Explain why FLARE's controlled, source-linked workflow differs from a plain chatbot.
- [ ] Don't claim KrillClaw is implemented unless the actual runtime and execution path can be demonstrated.

### 5. Presentation
- [ ] Video no longer than the permitted limit, or slides within the event's permitted limit.
- [ ] Show actual screen recording, not mockup or unrelated animation.
- [ ] One question drives the whole story: question → ranking → evidence → comparison → limitation.
- [ ] Explain the AI and simulator boundaries in plain English.
- [ ] Confirm demo and GitHub links work in a private window.
- [ ] Confirm all third-party code, imagery, icons and data are credited.
- [ ] Submit official form before the NASA local-time deadline.

## Three highest-risk judge questions

**How did you independently validate the source dataset?** Show a record-level audit sheet. Without one, say that the index has internal review labels and that independent source checks remain limited.

**What does the 'relevance index' mean?** It is a transparent discovery heuristic based on topic, material, gravity, reported conditions, and provenance. It is neither a learned fire prediction nor a calibrated probability.

**What does your AI agent do without human intervention?** The NVIDIA integration can return structured tool suggestions; users trigger the available guided workflow. There is no verified claim of a continuously autonomous KrillClaw research agent in this repository.

## Reproducible tests

```bash
npm ci
npm run lint
npm test
```

A passing build/test suite checks internal software behavior, not whether NASA numerical values or scientific interpretations are externally correct.
