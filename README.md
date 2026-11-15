# IGNIS — Space Fire Intelligence Platform

> **NASA Space Apps Challenge · Flame in Freefall**  
> An evidence-grounded research intelligence and visual exploration platform for NASA microgravity combustion science.

---

## Overview

**IGNIS** is an interactive, evidence-first research workspace designed to help researchers, flight engineers, and safety specialists investigate spacecraft fire safety. It indexes primary flight and ground data from NASA microgravity investigations across orbital microgravity ($\mu\text{g}$), simulated Lunar ($0.16\text{g}$), and Martian ($0.38\text{g}$) regimes.

### Core Capabilities

- **Flight Investigation Explorer**: Search, filter, and inspect 50 primary NASA research records across materials (PMMA, SIBAL fabric, liquid droplets, Nomex), oxygen concentrations, airflow velocities, and pressures.
- **Microgravity Droplet Combustion Simulator**: Real-time 2D simulation of spherical diffusion flames, $d^2$-law burning rate ($K$), buoyant plume transitions across gravitational regimes ($\mu\text{g}$, Lunar, Martian, Earth), and interactive cursor-driven airflow nozzles.
- **Optical Diagnostics Studio**: Computer vision filters (Raw, Chemiluminescence, Sobel Edge Contours, 2-Color Pyrometry) and scanline intensity profile extraction from real flight telemetry frames.
- **Grounded Research Assistant**: NVIDIA Nemotron-powered research copilot that reasons strictly against verified flight citations, generates hypothesis trees, and reports when empirical evidence is missing.

---

## NASA Flight Data Sources

All experimental records in IGNIS are grounded in primary datasets published by the **NASA Physical Sciences Informatics (PSI)** repository and **NASA Technical Reports Server (NTRS)**:

- **FLEX / FLEX-2 (PSI-69, DOI: 10.60555/mbq8-0451)**: Droplet extinguishment, $d^2$-law burning rate constants, and visible flame extinction diameters aboard the ISS Combustion Integrated Rack (CIR).
- **BASS / BASS-II (PSI-25 & PSI-26, DOI: 10.60555/58h4-dy80)**: Opposed-flow flame spread, low-speed convective quenching, and blowoff limits over PMMA cylinders and SIBAL fabric in the Microgravity Science Glovebox.
- **Saffire Series (Saffire-I through Saffire-VI, ICES-2024-365)**: Large-scale flame spread, calorimetry, and smoke emissions inside uncrewed Cygnus cargo vehicles.
- **SoFIE (RTDFS, GEL, NCA, MIST, SMuRF)**: Solid fuel ignition and extinction limit test series investigating thick solid thermoplastics and residence-time-driven flame spread.

---

## AI Implementation & Safety Invariants

- **Grounded Answering**: The assistant operates under a strict rule: **answers only from indexed records and says when evidence is missing.**
- **No Invented Probabilities**: The system avoids predicting artificial numerical "fire probability" percentages. Extinction limits and spread regimes are categorized qualitatively based on empirical NASA limiting oxygen index (LOI) boundaries.
- **Structured Citations**: Every generated finding or hypothesis cites its primary Claim ID (`CLM-...`) and document page locator.

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
