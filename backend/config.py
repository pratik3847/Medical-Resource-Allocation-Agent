from dotenv import load_dotenv
import os
from functools import lru_cache
from typing import Optional

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GOOGLE_MAPS_API_KEY: Optional[str] = os.getenv("GOOGLE_MAPS_API_KEY")
    OPENFDA_API_KEY: Optional[str] = os.getenv("OPENFDA_API_KEY")
    # Base URL overrides (optional)
    EUROPE_PMC_BASE_URL: str = os.getenv("EUROPE_PMC_BASE_URL", "https://www.ebi.ac.uk/europepmc/webservices/rest/")
    WHO_GHO_BASE_URL: str = os.getenv("WHO_GHO_BASE_URL", "https://ghoapi.azureedge.net/api/")
    WORLD_BANK_BASE_URL: str = os.getenv("WORLD_BANK_BASE_URL", "https://api.worldbank.org/v2/")
    OPENFDA_BASE_URL: str = os.getenv("OPENFDA_BASE_URL", "https://api.fda.gov/drug/label.json")
    # Inventory data path (CSV)
    # Prefer project-root dataset.csv by default so non-backend users can edit it easily
    INVENTORY_CSV_PATH: str = os.getenv("INVENTORY_CSV_PATH", "dataset.csv")
    # Frontend build directory (for serving SPA in production)
    FRONTEND_DIST_DIR: str = os.getenv("FRONTEND_DIST_DIR", os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

    APP_NAME: str = os.getenv("APP_NAME", "Medical Resource Allocation AI Agent")
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    DEBUG: bool = bool(int(os.getenv("DEBUG", "0")))


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
