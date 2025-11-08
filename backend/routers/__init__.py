from fastapi import APIRouter

router = APIRouter()

from . import analyze, resources, research, location, insights, health, inventory, workflow, preferences  # noqa: F401

# include sub-routers
router.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
router.include_router(resources.router, prefix="/resources", tags=["resources"])
router.include_router(research.router, prefix="/research", tags=["research"])
router.include_router(location.router, prefix="/location", tags=["location"])
router.include_router(insights.router, prefix="/insights", tags=["insights"])
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
router.include_router(preferences.router, prefix="/preferences", tags=["preferences"])
