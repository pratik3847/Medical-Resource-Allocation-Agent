from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from typing import Any
from ..models.schemas import AnalyzeRequest, StandardResponse
from ..agents.lang_agent import LangAgent

router = APIRouter()


@router.post("/", response_model=StandardResponse)
async def analyze_case(payload: AnalyzeRequest) -> JSONResponse:
    """Analyze symptoms and resources to produce probable diseases, resource needs, and nearest facilities.

    This endpoint composes data from WHO, World Bank, Google Maps, EuropePMC, and OpenFDA via the LangAgent.
    """
    agent = LangAgent()
    result = await agent.analyze_case(payload.symptoms, payload.location, payload.required_resources)
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok", "message": "analysis complete", "data": result})
