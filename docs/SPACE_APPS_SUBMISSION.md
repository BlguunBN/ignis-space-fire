# NASA Space Apps 2026 — FLARE submission copy

> Submission-ready wording based on code and repository contents reviewed November 15, 2026. The team must confirm that the branch has been merged, deployed, and demonstrated before describing new ranking as live. Do not invent test results.

## Project name

FLARE — Fire Laboratory for Analysis, Research & Exploration

## High-level summary

NASA has collected years of microgravity combustion research, yet understanding which experiments matter for spacecraft fire safety still means searching through reports with different materials, atmospheres, and test methods. We built FLARE to help researchers find, rank, and compare that evidence in one place. It combines a source-linked research dashboard, an NVIDIA-powered research assistant with guided tool actions, and an exploratory combustion simulator. Rather than predicting whether a spacecraft will catch fire, FLARE helps users understand what NASA has measured, where experiments differ, and what still needs testing.

## Project details (copy into the form)

For the *Flame in Freefall* challenge, we wanted to solve a specific problem: NASA's combustion research is available, but finding experiments that answer a particular spacecraft safety question is still difficult. A flame-spread experiment on fabric cannot simply be treated as equivalent to droplet combustion, and results measured in microgravity cannot automatically predict conditions on the Moon or Mars.

FLARE brings those studies into one research workspace. We built an explorer that organizes NASA PSI investigations, NASA technical reports, and related scientific publications. Users can search by material, gravity, oxygen, pressure, and airflow, then compare experimental conditions and open the original source. Our question-based ranking helps identify which records deserve attention first and explains the match. Its score is a research-discovery aid, not a numerical fire-risk assessment.

We also developed a research assistant using the NVIDIA Nemotron API. Instead of being limited to a chat response, the assistant can suggest and prepare actions inside the app: filter the experiment library, inspect evidence, build a hypothesis, and configure the simulation lab. Users can follow those steps through a guided workflow. We added citation checks and scientific-limit warnings because an AI explanation should not be mistaken for an experimentally established result.

The simulation lab lets users explore simplified combustion scenarios under different gravitational and atmospheric conditions. It is useful for learning and asking questions, but we clearly separate theoretical visualizations from measured NASA findings. Our research-gap view highlights combinations of fuels, environments, and conditions that are missing from our indexed collection, which can help guide the next literature search or proposed experiment.

We built FLARE with Next.js, React, TypeScript, Tailwind CSS, Supabase, NVIDIA's API, and scientific visualization libraries. The toughest design decision was deciding what *not* to claim: our data comes from studies with different methods, our review labels are internal, and the simulator is not a validated fire-safety model.

FLARE's intended impact is practical. Someone investigating spacecraft materials can start with a question, find related NASA investigations, see why they are relevant, check the source and experimental limits, and leave with a research brief instead of a stack of disconnected links. We plan to measure its usefulness through research completion time, correct comparisons, and citation validity. We do not yet claim a proven percentage improvement.

Our aim is to help researchers, engineers, and students spend less time searching for evidence and more time deciding which fire-safety questions NASA's existing work can answer and which still require testing.

## AI use (if separately requested)

We integrated NVIDIA Nemotron through a server-side API and defined structured application tools for research filtering, evidence inspection, hypothesis development, and simulation setup. The interface presents these as a guided multi-step research process. A deterministic fallback is available when the external AI service is not configured. Citations are checked against indexed claim IDs, records, and page locators. This does not independently verify the original scientific literature. KrillClaw is not included as an implemented integration unless the team can separately demonstrate it.

## NASA data / NASA resources

| Link text | Full public URL |
| --- | --- |
| NASA Physical Sciences Informatics (PSI) | https://psi.nasa.gov/physci/repo |
| FLEX — PSI-69 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-69 |
| Saffire-I — PSI-98 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-98 |
| Saffire-II — PSI-99 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-99 |
| BASS — PSI-25 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-25 |
| SAME — PSI-102 | https://psi.nasa.gov/physci/repo/data/investigations/PSI-102 |
| NASA Technical Reports Server | https://ntrs.nasa.gov/ |
| NASA Combustion Science | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/ |

List only sources actually used. Source pages in the dataset do not by themselves authenticate every numerical value in an indexed record.

## Other tools and resources

NVIDIA AI: https://build.nvidia.com/  
Next.js: https://nextjs.org/  
React: https://react.dev/  
TypeScript: https://www.typescriptlang.org/  
Tailwind CSS: https://tailwindcss.com/  
Supabase: https://supabase.com/  
Recharts: https://recharts.org/  
D3: https://d3js.org/  
React Flow: https://reactflow.dev/  
Excalidraw: https://excalidraw.com/  
Fuse.js: https://www.fusejs.io/  
Citation.js: https://citation.js.org/  

Check the final production build for any other third-party images, icons, code, design resources or copyrighted content and attribute them individually.

## 30-second demonstration script (record only what you can show)

"NASA has decades of combustion experiments, but knowing which results apply to a spacecraft is difficult. We built FLARE to connect the evidence. I ask which studies matter for flame spread in cabin materials. FLARE ranks related experiments and explains why, then lets me compare conditions and inspect NASA sources. Our AI assistant guides follow-up research, while the simulator explores possibilities without pretending to predict real fires. FLARE makes existing NASA research easier to question, compare, and use."

## Demo sequence

1. Open dashboard. Show the indexed NASA PSI count and internal review distinction.
2. Choose the habitat flame-spread research lens; show relevance ranking and its explanation.
3. Open Saffire or BASS. Show original source, measured conditions, and limitations.
4. Compare two records; point out confounders (e.g. material, flow, geometry).
5. Show the assistant proposing guided tools. Run only the steps you have tested.
6. Open simulation; explicitly identify it as theoretical.
7. Close with the value proposition: a traceable evidence brief, not unsupported risk prediction.

## Five difficult judge questions

**Why not use a general chatbot?** FLARE connects source-linked structured experiment records, condition-aware comparison, and inspectable follow-up tools. It still requires evaluation against simpler approaches.

**Does the simulator predict a real spacecraft fire?** No. It is an exploratory, simplified model and is not a safety certification instrument.

**How do you verify citations?** The app checks that indexed claim IDs belong to the cited record and page. The team must also cross-check selected records manually against original NASA reports.

**What exactly is agentic?** The assistant can prepare multiple application actions; users execute them through a guided pipeline. This is not an unrestricted autonomous research agent.

**What measured impact can you prove?** Report only results from completed tests. Until then, the impact measures are a defined evaluation plan, not evidence of user improvement.
