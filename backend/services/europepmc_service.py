"""Async wrapper for Europe PMC API."""
from typing import Any, Dict
import httpx
import asyncio
from ..config import get_settings


class EuropePMCService:
    @staticmethod
    async def search_papers(query: str, limit: int = 5) -> Dict[str, Any]:
        """Search EuropePMC for papers matching the query and return top results."""
        settings = get_settings()
        base = getattr(settings, "EUROPE_PMC_BASE_URL", "https://www.ebi.ac.uk/europepmc/webservices/rest/search")
        params = {"query": query, "format": "json", "pageSize": limit}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(base, params=params)
                r.raise_for_status()
                return r.json()
            except httpx.HTTPStatusError as exc:
                return {"error": f"EuropePMC returned HTTP {exc.response.status_code}", "details": exc.response.text}
            except (httpx.RequestError, asyncio.TimeoutError) as exc:
                return {"error": "EuropePMC request failed", "details": str(exc)}
