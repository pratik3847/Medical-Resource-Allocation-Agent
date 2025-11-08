from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from ..models.schemas import LocationQuery, StandardResponse
from ..services.nominatim_service import NominatimService

router = APIRouter()


@router.post("/geocode", response_model=StandardResponse)
async def geocode(payload: LocationQuery) -> JSONResponse:
    """Convert a city or hospital name into coordinates via Google Maps Geocoding API."""
    res = await NominatimService.geocode(payload.place)
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok", "message": "geocode result", "data": res})
