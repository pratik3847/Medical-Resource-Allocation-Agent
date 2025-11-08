from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/", tags=["health"])
async def health_check():
    """Simple server health check endpoint."""
    return JSONResponse(status_code=200, content={"status": "ok", "message": "server healthy", "data": {}})
