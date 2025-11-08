# Medical Resource Allocation Agent — Backend

FastAPI service that powers analysis, research, inventory, planning, and the agentic workflow.

## Highlights

- Async FastAPI endpoints with modular routers, services, and agents
- Optional LangChain agent (uses OpenAI if configured via env)
- Async wrappers for external data: OpenFDA, EuropePMC, WHO GHO, World Bank, and Nominatim geocoding
- CSV-backed inventory with a simple reallocation planner and adaptive preferences

## Quick start

1) Environment and dependencies

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2) Run the API

```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open API docs at: http://localhost:8000/docs

## Configuration

- Place secrets and keys in `.env` (see `.env.example` if present).
- Inventory CSV: `INVENTORY_CSV_PATH` (defaults to repo `dataset.csv`).
- CORS is permissive in development; restrict `allow_origins` for production.

## Frontend integration

- Development: run backend and frontend separately.
  - Backend: see quick start above (port 8000)
  - Frontend: from `frontend/` run `npm run dev` (default port 8080). The frontend calls `http://localhost:8000/api` by default; override with `VITE_API_BASE_URL` in `frontend/.env.local`.

- Production (single process):
  1. Build the frontend:

     ```powershell
     cd ../frontend
     npm install
     npm run build
     ```

  2. Start the backend. If `frontend/dist` exists, it serves the SPA at `/` and the API at `/api`.

## Notes

- Keep the inventory CSV simple and consistent; the planner operates on current stock vs. reserve.
- Geocoding uses Nominatim (no paid keys required). Be mindful of usage policies.
