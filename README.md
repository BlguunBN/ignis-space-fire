# IGNIS — Space Fire Evidence Intelligence

**Intelligent Guidance from NASA Investigation Studies**  
NASA Space Apps Challenge 2026 — *Flame in Freefall: AI/SI-Powered Fire Safety Insights from Microgravity Combustion Data*  
Ulaanbaatar, Mongolia

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![NASA PSI](https://img.shields.io/badge/Data-NASA_PSI_%26_NTRS-0B3D91)](https://psi.nasa.gov/)

---

## 1. Problem Statement
NASA has accumulated decades of microgravity combustion research across orbital platforms (ISS Combustion Integrated Rack, Microgravity Science Glovebox, Cygnus cargo resupply vehicles). These studies span diverse fuels, oxygen levels, atmospheric pressures, and low-speed ventilation flows. 

However, this critical scientific data is fragmented across raw repository files (NASA PSI), technical flight reports (NASA NTRS), and peer-reviewed journals. Spacecraft designers and mission safety engineers face severe friction determining:
- Which specific microgravity experiment addresses a proposed cabin material or ventilation regime?
- What did flight data actually demonstrate versus terrestrial 1g testing?
- Where do scientific boundaries prevent direct extrapolation to Lunar (0.16g) or Martian (0.38g) habitats?

## 2. Solution: IGNIS
**IGNIS** is an interactive evidence engine that implements the three core verbs demanded by NASA: **Summarise, Rank, and Interpret**.

Rather than an unvalidated "fire danger chatbot," IGNIS provides:
1. **Deterministic Evidence Relevance Engine**: Mathematically ranks NASA flight experiments against mission inquiry parameters (material, oxygen, pressure, airflow, phenomenon).
2. **Side-by-Side Experiment Comparison**: Directly contrasts flight investigations (e.g., Saffire-I vehicle-scale vs. BASS-II sample scale).
3. **NASA Evidence Gap Matrix**: Highlights where NASA empirical data is strong versus where Exploration missions face untested material/atmosphere gaps.
4. **Grounded AI Interpretation**: Generates cross-study syntheses constrained strictly to verified NASA DOI records, with offline resilience.

---

## 3. Architecture

```
NASA Physical Sciences Informatics (PSI) ────┐
NASA Technical Reports Server (NTRS) ────────┼──> scripts/validate.py ──> data/experiments.json
Peer-Reviewed Flight Literature ─────────────┘

       ┌────────────────────────────────────────────────────────┐
       │               Next.js App Engine (IGNIS)               │
       ├────────────────────────────────────────────────────────┤
       │  1. Deterministic Relevance Engine (lib/ranking.ts)    │
       │  2. Interactive Filters & Preset Scenarios             │
       │  3. Side-by-Side Comparison Modal                      │
       │  4. Microgravity Evidence Gap Matrix                   │
       │  5. Grounded AI Interpretation (lib/synthesis.ts)      │
       │     - Constrained Prompt Architecture                  │
       │     - Baseline-First Offline Deterministic Fallback    │
       └────────────────────────────────────────────────────────┘
```

---

## 4. NASA Data Used & Provenance

Every data point in IGNIS is integrity-linked to official NASA repositories and peer-reviewed research:

| Programme | Platform | Material / Focus | Source Identifier / DOI |
| :--- | :--- | :--- | :--- |
| **Saffire-I** | Cygnus OA-5 | Large-scale cotton-fiberglass (0.4m x 1m) | NASA PSI-98 / DOI: [10.60555/0t15-1z43](https://psi.nasa.gov/physci/repo/data/investigations/PSI-98) |
| **Saffire-II** | Cygnus OA-7 | Multi-fabric flammability limits | NASA PSI-99 / DOI: [10.60555/9p42-k721](https://psi.nasa.gov/physci/repo/data/investigations/PSI-99) |
| **Saffire-IV** | Cygnus NG-13 | PMMA Exploration Atmosphere (26% O₂, 57 kPa) | NASA PSI-100 / [NTRS 20210011521](https://ntrs.nasa.gov/citations/20210011521) |
| **BASS / BASS-II** | ISS MSG | PMMA solid polymer slabs and rods | NASA PSI-87 / DOI: [10.1016/j.firesaf.2015.11.011](https://doi.org/10.1016/j.firesaf.2015.11.011) |
| **FLEX** | ISS CIR | Droplet combustion, cool flames, CO₂ suppression | NASA PSI-69 / DOI: [10.60555/mbq8-0451](https://psi.nasa.gov/physci/repo/data/investigations/PSI-69) |
| **SAME-R** | ISS MSG | Smoke aerosol particle distribution & detection | NASA PSI-101 / DOI: [10.60555/same-r-2011](https://psi.nasa.gov/physci/repo/data/investigations/PSI-101) |
| **SPICE** | ISS MSG | Laminar co-flow soot radiation & smoke point | NASA PSI-107 / DOI: [10.60555/spice-107](https://psi.nasa.gov/physci/repo/data/investigations/PSI-107) |
| **SoFIE** | ISS CIR | Thick PMMA Exploration Atmospheres (34% O₂) | NASA GRC Combustion Science / PSI-124 |

---

## 5. Evidence Ranking Method

The Evidence Relevance Score transparently quantifies research applicability without generating fake fire risk percentages:

$$\text{Relevance} = 0.30 \cdot S_{\text{mat}} + 0.20 \cdot S_{\text{atm}} + 0.20 \cdot S_{\text{flow}} + 0.15 \cdot S_{\text{phen}} + 0.10 \cdot S_{\text{plat}} + 0.05 \cdot S_{\text{meta}}$$

### Missing-Data Policy (Anti-False Precision)
If an ambient parameter (such as cabin pressure) is not explicitly reported in the primary NASA record, IGNIS **never replaces it with terrestrial defaults (101.3 kPa)**. Instead, confidence is reduced and the missing variable is flagged in the UI.

---

## 6. AI Grounding & Guardrails

- **Zero Hallucination Tolerance:** The synthesis prompt strictly constrains answers to the top retrieved NASA records. Missing data must be reported as *"not reported in the indexed evidence"*.
- **Domain Mismatch Warning:** Forbids extrapolating microgravity (0g) results quantitatively to Lunar (0.16g) or Martian (0.38g) gravity.
- **Resilient Fallback (Baseline-First):** If an external LLM API is unavailable, IGNIS switches automatically to deterministic cross-experiment synthesis, ensuring zero failed demonstrations during judging.

---

## 7. Reproducibility & Local Setup

### Prerequisites
- Node.js >= 18
- Python >= 3.9

### Quickstart
```bash
# Clone the repository
git clone https://github.com/BlguunBN/ignis-space-fire.git
cd ignis-space-fire

# Install dependencies
npm install

# Validate NASA evidence corpus
python scripts/validate.py

# Run unit tests
npm test

# Launch development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view IGNIS.

---

## 8. License
Distributed under the **Apache-2.0 License**. See [LICENSE](LICENSE) for more information. Adheres to NASA Space Apps Challenge open source requirements.
