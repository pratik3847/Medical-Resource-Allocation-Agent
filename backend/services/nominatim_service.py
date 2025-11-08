"""Async wrapper for OpenStreetMap Nominatim geocoding (no API key required for light use).

This service returns a Google-like result structure with a top-level 'results' list so existing
code (like the agent fallback) can consume it without large changes.
"""
from typing import Any, Dict
import httpx
from ..config import get_settings


class NominatimService:
    @staticmethod
    async def geocode(place: str, limit: int = 5) -> Dict[str, Any]:
        """Geocode a place string using Nominatim and return a normalized dict with 'results'.

        Important: Respect Nominatim usage policy for the public endpoint. Provide a descriptive
        User-Agent and avoid large/batched queries. For production, self-host or use a paid provider.
        """
        settings = get_settings()
        base = "https://nominatim.openstreetmap.org/search"
        params = {"q": place, "format": "json", "addressdetails": 1, "limit": limit}
        headers = {"User-Agent": f"{settings.APP_NAME}/0.1 (+https://example.com)"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(base, params=params, headers=headers)
                r.raise_for_status()
                hits = r.json()
                results = []
                for h in hits:
                    try:
                        lat = float(h.get("lat"))
                        lon = float(h.get("lon"))
                    except Exception:
                        lat = None
                        lon = None
                    results.append(
                        {
                            "formatted_address": h.get("display_name"),
                            "address": h.get("address", {}),
                            "geometry": {"location": {"lat": lat, "lng": lon}},
                            # include original hit for debugging
                            "raw": h,
                        }
                    )

                return {"results": results}
            except httpx.HTTPStatusError as exc:
                return {"error": f"Nominatim returned HTTP {exc.response.status_code}", "details": exc.response.text}
            except httpx.RequestError as exc:
                return {"error": "Nominatim request failed", "details": str(exc)}
