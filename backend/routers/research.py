from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from ..models.schemas import ResearchQuery, StandardResponse
from ..services.europepmc_service import EuropePMCService

router = APIRouter()


@router.post("/papers", response_model=StandardResponse)
async def fetch_papers(payload: ResearchQuery) -> JSONResponse:
    """Fetch top related medical papers from EuropePMC."""
    res = await EuropePMCService.search_papers(payload.query, limit=payload.limit)
    # attempt to extract compact list
    papers = []
    if isinstance(res, dict) and res.get("resultList"):
        for item in res.get("resultList", {}).get("result", [])[: payload.limit]:
            papers.append({
                "title": item.get("title"),
                "id": item.get("id"),
                "journal": item.get("journalTitle"),
                "pubYear": item.get("pubYear"),
            })
    else:
        papers = res

    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok", "message": "papers fetched", "data": papers})
