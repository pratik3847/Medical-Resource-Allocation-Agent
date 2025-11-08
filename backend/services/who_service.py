"""Async wrapper for WHO GHO API."""
from typing import Any, Dict
import httpx
from ..config import get_settings


class WHOService:
    @staticmethod
    async def fetch_indicator(indicator: str) -> Dict[str, Any]:
        """Fetch a WHO GHO indicator by its short name or id.

        Example indicator: "Life expectancy at birth (years)"
        """
        settings = get_settings()
        base = getattr(settings, "WHO_GHO_BASE_URL", "https://ghoapi.azureedge.net/api")
        # ensure we don't double slash
        url = f"{base.rstrip('/')}/{indicator.lstrip('/')}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(url)
                r.raise_for_status()
                return r.json()
            except httpx.HTTPStatusError as exc:
                return {"error": f"WHO returned HTTP {exc.response.status_code}", "details": exc.response.text}
            except httpx.RequestError as exc:
                return {"error": "WHO request failed", "details": str(exc)}
