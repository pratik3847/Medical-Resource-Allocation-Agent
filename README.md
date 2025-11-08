# Medical Resource Allocation Agent

Plan, balance, and reallocate critical medical resources with a clear, auditable workflow. This project pairs a modern FastAPI backend with a clean React (Vite + TypeScript) frontend.

- `backend/` — FastAPI service for analysis, research, inventory, planning, preferences, and workflow
- `frontend/` — Vite + React TypeScript SPA

---

## Table of contents

- Overview
- Architecture
- Data sources and APIs used
- Inventory data model (CSV)
- Reallocation planner (how it decides)
- Agentic workflow (steps)
- REST API overview
- Run locally (Windows PowerShell)
- Production (serve SPA from backend)
- Configuration and environment
- Frontend notes
- Repository structure
- Limitations and future work

---

## Overview

What you get out-of-the-box:

- Async FastAPI API with modular routers, services, and agents
- CSV-backed inventory with a simple, transparent reallocation planner
- Agentic workflow that analyzes context and proposes moves with a trace
- Adaptive preferences that weight distance, coverage, and fairness — adjustable via feedback
- Single-process production mode where the backend serves the built SPA

---

## Architecture

High-level flow

```
┌────────────┐     HTTP (JSON)      ┌────────────┐
│  Frontend  │  <-----------------> │   Backend  │  ──► External Data APIs
│  (Vite+TS) │        /api          │  (FastAPI) │      (OpenFDA, EuropePMC,
└────────────┘                      └────────────┘      WHO GHO, World Bank,
				▲                                 │             Nominatim Geocoding)
				│                                 │
				│                                 ▼
				│                        CSV Inventory (dataset.csv)
				│                         + Preferences (JSON)
				│                                 │
				▼                                 ▼
			UI Pages                      Planner & Workflow
	(Analyze, Inventory,             (suggest transfers,
	 Planner, Preferences,            adapt weights)
	 Research, Workflow)
```

Backend modules (conceptual):

- Routers: group endpoints by domain (analyze, research, resources, location, insights, health, inventory, preferences, workflow)
- Services: async wrappers for external APIs, inventory IO, and planning
- Agents: orchestrate multi-step flows, combine results, and produce a trace
- Models/Schemas: Pydantic models for request/response validation
- Utils: small helpers (e.g., geodesic distance)

---

## Data sources and APIs used

These services enrich the workflow with research, epidemiological context, and geocoding:

- OpenFDA — Drug/device event and label data (context for shortages and safety)
- Europe PMC — Biomedical literature search (papers and abstracts)
- WHO Global Health Observatory (GHO) — Health indicators and statistics
- World Bank — Country- and region-level development indicators
- OpenStreetMap Nominatim — Free geocoding for addresses and places

Note: The LLM agent can optionally use OpenAI via LangChain if an API key is provided, otherwise it falls back to a deterministic summarizer.

---

## Inventory data model (CSV)

The backend loads inventory from `dataset.csv` by default (configurable). Headers:

```
hospital_id,hospital_name,address,lat,lon,resource_name,quantity,reserve_min,unit
```

- hospital_id, hospital_name, address — facility identity
- lat, lon — facility coordinates (used for distance in planning)
- resource_name — e.g., oxygen_cylinders, ventilator, insulin_vials, PPE_kits
- quantity — current stock on hand
- reserve_min — minimum reserve to keep before donating
- unit — display unit (tanks, machines, vials, kits, …)

---

## Reallocation planner (how it decides)

Objective

- Suggest transfers from donor facilities (above reserve) to receivers (below reserve) to reduce shortages.

Inputs/outputs

- Input: inventory snapshot + preference weights
- Output: list of suggested transfers, plus a summary (moved totals, facilities impacted)

Scoring (intuitive description)

- Distance — prefer closer donors (less travel time/cost)
- Coverage — prefer donations that meaningfully cover the receiver’s gap
- Fairness — avoid draining any one donor too much relative to its reserve

Edge cases handled

- No donor above reserve → no moves proposed
- Exact reserve matches or zero-quantity resources → ignored
- Addresses with commas are parsed safely from CSV

---

## Agentic workflow (steps)

The workflow endpoint composes a trace across these steps:

1) Analyze the request and context hints
2) Fetch research/insights and optional geocodes in parallel
3) Snapshot inventory and detect shortages
4) Run the reallocation planner with current preference weights
5) Return a consolidated plan plus an execution trace

Preferences can be updated directly or nudged via feedback; weights are re-normalized.

---

## REST API overview

Base URL: `http://localhost:8000/api`

- Health
	- GET `/health/` — simple liveness check

- Analyze & Insights
	- POST `/analyze/` — analyze a prompt/context
	- POST `/insights/` — derive high-level insights

- Research & Resources
	- POST `/resources/search` — search external resource datasets (e.g., OpenFDA)
	- POST `/research/papers` — search biomedical literature (Europe PMC)

- Location
	- POST `/location/geocode` — geocode a place or address (Nominatim)

- Inventory
	- GET `/inventory/` — get current snapshot
	- POST `/inventory/update` — update stock values
	- POST `/inventory/reallocate` — suggest transfers

- Preferences
	- GET `/preferences/` — read current weights
	- POST `/preferences/update` — set new weights
	- POST `/preferences/feedback` — nudge weights based on outcome

- Workflow
	- POST `/workflow/run` — run the multi-step orchestration and return a plan + trace

See interactive API docs at `http://localhost:8000/docs` for request/response schemas.

---

## Run locally (Windows PowerShell)

Backend

```powershell
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend uses `http://localhost:8000/api` by default. To change it, create `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Tip: Use the VS Code task “Dev: Full Stack” to start both concurrently (see `.vscode/tasks.json`).

---

## Production (serve SPA from backend)

```powershell
cd frontend
npm install
npm run build

# then start the backend
cd ../backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

If `frontend/dist` exists, the backend serves the SPA at `/` and keeps the API at `/api`.

---

## Configuration and environment

- `INVENTORY_CSV_PATH` — path to the CSV (default: `dataset.csv` in repo root)
- Optional: `OPENAI_API_KEY` — enables the LangChain/OpenAI path in the analysis agent
- `FRONTEND_DIST_DIR` — override the SPA path the backend serves in production
- CORS is permissive for development; restrict `allow_origins` in `backend/main.py` for production

Secrets and API keys belong in `backend/.env` (do not commit them).

---

## Frontend notes

- Built with Vite, React, Tailwind, shadcn UI, React Query, Leaflet
- Pages include: Analyze, Research, Resources, Inventory, Planner, Preferences, Workflow, Dashboard
- The SPA calls the backend under `/api`

---

## Repository structure

```
Medical-Resource-Allocation-Agent/
├─ backend/        # FastAPI app (routers, services, agents, models, utils)
├─ frontend/       # Vite + React TypeScript SPA
├─ dataset.csv     # Sample inventory data
└─ README.md       # Project documentation (this file)
```

---

## Limitations and future work

- The planner is intentionally simple for clarity; more advanced optimization is possible
- Forecasting and richer explanations per transfer can be added
- Be mindful of rate limits and acceptable use for public APIs (especially Nominatim)

---

Crafted to be clear, auditable, and demo-friendly — while keeping the door open for deeper optimization.