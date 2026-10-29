# Virtual Analytical Laboratory — Documentation Index

Welcome to the canonical documentation hierarchy for the **Virtual Analytical Laboratory (VAL)** multi-instrument platform.

---

## 📚 Guides & Manuals

| Guide | Target Audience | Key Contents | Link |
| :--- | :--- | :--- | :--- |
| **Student Manual** | Undergraduate & PG students | 5-step SOP, key physical formulas, unknown analyte troubleshooting | [`docs/STUDENT_GUIDE.md`](STUDENT_GUIDE.md) |
| **Instructor Guide** | Faculty & Lab Directors | ABET/PCI curriculum mapping, POE workflows, 5 ready lab assignments | [`docs/INSTRUCTOR_GUIDE.md`](INSTRUCTOR_GUIDE.md) |
| **Deployment Guide** | IT Admins & Technologists | Offline LAN setup, PWA installation, Canvas/Moodle LMS iframe embeds | [`docs/CLASSROOM_DEPLOYMENT_GUIDE.md`](CLASSROOM_DEPLOYMENT_GUIDE.md) |

---

## 🏛️ Architecture & Scientific Validation

```text
/docs
│
├── README.md                          (Documentation Index & Portal)
├── STUDENT_GUIDE.md                   (Compendial SOP & Practical Lab Manual)
├── INSTRUCTOR_GUIDE.md                (Faculty Pedagogy & Curriculum Alignment)
├── CLASSROOM_DEPLOYMENT_GUIDE.md      (LMS Iframe Embeds & LAN Server Setup)
│
├── architecture/
│   └── ARCHITECTURE_CONSTITUTION.md   (Decoupled MVC, UiCoordinator & Data Pipelines)
│
├── validation/
│   ├── README.md                      (Validation Artifacts Overview)
│   └── SCIENTIFIC_VALIDATION.md       (VDS-1.4 Dataset, Error Metrics & Verification Gates)
│
└── ui/
    └── LABORATORY_EXPERIENCE.md       (CDS Workstation UX, Telemetry Strip & Touch Controls)
```

---

## 🔬 Platform Status Overview

```text
Instruments Available:      4 (HPLC, UV-Vis, FTIR, GC-FID)
Runtime Execution:          100% Client-Side Pure Vanilla JS (ES Modules)
Offline Resilience:         PWA Service Worker + Standalone Cache
Compendial Standards:       USP <621>, USP <857>, USP <467>, ASTM E1421
Accessibility Standard:     WCAG 2.2 AA Compliant
License:                    MIT
Maintainer:                 Himanshu Sharma (@himshim26)
```
