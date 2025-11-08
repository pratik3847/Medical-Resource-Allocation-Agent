"""FastAPI application entrypoint for Medical Resource Allocation backend."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import router as api_router
from .config import get_settings

settings = get_settings()

app = FastAPI(title="Medical Resource Allocation Agent", version="0.1.0", description="Backend API for medical resource allocation and analysis")

# CORS (allow all origins for now; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(api_router, prefix="/api")


# Serve built frontend in production if available
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
try:
    from .config import Settings  # type: ignore
    settings_type = Settings  # quiet lints if unused
except Exception:
    pass

if os.path.isdir(dist_dir):
    # Mount SPA at root. /api continues to be handled by API router.
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {"status": "ok", "message": "Medical Resource Allocation Agent API", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=settings.DEBUG)
