# IGNIS — Space Fire Intelligence Platform

> **NASA Space Apps Challenge · Flame in Freefall**  
> An evidence-grounded research intelligence and visual exploration platform for NASA microgravity combustion science.

**🔗 Live Deployment**: [https://ignis-space-fire.netlify.app/](https://ignis-space-fire.netlify.app/)

---

## Overview

**IGNIS** is a research workspace for exploring spacecraft fire safety literature. Its indexed records include NASA investigations, technical reports, agency reports, and peer-reviewed research. Lunar and Martian scenarios are exploratory and must not be presented as flight measurements without supporting sources.

### Core Capabilities

- **Research Explorer**: Search, filter, and inspect 50 indexed records across materials, oxygen concentrations, airflow velocities, and pressures.
- **Microgravity Droplet Combustion Simulator**: Real-time 2D simulation of spherical diffusion flames, $d^2$-law burning rate ($K$), buoyant plume transitions across gravitational regimes ($\mu\text{g}$, Lunar, Martian, Earth), and interactive cursor-driven airflow nozzles.
- **Optical Diagnostics Studio**: Computer vision filters (Raw, Chemiluminescence, Sobel Edge Contours, 2-Color Pyrometry) and scanline intensity profile extraction from real flight telemetry frames.
- **Research Assistant**: An NVIDIA-backed assistant with a deterministic fallback, indexed citations, and hypothesis tools. Citations require source review and do not guarantee that generated text is supported.

---

## NASA Flight Data Sources

The current index contains 12 records classified as NASA PSI, 20 as NTRS, 14 as agency reports, and 4 as peer-reviewed. These are source categories, not independent verification. Internal review labels do not imply NASA approval or confirm each observation. The index includes records associated with:

- **FLEX / FLEX-2 (PSI-69, DOI: 10.60555/mbq8-0451)**: Droplet extinguishment, $d^2$-law burning rate constants, and visible flame extinction diameters aboard the ISS Combustion Integrated Rack (CIR).
- **BASS / BASS-II (PSI-25 & PSI-26, DOI: 10.60555/58h4-dy80)**: Opposed-flow flame spread, low-speed convective quenching, and blowoff limits over PMMA cylinders and SIBAL fabric in the Microgravity Science Glovebox.
- **Saffire Series (Saffire-I through Saffire-VI, ICES-2024-365)**: Large-scale flame spread, calorimetry, and smoke emissions inside uncrewed Cygnus cargo vehicles.
- **SoFIE (RTDFS, GEL, NCA, MIST, SMuRF)**: Solid fuel ignition and extinction limit test series investigating thick solid thermoplastics and residence-time-driven flame spread.

---

## AI Implementation & Safety Invariants

- **Grounding limits**: The assistant can return indexed citations, but matching a citation does not prove a generated sentence is supported. Check the original source before relying on a claim.
- **Simulation limits**: Simulated scenarios are exploratory and are not fire probabilities or safety certifications.
- **Hypotheses**: Proposed experiments are not observations and may lack supporting indexed evidence.

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/BlguunBN/ignis-space-fire.git
cd ignis-space-fire

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verification & Testing

```bash
# Run unit and integration tests (131+ passing tests)
npm test

# Type-check TypeScript code
npx tsc --noEmit
```

---

## Credits & Acknowledgements

- **Chart Components**: Data visualization and coverage plots adapted and inspired by [bklit](https://bklit.com/).
- **UI Components & Patterns**: Interface tokens, navigation, and layout inspired by [Lightswind](https://lightswind.com/), [KokonutUI](https://kokonutui.com/), and [21st.dev](https://21st.dev/).
- **NASA Open Science**: Deep gratitude to the investigators, scientists, and engineers at NASA Glenn Research Center (GRC), Johnson Space Center (JSC), and partner universities whose open PSI datasets enable flight safety research.

---

## License

This project is licensed under the [MIT License](LICENSE).
