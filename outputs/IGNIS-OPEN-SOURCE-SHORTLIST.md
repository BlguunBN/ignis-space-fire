# IGNIS open-source reuse shortlist

Research date: November 15, 2026. Searched and inspected through the connected GitHub plugin. No installation, cloning, application changes, or runtime verification performed.

## Recommendation

Keep IGNIS as the research interface. Reuse installed libraries for the MVP; add a PDF viewer and citation formatter when needed. For the full product, choose one document-processing/retrieval backend rather than running several overlapping RAG platforms.

Two reasonable paths:

1. Native IGNIS: existing Next.js interface + React Flow/TanStack/Fuse/Recharts + Excalidraw + assistant-ui; later Docling Serve and an evaluated PaperQA2 backend. Maximum control of evidence contracts, with some integration work.
2. Ready-made research service: evaluate Open Notebook first, or Kotaemon for its cited PDF inspection workflow. Run separately and connect through a documented API where available. Less document-workflow construction, but service deployment, API mapping, and evidence-policy work remain.

These are candidate architectures, not an instruction to add all listed tools.

## Complete apps and research engines

| Project | License | Useful existing functionality | How IGNIS could reuse it | Main limitation |
| --- | --- | --- | --- | --- |
| [Open Notebook](https://github.com/lfnovo/open-notebook) | MIT | Notebooks, sources, contextual chat, notes/insights, citations, REST API | Evaluate as a separate research backend behind the IGNIS interface, or use the complete app as a companion workspace | Python/API, Next.js UI, background worker and SurrealDB; not an npm component. NASA review states and citation contracts require mapping |
| [Kotaemon](https://github.com/Cinnamon/kotaemon) | Apache-2.0 | Document collections, hybrid retrieval, reranking, multimodal QA, highlighted PDF citations, GraphRAG example | Use the full app for an evidence-review pilot; reuse Python pipeline pieces if selected | Gradio interface; a custom IGNIS service boundary is additional work. Last repository push observed July 14, 2026; evaluate release/issues before adoption |
| [RAGFlow](https://github.com/infiniflow/ragflow) | Apache-2.0 | Parsing, configurable chunking, retrieval/reranking, citations, APIs, agent workflows, knowledge compilation | Strong candidate for a later shared ingestion/retrieval service | Heavier service stack. README recommends starting with 4 CPU cores, 16 GB RAM, 50 GB disk. Compiled graphs are not automatically reviewed scientific relationships |
| [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | MIT | Document ingestion, workspaces, cited chat, model configuration, API, embeddable chat | Quick generic document-chat companion or backend; built-in embed is a quick integration option | Embed is available in Docker version; [embed README](https://github.com/Mintplex-Labs/anythingllm-embed) says users cannot inspect context snippets as in the main app. Check this against IGNIS source-inspection requirements |
| [PaperQA2](https://github.com/Future-House/paper-qa) | Apache-2.0 | Scientific-document QA, metadata-aware retrieval, evidence summarization/reranking, in-text citations, local document search | Most relevant specialist Python engine to evaluate for paper-grounded question answering | Library/engine rather than complete Next.js product. Defaults use model and embedding providers; configure library boundaries and evaluate abstention/citation fidelity |
| [SurfSense](https://github.com/MODSetter/SurfSense) | Apache-2.0 core | Local-first document research, cited answers, document creation/editing/transformation | Evaluate as a complete companion app and research-workflow reference | Current README describes a desktop/local-first product. Some first-party web plugins require a separate license; do not infer all features are unrestricted or embeddable |

First pilot: feed the same few reviewed NASA papers to Open Notebook, Kotaemon, or PaperQA2 and compare page locators, condition preservation, unsupported answers, and operational burden. Do not choose purely by stars or screenshots.

## Embeddable components and focused services

| IGNIS feature | Reusable project | License | Integration and remaining work |
| --- | --- | --- | --- |
| Search papers and metadata | [Fuse.js](https://github.com/krisk/Fuse) | Apache-2.0 | Already declared. Reuse for fuzzy text matching; IGNIS still owns structured scientific filters and ranking reasons |
| Comparison, filtering, sorting | [TanStack Table](https://github.com/TanStack/table) | MIT | Already declared. Headless table behavior; display scope, units, nulls, and confounders in IGNIS |
| Measurement and coverage charts | [Recharts](https://github.com/recharts/recharts) | MIT | Already declared. Reuse rendering; source provenance and coverage-bin semantics stay custom |
| Experiment planning and mind maps | [React Flow](https://github.com/xyflow/xyflow) | MIT core | Already declared as @xyflow/react. Custom evidence/question/hypothesis nodes, links, pan/zoom, selection. Data persistence and domain semantics remain |
| Freeform research whiteboard | [Excalidraw](https://github.com/excalidraw/excalidraw) | MIT | Embeddable editor with shapes, arrows, images, undo/redo, pan/zoom, JSON and image export. Hosted-app multiplayer, encryption, and autosave are not automatic package features |
| Obsidian-like graph | [react-force-graph](https://github.com/vasturiano/react-force-graph) | MIT | Use 2D package for force layout, node dragging, zoom, hover/click. IGNIS supplies reviewed nodes/edges and accessible alternative navigation |
| PDF evidence viewer | [React-PDF](https://github.com/wojtekmaj/react-pdf) | MIT | React wrapper for existing PDFs; worker/client rendering configuration required. Current 11.x README requires React 19+ and Node 22.13+. Scaffold declares React 18: select a verified compatible version or use PDF.js |
| Framework-independent PDF rendering | [PDF.js](https://github.com/mozilla/pdf.js) | Apache-2.0 | Alternative underlying viewer/rendering engine. Citation overlays, original-page linking, and reviewed locator mapping still need wiring |
| Chat interaction | [assistant-ui](https://github.com/assistant-ui/assistant-ui) | MIT | Reusable React/TypeScript chat components and runtime adapters. Connect to selected backend; not itself retrieval or a grounding guarantee |
| Model streaming/provider integration | [Vercel AI SDK](https://github.com/vercel/ai) | Apache-2.0, confirmed in root LICENSE | Optional TypeScript toolkit when building a native backend. Avoid duplicating an existing platform's orchestration. Validate exact package compatibility before selection |
| PDF/layout/table/OCR extraction | [Docling](https://github.com/docling-project/docling) + [Docling Serve](https://github.com/docling-project/docling-serve) | MIT | Python parser with structured document representation, JSON/Markdown, layout and table understanding; Serve exposes HTTP API. Extracted claims remain candidates. Separate service/models rather than a browser package |
| Scholarly metadata/references | [GROBID](https://github.com/grobidOrg/grobid) | Apache-2.0 | Specialized headers, references, citation contexts, structured full text and PDF coordinates. Add only if Docling/backend metadata extraction is inadequate. Service/container recommended on this Windows setup; README does not ensure current native Windows support |
| Bibliography/export formatting | [Citation.js](https://github.com/citation-js/citation-js) | MIT | CSL, BibTeX, RIS and DOI plugins. Formatting saves work but does not prove a DOI, locator, or cited claim is correct |

React Flow and Excalidraw serve different needs. Start with React Flow for structured research nodes; add Excalidraw only when freehand drawing is important. The force graph is a separate read/explore view and can wait until relationship data exists.

Docling Serve's README lists a CPU image around 4.4 GB and larger GPU/base variants. Plan deployment/storage before treating parsing as a lightweight serverless function. Model/artifact/dependency terms may differ from the repository's code license.

## Feature-by-feature adoption decisions

- Research Explorer: reuse Fuse and TanStack. No external full app needed for the small curated corpus.
- Evidence inspection: evaluate PDF viewer plus exact claim/page locators. A generic chat bubble is insufficient.
- Comparison: reuse table controls; retain custom scientific applicability rules.
- Grounded brief/chat: deterministic brief first; later choose one of PaperQA2, Open Notebook, or another evaluated backend. assistant-ui provides the front end when useful.
- Ingestion/archive: reuse Docling or the selected platform's existing parser; do not automatically run two independent pipelines. IGNIS owns review/publish state and source identity.
- Whiteboard: React Flow for evidence-linked planning; Excalidraw for freeform drawing if required.
- Evidence graph: react-force-graph-2d for exploration, with the same IDs as citations and boards.
- Coverage map: existing Recharts/table components. Counts and meaningful bins remain IGNIS logic.
- Guided workflow: model the actual research steps in application state. A tour overlay cannot implement evidence selection, review, comparison, or briefing.
- Export: browser print and Markdown first; Citation.js if standardized references/BibTeX are needed.
- Simulation: this research did not establish a validated drop-in microgravity combustion simulator for IGNIS. A chart library or general physics solver does not remove model-validation requirements.
- Incidents, atmosphere presets and governing equations: these primarily need checked content and applicability review, rather than another application framework.

## Licensing and compatibility findings

- Prefer MIT/Apache-2.0 components for this integration path, retaining required notices and attribution. This is repository-level screening, not a complete dependency/model/media license audit.
- [tldraw](https://github.com/tldraw/tldraw) is not the default unrestricted open-source recommendation: current README says SDK production use requires a license key under the tldraw license. Its MIT starter kits do not make the SDK MIT.
- React Flow core is MIT; optional Pro material is separate. Do not assume every commercial example is covered by the core license.
- SurfSense core's Apache license does not establish terms for all plugins/services.
- PDF viewer, React canvas and chat packages need release-specific peer-dependency checks against React 18. Do not upgrade the app's framework simply to follow a README's latest branch.
- Open-source software can still incur hosting, model API, embedding, parsing, storage, and maintenance costs.

## What stays unique to IGNIS

Reuse can remove substantial generic UI and retrieval construction. It cannot remove NASA source review, experimental-condition modeling, applicability limitations, scientific abstention, claim-level provenance, or numerical model validation. No reviewed project was established as an exact, validated replacement for those responsibilities.

## Research evidence and limits

GitHub repository search was used for discovery, followed by metadata and README inspection for the shortlisted tools. Repository API metadata identified the listed licenses and archived status; selected root license files were also read, including AI SDK where automatic SPDX detection was inconclusive. Recommended repositories inspected through metadata were not archived. Most showed recent pushes in September–November 2026; Kotaemon's observed push was July 2026. Activity is a screening signal, not a quality verdict.

This is a targeted shortlist. Not performed: running apps, integration spikes, comprehensive issue/release audits, dependency security review, full license audit, model-quality evaluation, or exact release selection. Installation and application modifications require a separate implementation request and any applicable approvals.
