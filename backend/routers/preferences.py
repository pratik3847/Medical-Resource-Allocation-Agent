from fastapi import APIRouter, HTTPException
from ..models.schemas import Preferences, PreferenceUpdate, PlanFeedback
from ..services.preferences_service import get_preferences, update_preferences, record_feedback

router = APIRouter()


@router.get("/", response_model=Preferences)
async def read_preferences():
    try:
        return get_preferences()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update", response_model=Preferences)
async def set_preferences(upd: PreferenceUpdate):
    try:
        return update_preferences(upd)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def submit_feedback(feedback: PlanFeedback):
    try:
        return record_feedback(feedback)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
