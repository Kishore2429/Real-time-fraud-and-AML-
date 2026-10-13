# SYNESIS 26 — Real-Time Fraud & AML Risk Orchestration

A CMD-runnable hackathon prototype built with FastAPI + SQLite. It uses **synthetic/demo data only** and provides:

- Transaction risk scoring with explainable signals (amount, velocity, unusual amount, new device/location, rapid movement).
- Explainable risk scoring using amount, new-device/location flags, recent transaction velocity, repeated receivers, and deviation from recent sender history.
- Rolling-window AML pattern flags (possible structuring/splitting and bidirectional transfers), with explanations and transaction references.
- Investigation-case status timeline backed by an append-only case-event table.
- Account relationship graph endpoint.
- Risk-based response recommendations and case management.
- Synthetic dataset seeding and a simple evaluation endpoint (precision/recall/false-positive rate on labelled demo data).

This is a prototype, not a production banking fraud system. It does not connect to payment rails or block real payments.

## Requirements

- Windows 10/11 and Python 3.10+ installed. Check with `py --version`.
- Internet connection once to install packages.

## Run from CMD (Windows)

1. Extract this ZIP.
2. Open the extracted folder.
3. In File Explorer's address bar, type `cmd` and press Enter.
4. Run:

```bat
setup.bat
```

This creates a virtual environment, installs dependencies, seeds synthetic transactions, and starts the API server.

After the first setup, start it again with:

```bat
run.bat
```

Open these URLs in your browser:

- API home: http://127.0.0.1:8000/
- Interactive API explorer: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health
- Dashboard summary JSON: http://127.0.0.1:8000/api/dashboard

Press Ctrl+C in the CMD window to stop the server.

## Important endpoints

- `GET /api/dashboard` — KPIs, risk distribution, recent alerts
- `GET /api/transactions` — list/filter transactions
- `POST /api/transactions/score` — score a transaction payload
- `POST /api/demo/seed` — insert demo dataset
- `GET /api/aml/patterns` — structuring and circular-transfer pattern flags
- `GET /api/accounts/relationships` — account graph nodes and edges
- `GET /api/cases` — list cases including related transaction/account context and status timeline
- `PATCH /api/cases/{case_id}` — update case status
- `GET /api/evaluation` — precision, recall, false-positive rate on labelled demo rows

The `/docs` page lets you test endpoints without writing frontend code.

## Connect a Lovable frontend

The API base URL during local development is `http://127.0.0.1:8000`. A hosted Lovable site cannot access your PC's localhost; deploy the API to a public HTTPS host for a hosted demo. For local browser development, add the frontend origin to `FRONTEND_ORIGINS` in `.env`.

## Tests\n\nFrom the `backend` folder, activate the virtual environment and run `python -m unittest discover -s tests -v`. These tests cover core scoring boundaries and AML pattern cases.\n\n## Prototype limitations

- Heuristic scoring, not trained machine learning.
- Synthetic data only; thresholds need calibration against representative data.
- The circular-transfer detector is a demo heuristic and does not prove money laundering.
- No authentication, role permissions, or production-grade audit controls.
- Do not upload real personal, account, card, or banking information.
