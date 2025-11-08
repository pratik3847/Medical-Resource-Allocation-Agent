from fastapi import APIRouter, HTTPException
from ..models.schemas import WorkflowRequest, WorkflowResponse
from ..agents.workflow_agent import WorkflowAgent

router = APIRouter()


@router.post("/run", response_model=WorkflowResponse)
async def run_workflow(req: WorkflowRequest):
    agent = WorkflowAgent()
    try:
        resp = await agent.run(req)
        return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
