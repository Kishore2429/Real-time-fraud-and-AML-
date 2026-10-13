# SYNESIS 26 — Improvement notes

This version keeps the existing React/Vite frontend and FastAPI/SQLite backend, while strengthening the demo's explainability and maintainability.

## Changes
- Risk scoring now considers amount bands, new device/location, recent sender transaction velocity, repeated transfers to the same receiver, and unusually large amounts compared with recent sender history.
- Risk scores are clamped to 0–100 and return an explainable reason list plus a recommended action.
- AML detection uses rolling one-hour windows for structuring-like activity and checks for observed transfers in both directions before flagging a possible circular transfer.
- Case status updates now record an append-only status timeline in a new `case_event` table. Existing transaction and case tables are not altered; SQLModel's `create_all` creates the new table when the app starts.
- Input validation rejects blank identifiers, non-positive/non-finite amounts, and excessively long device/location fields.
- Added unit tests for scoring boundaries and key AML pattern examples.

## Run tests
From `backend` after `setup.bat` has installed requirements:

```bat
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Demo talking points
1. The system gives a numeric risk score and human-readable reasons.
2. Velocity and repeated-beneficiary signals add behavioural context beyond amount-only rules.
3. AML findings are described as *possible* patterns, not proof of money laundering.
4. Case status history makes investigator actions more traceable.
5. Evaluation on synthetic labels is only a demo check; it is not evidence of real-world accuracy.

## Limitations
This remains a rule-based prototype on synthetic data. Thresholds require calibration, and production use would require access controls, audit hardening, monitored data pipelines, privacy/legal review, model validation, and operational false-positive handling. No blockchain dependency has been added because no official requirement was supplied.


## Frontend visual refresh (white + burgundy)
- Updated the frontend palette to a clean white/off-white canvas with burgundy primary accents and pale rose hover/selection states.
- Updated navigation, top bar, panels, borders, chart accents, and form surfaces to match the light theme.
- Preserved existing page routes and API wiring; this refresh is intended to be visual only.
