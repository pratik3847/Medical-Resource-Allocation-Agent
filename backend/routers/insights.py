from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from ..models.schemas import InsightsQuery, StandardResponse
from ..services.who_service import WHOService
from ..services.worldbank_service import WorldBankService
import asyncio

router = APIRouter()


@router.post("/", response_model=StandardResponse)
async def insights(payload: InsightsQuery) -> JSONResponse:
    """Combine WHO and World Bank data for regional/global insights."""
    # For demonstration, fetch a WHO sample and a World Bank indicator concurrently
    tasks = [WHOService.fetch_indicator("Indicator"), WorldBankService.fetch_indicator("SP.POP.TOTL", country=(payload.region or "all"), per_page=10)]
    who_res, wb_res = await asyncio.gather(*tasks)

    data = {"who_sample": who_res, "worldbank_sample": wb_res}
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok", "message": "insights fetched", "data": data})
