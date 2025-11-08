from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class AnalyzeRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of patient symptoms")
    location: Optional[str] = Field(None, description="City or location string")
    required_resources: Optional[List[str]] = Field(None, description="List of required resources (e.g., oxygen, ventilators, drug names)")


class ProbableDisease(BaseModel):
    name: str
    confidence: Optional[float] = None
    notes: Optional[str] = None


class Facility(BaseModel):
    name: str
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    distance_km: Optional[float]


class AnalyzeResponse(BaseModel):
    probable_diseases: List[ProbableDisease]
    resource_needs: List[str]
    nearest_facilities: List[Facility]


class ResourceQuery(BaseModel):
    query: str = Field(..., description="Drug or supply name to search in OpenFDA")
    limit: int = Field(10, description="Max records to return")


class ResearchQuery(BaseModel):
    query: str = Field(..., description="Search query for EuropePMC")
    limit: int = Field(5, description="Number of top papers to fetch")


class LocationQuery(BaseModel):
    place: str = Field(..., description="City or hospital name to geocode")


class InsightsQuery(BaseModel):
    region: Optional[str] = Field(None, description="Optional region code or name to scope insights")


class StandardResponse(BaseModel):
    status: str
    message: str
    data: Optional[Any]


# Inventory models
class InventoryRecord(BaseModel):
    hospital_id: str
    hospital_name: str
    address: str
    lat: float
    lon: float
    resource_name: str
    quantity: int
    reserve_min: int
    unit: str = "count"


class UpdateInventoryItem(BaseModel):
    hospital_id: str
    resource_name: str
    quantity: int = Field(..., description="Quantity to set/delta depending on mode")
    mode: str = Field("set", description="'set' to set absolute quantity, 'delta' to add/subtract")


class InventorySnapshot(BaseModel):
    records: List[InventoryRecord]


class ReallocationDemand(BaseModel):
    hospital_id: str
    resource_name: str
    required_quantity: int


class TransferPlanItem(BaseModel):
    resource_name: str
    from_hospital_id: str
    to_hospital_id: str
    quantity: int
    distance_km: float


class ReallocationRequest(BaseModel):
    demands: List[ReallocationDemand]


class ReallocationResponse(BaseModel):
    plan: List[TransferPlanItem]
    unmet: List[ReallocationDemand]
    summary_by_hospital: Dict[str, Dict[str, Dict[str, Any]]]


# Agentic workflow models
class WorkflowRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    required_resources: Optional[List[str]] = None
    objective: Optional[str] = Field(
        None,
        description="High-level goal, e.g., 'stabilize ICU oxygen availability within 24h'",
    )


class WorkflowTraceStep(BaseModel):
    name: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    success: bool = True
    duration_ms: Optional[float] = None
    notes: Optional[str] = None


class WorkflowResponse(BaseModel):
    status: str
    summary: str
    analyze: Optional[AnalyzeResponse] = None
    research: Optional[Dict[str, Any]] = None
    insights: Optional[Dict[str, Any]] = None
    inventory_snapshot: Optional[InventorySnapshot] = None
    reallocation: Optional[ReallocationResponse] = None
    trace: List[WorkflowTraceStep] = []


# Preferences and feedback models (for adaptive behavior)
class Preferences(BaseModel):
    distance_weight: float = 0.7
    coverage_weight: float = 0.3
    fairness_weight: float = 0.0


class PreferenceUpdate(BaseModel):
    distance_weight: Optional[float] = None
    coverage_weight: Optional[float] = None
    fairness_weight: Optional[float] = None


class PlanFeedback(BaseModel):
    accepted: bool
    reason: Optional[str] = None
    plan_size: Optional[int] = None
