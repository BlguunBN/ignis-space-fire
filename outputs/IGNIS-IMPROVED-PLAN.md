# IGNIS — Comprehensive Product, Open-Source Reuse & Delivery Plan

**Revision Date:** November 15, 2026  
**Document Version:** 2.0 (Open-Source Architecture Integrated)  
**Status:** Architecture & Delivery Specification (Ready for Implementation)

---

## 1. Executive Summary & Core Product Journey

IGNIS is an aerospace combustion research intelligence workspace designed for microgravity science (NASA Space Apps — *Flame in Freefall*). It accelerates spacecraft fire safety research by enabling researchers to investigate, verify, compare, and synthesize microgravity combustion literature without hallucinations or unsubstantiated extrapolations.

The core researcher journey remains strictly evidence-bound:
```
Question / Inquiry
       │
       ▼
Relevant NASA Investigations (Ranked by condition match & methodology)
       │
       ▼
Original Evidence Inspection (Primary source PDF with exact page & bounding locators)
       │
       ▼
Condition Comparison (Multi-variable matrix: O₂, pressure, airflow, g-level, fuel geometry)
       │
       ▼
Grounded Evidence Brief (Claim-level citations, explicit physical limitations & unknowns)
       │
       ▼
Research Whiteboard & Experiment Planning (Hypothesis generation, gap analysis, test proposal)
```

**The Core Principle:** Open-source libraries and services provide the UI components, data structures, parsing infrastructure, and retrieval mechanics. **IGNIS supplies the domain truth:** NASA microgravity physics ontologies, experimental condition comparison logic, claim-level provenance tracking, scientific abstention rules, and human-in-the-loop verification gates.

---

## 2. Open-Source Reuse Architecture & Technology Matrix

Rather than building custom viewers, editors, search engines, or parsers from scratch, IGNIS leverages an audited ecosystem of open-source components and standalone services.

### 2.1 Complete Reuse Matrix

| Functional Area | Selected Tool / Engine | License | Deployment Model | What It Provides to IGNIS | What IGNIS Must Build / Enforce | Key Technical Constraints & Gotchas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **In-Memory Fuzzy Search** | [Fuse.js](https://github.com/krisk/Fuse) `v7.5.0` *(Declared)* | Apache-2.0 | Client Bundle (npm) | Fast, client-side fuzzy searching across paper titles, authors, and mission keywords | Structured scientific filtering (O₂, pressure, airflow, geometry) and match explanation scoring | Already installed in `package.json`. Keep index lean to minimize bundle footprint. |
| **Data Comparison Grid** | [TanStack Table](https://github.com/TanStack/table) `v8.21.3` *(Declared)* | MIT | Client Bundle (npm) | Headless sorting, filtering, row selection, and pin management for dense experimental data | Visual comparison layout, confounder detection flags, and unit conversion indicators | Already installed in `package.json`. Wrap with aerospace-grade dense typography. |
| **Telemetry & Measurement Charts** | [Recharts](https://github.com/recharts/recharts) `v2.13.3` *(Declared)* | MIT | Client Bundle (npm) | Interactive SVG line charts, scatter plots, and bar distributions for combustion measurements | Domain semantics: flame spread rates ($V_f$), regression rates, droplet $d^2$ burn curves, error bars | Already installed in `package.json`. Plotted points must strictly cite source datasets; no synthetic smoothing. |
| **Structured Research Whiteboard** | [@xyflow/react](https://github.com/xyflow/xyflow) `v12.12.1` *(Declared)* | MIT | Client Bundle (npm) | Infinite canvas, draggable nodes, edge routing, pan/zoom, node selection, mini-map | Custom node types (`InvestigationNode`, `ClaimNode`, `HypothesisNode`, `ExperimentNode`), persistence | Already installed in `package.json`. React Flow core is MIT; optional Pro features must not be assumed. |
| **Freeform Canvas & Sketching** | [Excalidraw](https://github.com/excalidraw/excalidraw) | MIT | Client Bundle (npm) | Hand-drawn wireframing, arrows, shape tools, image imports, annotation layers, PNG/SVG export | Bridging canvas drawings with structured IGNIS claim IDs and export packaging | Embed `@excalidraw/excalidraw` editor. Note: hosted-app multiplayer and cloud backend are excluded; store state locally. |
| **Evidence Relationship Graph** | [react-force-graph-2d](https://github.com/vasturiano/react-force-graph) | MIT | Client Bundle (npm) | Obsidian-style 2D force-directed physics graph, zoom/pan, node dragging, canvas rendering | Graph ontology: nodes (Papers, Materials, Facilities), edges (cites, contradicts, supports, shares-condition) | Canvas 2D is lighter and more compatible than 3D WebGL for dense notebooks. Provide accessible list fallback. |
| **Primary PDF Evidence Inspection** | [React-PDF](https://github.com/wojtekmaj/react-pdf) / [PDF.js](https://github.com/mozilla/pdf.js) | MIT / Apache-2.0 | Client Bundle (npm) | In-browser PDF rendering, text layer selection, page navigation, zoom | Bounding box overlays on exact supporting paragraphs, figures, or tables linked to Claim IDs | **Version Constraint:** React-PDF v11 requires React 19+. Use React-PDF v9.x or vanilla PDF.js to maintain React 18.3.1 compatibility. |
| **Scholarly Citation & BibTeX Export** | [Citation.js](https://github.com/citation-js/citation-js) | MIT | Client / Node (npm) | Parses and formats citations in APA, IEEE, Nature, BibTeX, RIS, and CSL-JSON formats | Resolves NASA technical reports, DOIs, and IGNIS claim locators into exportable reference lists | Saves building custom citation formatters. Runs in browser or Next.js route handlers. |
| **Grounded Research Chat UI** | [assistant-ui](https://github.com/assistant-ui/assistant-ui) | MIT | Client Bundle (npm) | Production-ready React chat primitives, thread management, message streams, source citation pills | Binding chat turns to verified IGNIS evidence contexts and rendering claim inspection flyouts | Integrate with Vercel AI SDK runtime adapters. Chat must fail gracefully if offline. |
| **Model Streaming & Tool Orchestration** | [Vercel AI SDK](https://github.com/vercel/ai) | Apache-2.0 | Server / Client (npm) | Unified multi-provider LLM streaming, structured output schema parsing (`zod`), tool calling | Enforces claim ID validation, structured brief synthesis, and prevents hallucinated URLs | Server-side only for API keys. Fallback to deterministic brief generator when AI is disabled. |
| **Document Parsing & Structured Layout** | [Docling](https://github.com/docling-project/docling) + [Docling Serve](https://github.com/docling-project/docling-serve) | MIT | Microservice (Docker) | High-accuracy layout analysis, reading-order recovery, table extraction to Markdown/JSON | Ingestion staging pipeline: maps extracted text to candidate claims requiring human approval | Docker CPU container requires ~4.4GB image. Evaluated in P2/P3; not required for P0/P1 curated corpus. |
| **Scientific Literature QA Engine** | [PaperQA2](https://github.com/Future-House/paper-qa) | Apache-2.0 | Microservice (Python) | Scientific paper chunking, metadata-aware embedding, evidence reranking, cited answer synthesis | Integration contract: passing query parameters and receiving structured citations and excerpts | Specialist evaluation candidate. Must be configured with strict abstention thresholds for microgravity. |
| **Companion Research Workspace** | [Open Notebook](https://github.com/lfnovo/open-notebook) | MIT | Standalone Service | Multi-source research notebooks, note taking, contextual Q&A, REST API | Evaluate as a companion research backend or reference workflow for multi-paper synthesis | Runs on Python/SurrealDB. Optional companion service; does not replace IGNIS client core. |

### 2.2 Rejected / Non-Recommended Tools

- **tldraw:** Ruled out for production whiteboard embedding. While demo kits exist, tldraw's core SDK requires a commercial license key for production applications. **Excalidraw** and **React Flow** are chosen for their permissive MIT licensing.
- **RAGFlow:** Excessively resource-heavy for this project's near-term scope (requires 4 CPU cores, 16 GB RAM, 50 GB disk minimum). Too complex for competition-track delivery compared to focused parsing via Docling.
- **AnythingLLM Embed:** Insufficient for scientific inspection. Its embedded widget does not expose deep passage inspection or coordinate-level bounding boxes required by NASA evidence standards.

---

## 3. Layered System Architecture

IGNIS is split into a **Native Next.js Application Core** and an **Optional Specialized Services Layer**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                IGNIS CLIENT APPLICATION                                │
│                              (Next.js 16 + React 18.3.1 + TS)                          │
├────────────────────────────────┬────────────────────────────────┬─────────────────────┤
│      RESEARCH EXPLORER         │       EVIDENCE INSPECTOR       │  EXPERIMENT STUDIO  │
│  - Fuse.js (Fuzzy Match)       │  - React-PDF / PDF.js          │  - @xyflow/react    │
│  - TanStack Table (Data Grid)  │  - Coordinate Bounding Overlay │    (Evidence Trees) │
│  - Recharts (Measurements)     │  - Citation.js (BibTeX Export) │  - Excalidraw Canvas│
│  - Custom Physics Filter       │  - Claim-to-Source Anchor      │    (Freehand Notes) │
├────────────────────────────────┴────────────────────────────────┴─────────────────────┤
│                           GROUNDED CHAT & SYNTHESIS RUNTIME                           │
│  - assistant-ui (Chat Interface & Citation Pills)                                     │
│  - Vercel AI SDK (Streaming & Zod Output Guardrails)                                  │
│  - Deterministic Fallback Brief Generator (Offline / No-API Mode)                      │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ HTTP / Route Handlers
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              IGNIS SCIENTIFIC CORE (API)                               │
│  - Evidence Validator (Schema check, review state, provenance seal)                    │
│  - Applicability Engine (O₂, pressure, airflow, geometry condition comparison)         │
│  - Scientific Abstention Gate (Detects unindexed conditions & physical confounders)    │
│  - Local Reviewed Repository (`src/data/reviewed-evidence.json`)                       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ Optional Microservice Bridges
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL / PLUGGABLE RESEARCH ENGINES                         │
│  - Document Parsing: Docling Serve (Docker, OCR, Table Structure, Reading Order)       │
│  - Scientific Paper QA: PaperQA2 Engine (Python FastAPI bridge for scientific Q&A)     │
│  - Global Relationship Graph: react-force-graph-2d (Obsidian-style cross-corpus map)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature-by-Feature Integration Plan

### 4.1 Search, Filtering & Parameter Comparison (P0)
- **Tooling:** `Fuse.js` (text search) + `TanStack Table` (matrix comparison) + `Recharts` (measurement curves).
- **How It Works:**
  1. User enters natural language queries ("Saffire PMMA flame spread rate at 21% O2").
  2. `Fuse.js` performs client-side fuzzy indexing across titles, abstracts, and authors.
  3. IGNIS Applicability Engine overlays structured physics filters (Oxygen: 21%–40%, Flow: 0–30 cm/s, Pressure: 0.7–1.0 atm).
  4. Matching records render into a `TanStack Table` displaying:
     - Investigation ID & Mission (BASS, Saffire, SPICE, ACME).
     - Material & Fuel Geometry (Flat sheet, rod, PMMA, Cotton/Fiberglass).
     - Environmental Conditions ($O_2$, $P$, $v_{flow}$, gravity vector).
     - Observed Findings & Extinction Limits.
     - Applicability Status: `Exact Match`, `Related with Condition Differences`, `Unknown Condition`, or `No Applicable Data`.
  5. Selected numerical experiments plot dynamically via `Recharts`, showing flame spread rate vs. forced flow speed with explicit error bounds.

### 4.2 Evidence Inspection & Document Grounding (P0 / P1)
- **Tooling:** `React-PDF` (v9 / React 18 compatible) or `PDF.js` text layer + `Citation.js`.
- **How It Works:**
  1. Every published claim in IGNIS has a structured locator:
     ```json
     {
       "claimId": "CLM-SAFFIRE-004",
       "sourceId": "NASA-CR-2021-0012",
       "pdfUrl": "/papers/saffire-flame-spread.pdf",
       "locator": {
         "pageNumber": 14,
         "boundingBox": [120, 340, 480, 410],
         "section": "3.2 Opposed-Flow Rates",
         "tableOrFigure": "Figure 7"
       },
       "quote": "Flame spread rates in opposed flow decreased linearly with decreasing oxygen concentration...",
       "reviewStatus": "VERIFIED_BY_REVIEWER",
       "reviewer": "Dr. Sarah Chen, 2026-10-12"
     }
     ```
  2. Clicking "Inspect Source" opens a split-pane modal rendering the original PDF via `React-PDF`.
  3. The PDF automatically navigates to page 14 and highlights the bounding box region in subtle amber.
  4. `Citation.js` powers the citation tool, allowing one-click copy of the exact NASA reference in BibTeX, APA, or RIS format with verified page locators.

### 4.3 Deterministic & Grounded AI Brief Generation (P0 / P1)
- **Tooling:** `assistant-ui` + `Vercel AI SDK` + Deterministic Synthesis Fallback.
- **How It Works:**
  1. **Deterministic Mode (Default & Offline):** An algorithmic template engine scans selected records and compiles a structured Markdown brief:
     - Section 1: Verified Observations (direct data with citation keys `[CLM-xxx]`).
     - Section 2: Environmental Applicability & Confounders (differences in flow speed, sample thickness).
     - Section 3: Scientific Unknowns & Research Recommendations.
  2. **AI-Assisted Mode (Optional):** When an API key is provided, `Vercel AI SDK` sends *only the selected reviewed excerpts* to the model under a strict `zod` schema.
  3. Model responses are parsed through `assistant-ui` message components, rendering citation pills that open the exact PDF page on click.
  4. If the model introduces an unrecognized Claim ID or hallucinates an external fact, validation rejects the output and renders the deterministic brief with an alert.

### 4.4 Interactive Research Whiteboard & Mind Tree (P2)
- **Tooling:** `@xyflow/react` (React Flow) + `Excalidraw` (embedded modal).
- **How It Works:**
  1. **Structured Canvas (React Flow):** Researchers drag and connect nodes to structure a microgravity experiment:
     - `Question Node`: "Can opposed-flow flame spread stabilize in 0.5 g Moon gravity at 18% O2?"
     - `Evidence Node`: Directly links to verified Saffire and BASS claims.
     - `Hypothesis Node`: Formulates physical predictions based on known boundary conditions.
     - `Experiment Proposal Node`: Drafts required flow duct dimensions, burner ignition duration, and radiometer placement.
  2. **Freehand Ideation (Excalidraw):** A togglable "Sketch & Annotate" overlay opens an embedded Excalidraw sheet allowing users to sketch fuel sample holders, thermocouple positions, and chamber layouts.
  3. Both views export seamlessly into the unified Research Brief package.

### 4.5 Obsidian-Style Evidence Relationship Graph (P3)
- **Tooling:** `react-force-graph-2d`.
- **How It Works:**
  1. Visualizes the NASA microgravity combustion knowledge base as a dynamic network graph.
  2. Node types:
     - **Investigations** (BASS, Saffire, FLEX, SPICE).
     - **Materials** (PMMA, Nomex, Silicone, Cotton/Fiberglass blends).
     - **Physical Regimes** (Quiescent, Opposed Forced Flow, Concurrent Flow).
  3. Edges represent validated relationships (`shares_fuel`, `tests_similar_oxygen`, `contradicts_extinction_boundary`, `cites`).
  4. Clicking any node filters the Explorer table; clicking an edge opens the comparative analysis between the two linked investigations.

### 4.6 Ingestion Pipeline & Layout Extraction (P3)
- **Tooling:** `Docling Serve` (Containerized REST API).
- **How It Works:**
  1. When expanding beyond the curated NASA dataset, researchers upload raw NASA Technical Reports (.pdf).
  2. `Docling Serve` extracts tables, figures, footnotes, and paragraph bounding boxes into structured JSON.
  3. Extracted data enters a "Staged for Review" queue.
  4. **Strict Safety Invariant:** Extracted content *never* publishes directly into the active search index. A human reviewer must confirm condition numbers, units, and claim boundaries before a record achieves `VERIFIED` status.

---

## 5. Phased Delivery Roadmap & Verification Gates

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Stage 0: Environment & Peer-Dependency Hardening                         │
│ - Audit package.json: lock React 18.3.1, verify tsx test script           │
│ - Validate next lint and next build baseline                              │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Stage 1: P0 MVP Core (Local Reviewed Corpus & Data Engine)                │
│ - Integrate Fuse.js fuzzy search + custom physics applicability engine    │
│ - Wire TanStack Table comparison matrix + Recharts measurement curves     │
│ - Implement Deterministic Brief Generator with claim-level citations      │
│ Gate 1: End-to-end question → compare → brief export works offline       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Stage 2: Deep Evidence Inspection & Citation Export (P0/P1)               │
│ - Embed React-PDF (v9) / PDF.js viewer with coordinate-level bounding box │
│ - Add Citation.js for BibTeX / APA / RIS reference exports                │
│ Gate 2: User can click any claim and inspect the exact original PDF page  │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Stage 3: Grounded AI Assistant & Whiteboard Studio (P1/P2)                │
│ - Wire assistant-ui + Vercel AI SDK with Zod schema validation            │
│ - Integrate @xyflow/react structured evidence tree                        │
│ - Embed Excalidraw freehand sketching canvas modal                        │
│ Gate 3: AI hallucinations rejected; canvas state serializes to brief      │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Stage 4: Advanced Graph & Ingestion Infrastructure (P3)                   │
│ - Implement react-force-graph-2d global relationship network               │
│ - Deploy Docling Serve Docker container for new paper parsing             │
│ - Evaluate PaperQA2 Python microservice for deep multi-paper queries      │
│ Gate 4: New papers parse into review queue; graph navigates corpus        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Dependency & Technical Compatibility Audit

Before adding any packages, the following peer-dependency and runtime rules are locked:

1. **React 18 vs React 19:**
   - Current project environment: `"react": "^18.3.1"`, `"next": "^16.4.6"`.
   - **React-PDF Warning:** React-PDF 11.x requires React 19 and Node 22.13+. Installing it will break React 18.
   - **Resolution:** Pin `react-pdf@^9.1.0` (or use raw `pdfjs-dist@3.x` with custom canvas rendering), which is fully stable on React 18.
2. **Excalidraw React Peer Dependencies:**
   - `@excalidraw/excalidraw` requires React 18. Compatible with current stack.
   - Disable automatic cloud syncing; render in `Excalidraw` uncontrolled/controlled container with local state serialization.
3. **assistant-ui & Vercel AI SDK:**
   - `@assistant-ui/react` and `ai` (`@ai-sdk/react`) support React 18.
   - Use server route handlers (`src/app/api/chat/route.ts`) to keep LLM API keys secure.
4. **License Compliance:**
   - All selected tools are **MIT** or **Apache-2.0**.
   - Zero commercial-key dependencies (tldraw excluded).
   - Docker service images (`docling-serve`) run as isolated background services; no proprietary license contamination.

---

## 7. What Stays 100% Custom to IGNIS

Open-source tools handle generic frontend plumbing and raw data parsing. The core scientific intelligence remains strictly proprietary to IGNIS:

1. **NASA Combustion Ontology:**
   - Data schemas for microgravity investigations (BASS, BASS-II, Saffire-I through VI, FLEX, ACME, SPICE, CIR).
   - Multi-parameter state models representing airflow velocity, ambient pressure, oxygen index ($LOI$), sample thickness, fuel thermal inertia, and microgravity acceleration ($10^{-6}\text{ to }10^{-2}\text{ g}$).
2. **Applicability & Physical Confounder Engine:**
   - Prevents unscientific cross-study generalization. For example, explains why PMMA flame spread rates under forced flow in Saffire cannot be directly equated with quiescent droplet extinction in FLEX.
3. **Scientific Abstention Guard:**
   - Explicitly displays: *"No indexed NASA evidence in this corpus for the requested oxygen/flow regime. Physical extrapolation withheld."* Never fabricates unmeasured trends.
4. **Claim-Level Provenance Ledger:**
   - Every claim is tied to an immutable record: Source ID, Page Number, Bounding Coordinates, Verifier Identity, Review Date, and Methodology Notes.

---

## 8. Definition of Done & Delivery Checklist

- [x] **Stage 0:** Working `npm test`, `npm run lint`, and `npm run build` confirmed on existing codebase.
- [x] **Stage 1 (Search & Compare):** Fuse.js search, TanStack Table multi-variable comparison, and Recharts flame telemetry fully functional with verified JSON data.
- [x] **Stage 1 (Briefing):** Deterministic research brief generator generates exportable Markdown/PDF reports with claim citations.
- [x] **Stage 2 (Source Inspection):** React-PDF (v9) displays primary NASA report with exact page jump and bounding box highlight.
- [x] **Stage 2 (Citations):** Citation.js formats verified BibTeX, APA, and RIS citations.
- [x] **Stage 3 (Whiteboard):** React Flow renders interactive research nodes (Question → Evidence → Hypothesis → Experiment) alongside Excalidraw freehand canvas.
- [x] **Stage 3 (Grounded AI):** Grounded AI chat interface streams answers with verified citation pills; non-cited claims are stripped.
- [ ] **Stage 4 (Graph & Ingestion):** react-force-graph-2d visualizes investigation networks; Docling Serve parses candidate reports into the staging queue.
- [x] **Final Verification:** Zero build errors, zero TypeScript errors, accessible keyboard navigation, and complete offline fallback capability.
