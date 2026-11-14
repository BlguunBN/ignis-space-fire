# UI/UX Redesign Plan — IGNIS (NASA Microgravity Fire Safety Intelligence)

**Status:** Plan only — no build-breaking changes yet.  
**Project:** X:\Development\Projects\Nasa2 (single-page Next.js app, `npm run dev` on port 5173).  
**Owner:** Orchestrator → designer (UI/UX), fixer (implementation lanes).  
**Related thread:** c96a3b65-88cb-4fbe-a6f7-9d825bde9f62 (prior exploration + hard-coded NVIDIA credential removal).

---

## 1. Goal

Redesign the IGNIS frontend into a **minimal, modern, Apple-like** experience:

- **Side nav as primary navigation** — not a top bar. Left sidebar (collapsible), consistent on desktop and mobile; remove the mobile top-bar-as-main-nav pattern.
- **Clean, uncluttered pages** — one clear focus per screen, generous whitespace, fewer stacked modals/drawers.
- **Apple-style polish** — Slate/white canvas, hairline borders, `rounded-lg` cards (8px) / `rounded-md` controls (6px), functional Lucide icons, dot + text status chips, 44–48 px primary actions.
- **Charts** via **bklit.com** (d3 + Motion + Tailwind, shadcn `@bklit` registry) — evaluate replacing/augmenting the custom `components/charts/` D3+Framer Motion system.
- **AI/agents frontend** via **kokonutui.com/docs/ai** (chat inputs, model pickers, tool approvals, citations, diff review, streaming states; Tailwind + Motion, shadcn `@kokonutui` registry).
- **Decorative/animated flourishes** via **lightswind.com** (260+ animated React components: 3D, Background, Text, Button) — sparingly, one accent per page max.
- **App-shell inspiration** via **21st.dev/community/apps** (open-source React/Next.js app layouts; pattern inspiration only, no code copy).

Constraints from the codebase:
- Single-page app: `src/app/page.tsx` (`UnifiedWorkspace`, ~645 lines) holds all state and renders everything. No providers, no auth, no role-based routing, no `React.lazy`, no query library.
- Keep the dark graphite/ink theme direction but make it cleaner (reduce glassmorphism, amber as accent).
- Tailwind config is `tailwind.config.ts` with CSS variables in `src/app/globals.css`; no `text-micro`/`text-caption` utilities (inline `text-[10px]`/`text-[11px]` used).
- No public signup (if auth is ever added, keep B2B invitation-only).

---

## 2. Current State Audit (confirmed by explorer recon)

| Area | Files | Observation |
|------|-------|-------------|
| Root shell | `src/app/layout.tsx` (1–19), `src/app/page.tsx` (1–645) | `layout.tsx` = bare HTML/body + globals.css. `page.tsx` = `UnifiedWorkspace` — the entire app in one client component, holding all state + 12 overlays. |
| Navigation | `src/components/Header.tsx` (1–68) | Hybrid: mobile sticky top bar (`h-16`, hamburger → full-screen drawer); desktop persistent left side drawer (`md:w-64`, collapsible to `w-20`). Sections: Workspace (Overview/Explore/Analysis/AI Assistant/Whiteboard), Research tools, Actions. Brand: IGNIS + Flame. |
| Styling / tokens | `src/app/globals.css` (1–167), `tailwind.config.ts` (1–33) | Dark CSS var ramp (`--bg-void #090a0d`, `--surface-card #13171e`, `--accent-amber #f59e0b`), glass classes (`glass-panel`, `glass-modal`), chart oklch vars, system font stack, inline `text-[10px]`/`text-[11px]`. |
| Charts | `src/components/TelemetryChart.tsx` (1–151), `src/components/charts/` (52 primitives) | TelemetryChart = Recharts ScatterChart (airflow vs oxygen). Plus a custom D3 + Framer Motion chart system (52 primitives: bar, axes, grid, gradients, patterns, tooltips incl. `tooltip/liquid-glass.tsx`, animations). KPI cards inline in `CoverageMapModal.tsx`. |
| AI chat | `src/components/GroundedChatDrawer.tsx` (1–769) | Right-slide drawer (Nemotron-3.5-Lightning), message thread, reasoning dropdown, citation pills, tool-call execution cards with "guided sequence" pipeline button, `POST /api/chat` + local fallback. |
| Other UI | `src/components/*.tsx` (12+ modals/drawers) | ExecutiveAnalyticsDashboard (4 KPI cards + bar chart), ResearchExplorerGrid, ComparisonTable, InvestigationDetail, CoverageMapModal, WhiteboardStudioModal, RelationshipGraphModal, CombustionSimulatorModal, PaperUploadModal, IngestionReviewModal, CompareModal, SourcesModal, PDFEvidenceViewer, GroundedBriefDrawer, GuidedResearchStepper, SearchAndFilters, SourceInspectorModal. |
| Lib | `src/lib/*.ts` | nvidia-nemotron, agent-tools, graph, synthesis, grounded-assistant, guided-actions, citations, etc. |

---

## 3. External Source Recommendations (mapped to components)

### bklit.com — Charts & Data Viz
Registry: `@bklit` via shadcn (`npx shadcn@latest add @bklit/<name>`). Docs: bklit.com/docs/components. Gallery: bklit.com/charts. Studio: bklit.com/studio.

| IGNIS use case | bklit component | Why |
|----------------|-----------------|-----|
| Telemetry over time | `Line Chart`, `Live Line Chart`, `Area Chart` | Smooth curves, tooltips, hover, crosshair; candidate to replace Recharts TelemetryChart. |
| KPI sparklines | `Sparkline` | Tiny inline line/area/bar for metric cards. |
| Study status distribution | `Pie Chart`, `Ring Chart` | Animated slices/donut + interactive legend. |
| Gravity/regime breakdown | `Bar Chart` | Stacked/grouped bars, spring animations. |
| Research coverage gaps | `Heatmap Chart` | Animated cells + interactive legend (replaces CoverageMapModal grid). |
| Citation / source flow | `Sankey Chart` | Flow between evidence nodes. |
| Multi-metric comparison | `Radar Chart`, `Composed Chart` | Shared time axis mixing bars/lines/scatter. |
| Loading states | `@bklit/shimmering-text`, loading variants | Shimmer/sweep skeletons. |

> Decision needed: keep the existing custom `components/charts/` D3+Framer Motion system, or migrate to bklit. bklit gives copy-paste registry components + Studio tuning; custom system is already integrated. Recommend bklit for new charts, evaluate migration of TelemetryChart.

### kokonutui.com — AI / Agents frontend
Registry: `@kokonutui` via shadcn (`components.json` registries + `npx shadcn@latest add @kokonutui/<name>`). Docs: kokonutui.com/docs/ai. Tailwind + Motion.

| IGNIS use case | kokonutui component | Why |
|----------------|---------------------|-----|
| AI assistant chat input | Chat input with model picker | Replaces/adorns GroundedChatDrawer prompt box; model + effort pickers. |
| Tool-call approvals | Tool approvals | "Start guided sequence" → formal approve/reject flow. |
| Citations / sources | Sources and citations | Inline cited evidence (replaces citation pills). |
| Diff review | Diff review | Whiteboard synthesis / brief comparison before accepting AI changes. |
| Streaming states | Streaming states | Assistant reply streaming + loading/empty/error states. |
| Animated accent | `particle-button` (example) | Subtle Motion-based button flourish. |

### lightswind.com — Animated flourishes
260+ copy-paste animated React components. Categories: 3D Elements (27), Components (50), Background (39), Text (10), Button (12). lightswind.com/components.

| IGNIS use case | lightswind candidate | Where |
|----------------|----------------------|-------|
| Page entry animation | 3D Elements / Background | Subtle hero/section entry on dashboard. |
| Button polish | Button (12) | Primary/secondary actions with Motion hover states. |
| Empty-state illustration | Background / Text | Clean empty states for dashboard/explorer. |

> Constraint: lightswind = animated/3D-heavy. Use sparingly (one accent per page max) to keep Apple-like minimal feel. Avoid glassmorphism/gradients/rainbow badges (anti-slop).

### 21st.dev — App-shell layout inspiration
21st.dev/community/apps — open-source React/Next.js apps (Business/SaaS, Personal apps). Use for side-nav shell patterns, dashboard layout, KPI card arrangement, responsive breakpoints. Pattern inspiration only.

---

## 4. Design Direction (Apple-like, minimal)

Adapt the existing dark graphite/ink direction toward cleaner Apple-like polish:

- Canvas: Slate-50 `#F8FAFC` (light) / dark variant (`--bg-void` family); white cards; hairline borders (`border-slate-200/80` or `--border-default`).
- Radius: `rounded-lg` cards (8px), `rounded-md` controls (6px), `rounded-sm` micro (4px), `rounded-full` pills.
- Primary: Slate-900 `#0F172A`; Accent: Blue-600 `#2563EB` (IGNIS currently amber `#f59e0b` — keep amber as secondary accent or migrate to blue; decision needed).
- Actions: 44–48 px primary (`h-11`/`h-12`), 32–36 px secondary; brand size `h-11`.
- Icons: Lucide, `size-5` nav / `size-4` inline.
- Status: dot + text chips.
- Typography: 11px minimum (`text-caption`); phase out inline `text-[10px]`/`text-micro`.
- Anti-slop: no gradients, glassmorphism, rainbow/decorative badges, decorative divider lines, ALL-CAPS labels, pure black, redundant subtitles, conversational filler, static advice callouts.
- Section titles/breadcrumbs on the canvas, not inside cards.

---

## 5. Lane Plan (parallel implementation lanes)

Each lane = non-overlapping file scope. designer owns UI/UX decisions; fixer implements; reviewer validates.

### Lane A — Shell & Navigation (side nav primary)
Files: `src/components/Header.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- Convert Header into a **left side nav shell** (collapsible, `w-64` open / `w-20` collapsed), primary on all breakpoints.
- Remove/relegate the mobile top bar; keep side nav consistent.
- Migrate globals.css tokens toward Apple-like polish (Slate canvas, white cards, hairline borders); reduce glassmorphism (`glass-panel`/`glass-modal`) → flat cards.
- Add `text-caption`-scale usage; phase out `text-[10px]`.
- Validation: build + typecheck; visual check at 375×812, 768×1024, 1440×900.

### Lane B — Charts (bklit + existing custom system)
Files: `src/components/TelemetryChart.tsx`, `src/components/charts/` (+ new `src/components/charts/bklit/*`)
- Decide: keep custom D3+Framer Motion system or migrate to `@bklit`.
- Add bklit `Line`/`Area`/`Live Line` + `Sparkline` KPIs for new chart needs.
- Add `Pie`/`Ring` for study-status; `Heatmap` for coverage gaps (CoverageMapModal).
- Keep existing chart oklch vars or migrate to bklit theming.
- Validation: build + typecheck; charts render with tooltips/hover.

### Lane C — AI / Agents frontend (kokonutui)
Files: `src/components/GroundedChatDrawer.tsx` (+ new `src/components/ai/*`)
- Install `@kokonutui` registry.
- Rework GroundedChatDrawer: chat input with model picker, streaming states, citations inline, tool approvals (approve/reject guided sequence), diff review for whiteboard synthesis.
- Keep `onRunPipeline`/`takeNextAction` integration intact.
- Validation: build + typecheck; chat flows work (stream, approve tool, citations show).

### Lane D — Page cleanup (less stuff per page)
Files: `src/app/page.tsx`, `src/components/ExecutiveAnalyticsDashboard.tsx`, `src/components/ResearchExplorerGrid.tsx`, `src/components/ComparisonTable.tsx`, `src/components/InvestigationDetail.tsx`
- Reduce modal/drawer stack: surface one primary action per page; move secondary actions into side nav or a single command menu.
- Dashboard: KPI cards + one primary chart + short list.
- Explorer: search + table + detail side panel instead of overlapping modals.
- Validation: build + typecheck; keyboard focus; EN overflow.

### Lane E — Animated flourishes (lightswind, sparingly)
Files: new `src/components/ui/animated/*` (leaf components only)
- One tasteful animated accent per page (button hover, entry fade, empty-state illustration).
- No gradients/glass; Motion-based, accessible, respects reduced motion.
- Validation: build + typecheck.

### Lane F — App-shell patterns (21st.dev)
Files: `src/components/layout/*` (if created)
- Study 21st.dev app layouts for side-nav/dashboard patterns; apply to Lane A shell.
- Pattern inspiration only, no external code copy.
- Validation: design review by designer.

---

## 6. Verification Gate (per repo conventions)

- Run `npm run build` from `X:\Development\Projects\Nasa2` before declaring any lane complete.
- Run targeted tests: `npx vitest run src/<lane-path>` for affected suites.
- Run `npm run lint`.
- UI exercise each affected route at 375×812, 768×1024, 1440×900 including loading/empty/error/unauthorized/disabled states, keyboard focus.
- Do not claim tests pass without a build/test receipt.

---

## 7. Constraints & Non-Goals

- **Plan-only this session:** no build-breaking UI changes without your approval.
- No auth/providers/role-based routing exist — do not add unless requested.
- No React Query / SWR / zustand — keep hand-rolled React state in page.tsx.
- No route-level code splitting (no `React.lazy`).
- Do not edit generated files directly.
- Keep secrets in env vars (NVIDIA_API_KEY — hard-coded fallback already removed per prior thread).
- Reticle wiring: none currently (not wired on this project).

---

## 8. Next Step

Approve the plan (or request changes), then I'll dispatch Lane A (shell + nav) as the first implementation lane, since it's the foundation for all other lanes.
