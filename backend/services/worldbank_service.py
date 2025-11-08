"""Async wrapper for World Bank Indicators API."""
from typing import Any, Dict
import httpx
from ..config import get_settings


class WorldBankService:
    @staticmethod
    async def fetch_indicator(indicator: str, country: str = "all", per_page: int = 10) -> Dict[str, Any]:
        """Fetch World Bank indicator data.

        indicator: indicator code like 'SP.POP.TOTL'
        country: country code or 'all'
        """
        settings = get_settings()
        base = getattr(settings, "WORLD_BANK_BASE_URL", "https://api.worldbank.org/v2/")
        url = f"{base.rstrip('/')}/country/{country}/indicator/{indicator}"
        params = {"format": "json", "per_page": per_page}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(url, params=params)
                r.raise_for_status()
                return r.json()
            except httpx.HTTPStatusError as exc:
                return {"error": f"WorldBank returned HTTP {exc.response.status_code}", "details": exc.response.text}
            except httpx.RequestError as exc:
                return {"error": "WorldBank request failed", "details": str(exc)}
