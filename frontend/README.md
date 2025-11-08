# Medical Resource Allocation — Frontend

React + TypeScript SPA for interacting with the FastAPI backend: agentic workflow, research, inventory snapshot, reallocation planner, and adaptive preferences.

## Prerequisites

- Node.js 18+ and npm
- Backend running at http://localhost:8000 (or configure `VITE_API_BASE_URL`)

## Setup

```powershell
cd frontend
npm install
npm run dev
```

Optional `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Scripts

- `npm run dev` — start dev server at http://localhost:8080
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run lint checks

## Notes

- Built with Vite, React, Tailwind, shadcn UI components, React Query, and Leaflet.
- Pages: Analyze, Research, Resources, Inventory, Planner, Preferences, Workflow, Dashboard.
- No third‑party branding or AI‑generated metadata included.
