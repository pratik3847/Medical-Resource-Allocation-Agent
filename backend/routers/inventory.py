from typing import List
from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    InventorySnapshot,
    UpdateInventoryItem,
    ReallocationRequest,
    ReallocationResponse,
)
from ..services.inventory_service import get_snapshot, apply_updates, suggest_reallocation

router = APIRouter()


@router.get("/", response_model=InventorySnapshot)
async def read_inventory():
    try:
        records = get_snapshot()
        return InventorySnapshot(records=records)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update", response_model=InventorySnapshot)
async def update_inventory(updates: List[UpdateInventoryItem]):
    try:
        records = apply_updates(updates)
        return InventorySnapshot(records=records)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reallocate", response_model=ReallocationResponse)
async def reallocate(req: ReallocationRequest):
    try:
        plan, unmet, summary = suggest_reallocation(req)
        return ReallocationResponse(plan=plan, unmet=unmet, summary_by_hospital=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
