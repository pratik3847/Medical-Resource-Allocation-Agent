from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from ..models.schemas import ResourceQuery, StandardResponse
from ..services.openfda_service import OpenFDAService

router = APIRouter()


@router.post("/search", response_model=StandardResponse)
async def search_resources(payload: ResourceQuery) -> JSONResponse:
    """Search OpenFDA for drug or supply availability.

    Returns a direct OpenFDA response (may include 'results').
    """
    res = await OpenFDAService.search_drug(payload.query, limit=payload.limit)
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok", "message": "resources fetched", "data": res})
