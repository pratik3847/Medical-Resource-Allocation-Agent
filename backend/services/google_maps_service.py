"""Async wrapper for Google Maps Geocoding API."""
from typing import Any, Dict, Optional
import httpx
import os
from ..config import get_settings


class GoogleMapsService:
    BASE = "https://maps.googleapis.com/maps/api/geocode/json"

    @staticmethod
    async def geocode(place: str) -> Dict[str, Any]:
        """Return geocoding results (lat/lng) for a place name."""
        settings = get_settings()
        api_key = settings.GOOGLE_MAPS_API_KEY
        params = {"address": place}
        if api_key:
            params["key"] = api_key

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                r = await client.get(GoogleMapsService.BASE, params=params)
                r.raise_for_status()
                return r.json()
            except httpx.HTTPStatusError as exc:
                return {"error": f"Google Maps returned HTTP {exc.response.status_code}", "details": exc.response.text}
            except httpx.RequestError as exc:
                return {"error": "Google Maps request failed", "details": str(exc)}
