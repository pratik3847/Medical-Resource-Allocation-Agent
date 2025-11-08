"""Async wrapper for OpenFDA drug APIs."""

from typing import Any, Dict
import httpx
import asyncio
from ..config import get_settings


class OpenFDAService:
    # will be resolved from settings (allows overriding via .env)
    @staticmethod
    async def search_drug(query: str, limit: int = 10) -> Dict[str, Any]:
        """Search OpenFDA drug labels for a given query.

        Returns the raw JSON response (may include results list)
        """
        settings = get_settings()
        base = getattr(settings, "OPENFDA_BASE_URL", "https://api.fda.gov/drug/label.json")
        params = {"search": query, "limit": limit}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(base, params=params)
                r.raise_for_status()
                return r.json()
            except httpx.HTTPStatusError as exc:
                return {"error": f"OpenFDA returned HTTP {exc.response.status_code}", "details": exc.response.text}
            except (httpx.RequestError, asyncio.TimeoutError) as exc:
                return {"error": "OpenFDA request failed", "details": str(exc)}
