# SYNESIS 26 — Real-Time Fraud & AML Risk Orchestration Platform

> **Synesis 26 Hackathon project by Team Noob.exe**  
> An enterprise-grade, real-time risk orchestration system delivering explainable fraud scoring, rolling-window anti-money laundering (AML) pattern detection, interactive account relationship graphs, and end-to-end case management.

---

## 🏛️ Architecture Overview

```
Real-Time-Fraud-and-AML-Orchestration/
├── backend/                  # FastAPI + SQLite + SQLAlchemy Backend Service
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, CORS & route registration
│   │   ├── database.py       # SQLAlchemy engine & session management
│   │   ├── models.py         # DB schemas (Transactions, Accounts, Alerts, Cases, AML)
│   │   ├── schemas.py        # Pydantic v2 validation models
│   │   ├── risk.py           # Explainable rule engine & rolling-window AML detectors
│   │   ├── seed.py           # Synthetic dataset generator for demo & evaluation
│   │   └── routers/          # Modular API endpoints
│   ├── tests/                # Unittest suite for risk scoring & AML heuristics
│   ├── requirements.txt      # Python dependencies
│   ├── setup.bat / run.bat   # Automated Windows runners
│   └── .env.example          # Environment variable template
│
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx           # Main application routing & shell
│   │   ├── index.css         # Brand design tokens (Executive White & Burgundy palette)
│   │   ├── components/       # Reusable UI (Sidebar, TopBar, StatCard, RiskBadge, Drawers)
│   │   ├── pages/            # Feature pages (Overview, Transactions, Alerts, AML, Network, Cases)
│   │   ├── services/api.ts   # Axios API client connecting to FastAPI
│   │   └── types/api.ts      # TypeScript interfaces matching backend models
│   ├── package.json          # Node dependencies
│   └── .env.example          # Frontend environment template
│
├── IMPROVEMENTS.md           # Engineering notes & explainability rationale
└── START_HERE.txt            # Quickstart guide
```

---

## 🎨 Frontend Theme: Executive White & Burgundy

The platform features an executive **White & Burgundy** aesthetic:
- **Primary Color:** Deep Burgundy (`#72001c`, `#800020`, `#570014`)
- **Backgrounds:** Crisp White (`#ffffff`) and soft porcelain tones (`#faf7f8`)
- **Cards & Surfaces:** `.glass-card` styling with refined burgundy borders (`rgba(114, 0, 28, 0.1)`) and soft elevation
- **Typography:** High-contrast charcoal text (`#20080e`) with muted burgundy-charcoal secondary labels (`#6e444f`)
- **Visual Analytics:** Burgundy Recharts area fills, customized SVG force-directed account network graph, and clear risk indicators

---

## 🛡️ Core Capabilities

### 1. Real-Time Explainable Fraud Scoring
- Evaluates incoming transactions against explainable risk heuristics:
  - Velocity thresholds (rapid bursts of transactions)
  - Abnormally high transaction values
  - High-risk geographic locations & untrusted devices
  - Mismatched IP / device identifiers
- Every alert includes transparent **Risk Indicators** detailing exactly why it was flagged.

### 2. Rolling-Window AML Pattern Detection
- **Structuring (Smurfing):** Detects multiple transactions kept just below standard reporting thresholds (e.g. ₹49,000–₹50,000).
- **Circular Transactions:** Detects funds moving in loops between related accounts to obfuscate source.
- **Layering & Rapid Movement:** Identifies immediate pass-through transfers intended to break audit trails.

### 3. Interactive Account Network Graph
- Built-in force-directed SVG network simulation showing entity relationships, high-risk clusters, and flagged account connections without external charting bloat.
- Zoom & pan controls with instant side-panel entity inspection.

### 4. Investigation Case Management
- Full lifecycle tracking from alert triage to case creation, investigation notes, and status resolution (`open` → `in_progress` → `resolved`).
- Chronological timeline events and audit trail preservation.

---

## 🚀 Getting Started

### Prerequisites
- **Python:** 3.10+ (tested on Python 3.11, 3.12, 3.15)
- **Node.js:** 18+ (tested on Node.js 20+)

---

### Backend Setup (FastAPI)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux / macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *Alternatively on Windows, double-click `run.bat` or `setup.bat`.*

- **Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`
- **Dashboard API:** `http://127.0.0.1:8000/api/dashboard`

---

### Frontend Setup (React + Vite)

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173` (or the URL output by Vite).

---

## 🔒 Security & Sensitive Data Policy

- **No Secrets Committed:** All production secrets, private keys, API keys, credentials, and local environment files (`.env`, `.env.local`) are strictly excluded via `.gitignore`.
- **Synthetic Data Only:** All account numbers, transaction references, customer names, and balances in the demonstration dataset are algorithmically generated synthetic data.
- **Explainable by Design:** Risk signals and AML alerts are probabilistic indicators for human compliance review, not autonomous punitive actions.

---

## 👥 Authors & License

Developed for the **Synesis 26 Hackathon** by **Team Noob.exe**.  
MIT License.
