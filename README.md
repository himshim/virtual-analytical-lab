# Virtual Analytical Laboratory (VAL)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Production: Live](https://img.shields.io/badge/Production-Live-success)](https://virtual-analytical-lab.vercel.app/)
[![Maintained by @himshim26](https://img.shields.io/badge/Maintained%20by-@himshim26-38bdf8)](https://himshim.github.io/)

A modern, browser-native, scientifically grounded analytical instrument simulation platform designed specifically for pharmacy, chemistry, and life sciences students and educators. 

Built with **pure Vanilla JavaScript ES modules**, HTML5 Canvas, SVG ray-tracing, and zero framework bloat. 100% client-side execution with offline resilience and zero backend server load.

🌐 **Live Production:** [virtual-analytical-lab.vercel.app](https://virtual-analytical-lab.vercel.app/)  
👨‍💻 **Maintainer:** [Himanshu Sharma (@himshim26)](https://himshim.github.io/)

---

## 🔬 Four Complete Instrument Workstations

| Workstation | Method & Physics Models | Compendial Reference | Live Route |
| :--- | :--- | :--- | :--- |
| **🧪 HPLC** | Reversed-Phase C18 partitioning, Darcy-Poiseuille backpressure, Van Deemter plate height kinetics, LSS gradient elution | **USP &lt;621&gt;** System Suitability ($N$, $R_s$, $T$) | `/instruments/hplc/` |
| **🔬 UV-Vis** | Dual-beam Czerny-Turner monochromator, Beer-Lambert linear regression ($R^2 \ge 0.999$), Henderson-Hasselbalch ionization shifts, derivative spectroscopy ($dA/d\lambda$) | **USP &lt;857&gt;** Photometric Linearity & Stray Light | `/instruments/uvvis/` |
| **🔴 FTIR** | Michelson interferometer moving mirror optical path difference $I(\delta)$, Cooley-Tukey Fast Fourier Transform (FFT) $\to \%T(\nu)$, ATR diamond crystal penetration depth $d_p(\lambda)$ | **ASTM E1421** Polystyrene Calibration | `/instruments/ftir/` |
| **🟢 GC-FID** | Capillary column chromatography, Golay efficiency equation, carrier gas kinetics ($N_2$, $He$, $H_2$), thermal ramp programming, Flame Ionization Detection, Kovats retention index ($I$) | **USP &lt;467&gt;** Residual Solvents | `/instruments/gc/` |

---

## 🎯 Platform Highlights & Pedagogical Features

1. **Pedagogical Predict-Observe-Explain (POE) Framework**:
   $$\text{Predict} \longrightarrow \text{Run} \longrightarrow \text{Observe} \longrightarrow \text{Compare} \longrightarrow \text{Understand Why} \longrightarrow \text{Try Again}$$
2. **20-Foot Classroom Projection Mode**: High-contrast, large-typography mode optimized for lecture hall visibility.
3. **Interactive Resource Guides**: Comprehensive SOPs, troubleshooting matrices, and LMS iframe embed snippets built right into the platform modal.
4. **Living Signal Demonstration Canvas**: Real-time multi-beam dispersion rendering at 60 FPS, throttled intelligently via `IntersectionObserver` when offscreen to preserve battery and main-thread responsiveness.
5. **Modern Web Platform Standards**:
   - Native `<dialog>` with focus trapping, focus restoration, and `overscroll-behavior: contain`.
   - Accessible Canvas DOM (`role="img"`, ARIA labels, and `prefers-reduced-motion` static frame fallback).
   - High color contrast (WCAG 2.2 AA compliant) and `text-wrap: pretty` typographic balancing.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+) or Python 3

### Step 1: Start Server
```bash
# Using Node.js
node server.mjs

# OR using npx
npx serve ./ -p 8080

# OR using Python
python -m http.server 8080
```

### Step 2: Open in Browser
- **Home Landing Page:** `http://localhost:8080/index.html`
- **HPLC Workstation:** `http://localhost:8080/instruments/hplc/index.html`
- **UV-Vis Workstation:** `http://localhost:8080/instruments/uvvis/index.html`
- **FTIR Workstation:** `http://localhost:8080/instruments/ftir/index.html`
- **GC-FID Workstation:** `http://localhost:8080/instruments/gc/index.html`

---

## 🧪 Testing & Verification

```bash
# Verify live production and workstation loading
node scratch/live_check.mjs

# HPLC CI Architecture Check
node instruments/hplc/validation/ciArchitectureCheck.js

# Educational Outcome Playwright Suite
node scratch/verify_educational_outcomes.js
```

---

## 📁 Repository Structure

```text
├── index.html                   # Platform Landing Page (Bento Showcase & Guides Modal)
├── server.mjs                   # Local development server with CORS & MIME mappings
├── vercel.json                  # Production Edge routing and header configurations
├── manifest.webmanifest         # PWA Manifest specification
├── sw.js                        # Progressive Web App offline Service Worker
├── css/
│   └── global.css               # Design tokens, double-bezel cards, and shared UI styles
├── ui/
│   └── components/
│       └── LabHeader.js         # Shared custom element <lab-header> across all simulators
├── instruments/
│   ├── hplc/                    # High-Performance Liquid Chromatography simulator
│   ├── uvvis/                   # UV-Vis Double-Beam Spectrophotometer simulator
│   ├── ftir/                    # FTIR Michelson Interferometer simulator
│   └── gc/                      # Gas Chromatograph Flame Ionization simulator
└── docs/                        # Educator, Student, Deployment, and Validation guides
```

---

## 📜 License & Citation

Distributed under the **MIT License**. Created and maintained by [Himanshu Sharma](https://himshim.github.io/).
