# SYNESIS 26 — Fraud & AML Risk Orchestration Frontend

A premium financial crime operations dashboard built with React + TypeScript + Vite + Tailwind CSS v4.

---

## Quick Start

### Prerequisites

| Software | Minimum Version |
|---|---|
| Node.js | v18+ (tested on v26.11.1) |
| npm | v9+ (tested on v11.20.0) |
| Python | 3.9+ (for backend) |
| FastAPI backend | Running at http://127.0.0.1:8000 |

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different host/port:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Start the Backend (separate terminal)

```bash
# From your backend directory:
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Start the Frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Pages

| Route | Page | Backend Endpoint |
|---|---|---|
| `/` | Overview Dashboard | `GET /api/dashboard` |
| `/transactions` | Transactions | `GET /api/transactions` |
| `/fraud-alerts` | Fraud Alerts | `GET /api/dashboard` + `/api/transactions` |
| `/aml` | AML Monitoring | `GET /api/aml/patterns` |
| `/network` | Account Network | `GET /api/accounts/relationships` |
| `/cases` | Investigation Cases | `GET /api/cases` |

---

## Backend API Endpoints Used

```
GET /api/health                  — Connection health check
GET /api/dashboard               — KPIs, risk counts, recent alerts
GET /api/transactions            — Transaction list
GET /api/aml/patterns            — AML pattern detections
GET /api/accounts/relationships  — Account relationship graph
GET /api/cases                   — Investigation cases
GET /api/evaluation              — Model evaluation metrics
```

API docs available at: `http://127.0.0.1:8000/docs`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend base URL |

> **Note:** Do not expose secrets or credentials in the `.env` file.

---

## CORS Configuration

If the frontend and backend run on different origins, add CORS middleware to your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, replace the origin with your actual frontend URL.

---

## Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type check only
npx tsc --noEmit

# Lint
npm run lint
```

---

## Technology Stack

- **React 19** — UI framework  
- **TypeScript 6** — Type safety  
- **Vite 8** — Build tool and dev server  
- **Tailwind CSS v4** — Utility-first CSS  
- **Recharts** — Charts (donut, area)  
- **Lucide React** — Icon set  
- **React Router v7** — Client-side routing  
- **Axios** — HTTP client  

---

## Known Limitations & Notes

1. **Account Network Graph:** The graph page uses a custom SVG force-directed layout. If `/api/accounts/relationships` does not return `nodes` and `edges` arrays, a descriptive empty state is shown instead.

2. **Fraud Alerts:** If `/api/dashboard` does not return a `recent_alerts` array, the page falls back to extracting high/medium risk transactions from `/api/transactions`.

3. **Backend URL:** `127.0.0.1:8000` only works when both frontend and backend run on the same machine. For deployment, update `VITE_API_BASE_URL` to your hosted backend URL.

4. **No mock data substitution:** The app does not silently replace API failures with mock data. All displayed data comes from the backend or shows a clear error state.

5. **AML disclaimer:** AML pattern cards include a legal disclaimer clarifying these are indicators for investigation, not proof of money laundering.

6. **Zero open cases:** The backend currently reports 0 open investigation cases. The UI accurately shows this with an informative empty state.

---

## Packaging for Transfer

To create a ZIP of the frontend source (excluding node_modules):

**Windows PowerShell:**
```powershell
Compress-Archive -Path ".\*" -DestinationPath "..\SYNESIS26_Frontend.zip" -Force
# Then exclude node_modules by manually removing or use 7-zip
```

**Or with 7-zip (recommended):**
```bash
7z a -xr!node_modules -xr!dist -xr!.env SYNESIS26_Frontend.zip .
```

**On Linux/Mac:**
```bash
zip -r SYNESIS26_Frontend.zip . -x "node_modules/*" -x "dist/*" -x ".env"
```

---

## Deployment Notes

For a production deployment:
1. Run `npm run build` — outputs to `dist/`
2. Serve the `dist/` folder with Nginx, Apache, or Firebase Hosting
3. Update `VITE_API_BASE_URL` to your hosted backend URL before building
4. Configure CORS on the backend for your production frontend URL

---

## License

Internal use — SYNESIS 26 Hackathon Project
