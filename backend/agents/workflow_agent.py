import time
import asyncio
from typing import Any, Dict
from ..models.schemas import (
    WorkflowRequest,
    WorkflowResponse,
    WorkflowTraceStep,
    AnalyzeRequest,
    InventorySnapshot,
    ReallocationRequest,
    ReallocationResponse,
)
from .lang_agent import LangAgent
from ..services.europepmc_service import EuropePMCService
from ..services.who_service import WHOService
from ..services.worldbank_service import WorldBankService
from ..services.nominatim_service import NominatimService
from ..services import inventory_service


class WorkflowAgent:
    def __init__(self) -> None:
        self.lang_agent = LangAgent()
        self.pm_service = EuropePMCService()
        self.who_service = WHOService()
        self.wb_service = WorldBankService()
        self.geo_service = NominatimService()

    async def run(self, req: WorkflowRequest) -> WorkflowResponse:
        trace = []
        analyze_resp = None
        research_resp: Dict[str, Any] | None = None
        insights_resp: Dict[str, Any] | None = None
        inventory_snap: InventorySnapshot | None = None
        realloc_resp: ReallocationResponse | None = None

        # Step 1: Analyze case
        t0 = time.perf_counter()
        try:
            analyze_input = AnalyzeRequest(symptoms=req.symptoms or [], location=req.location, required_resources=req.required_resources)
            analyze_resp = await self.lang_agent.analyze_case(analyze_input)
            ok = True
            notes = None
        except Exception as e:
            ok = False
            notes = str(e)
        trace.append(
            WorkflowTraceStep(
                name="analyze_case",
                input=analyze_input.dict() if 'analyze_input' in locals() else {},
                output=analyze_resp if isinstance(analyze_resp, dict) else (analyze_resp.dict() if analyze_resp else {}),
                success=ok,
                duration_ms=round((time.perf_counter() - t0) * 1000, 2),
                notes=notes,
            )
        )

        # Step 2/3/4: Parallel research + insights + geocode (if location)
        async def fetch_research():
            if req.required_resources:
                q = " OR ".join(req.required_resources)
            else:
                q = "public health emergency hospital resources"
            return await self.pm_service.search_papers(q, limit=3)

        async def fetch_insights():
            # minimal insights: WHO indicator + WB population sample
            who = await self.who_service.fetch_indicator("WHOSIS_000001")
            wb = await self.wb_service.fetch_indicator("SP.POP.TOTL", country="us")
            return {"who": who, "worldbank": wb}

        async def fetch_geo():
            if not req.location:
                return None
            return await self.geo_service.geocode(req.location)

        t1 = time.perf_counter()
        try:
            research_resp, insights_resp, geo_resp = await asyncio.gather(fetch_research(), fetch_insights(), fetch_geo())
            ok = True
            notes = None
        except Exception as e:
            ok = False
            notes = str(e)
            research_resp, insights_resp, geo_resp = None, None, None
        trace.append(
            WorkflowTraceStep(
                name="context_fetch",
                input={"resources": req.required_resources, "location": req.location},
                output={"research": research_resp, "insights": insights_resp, "geocode": geo_resp},
                success=ok,
                duration_ms=round((time.perf_counter() - t1) * 1000, 2),
                notes=notes,
            )
        )

        # Step 5: Inventory snapshot
        t2 = time.perf_counter()
        try:
            inv_records = inventory_service.get_snapshot()
            inventory_snap = InventorySnapshot(records=inv_records)
            ok = True
            notes = None
        except Exception as e:
            ok = False
            notes = str(e)
        trace.append(
            WorkflowTraceStep(
                name="inventory_snapshot",
                input={},
                output={"records": len(inventory_snap.records) if inventory_snap else 0},
                success=ok,
                duration_ms=round((time.perf_counter() - t2) * 1000, 2),
                notes=notes,
            )
        )

        # Step 6: Reallocation plan for first needed resource as example
        t3 = time.perf_counter()
        try:
            demands = []
            target_hospital = None
            if inventory_snap and inventory_snap.records:
                target_hospital = inventory_snap.records[0].hospital_id
            if analyze_resp and isinstance(analyze_resp, dict):
                needs = analyze_resp.get("resource_needs") or []
            else:
                needs = req.required_resources or []
            if target_hospital and needs:
                demands.append({
                    "hospital_id": target_hospital,
                    "resource_name": needs[0] if isinstance(needs[0], str) else str(needs[0]),
                    "required_quantity": 10,
                })
            realloc_req = ReallocationRequest(demands=[d for d in demands]) if demands else ReallocationRequest(demands=[])
            plan, unmet, summary = inventory_service.suggest_reallocation(realloc_req)
            realloc_resp = ReallocationResponse(plan=plan, unmet=unmet, summary_by_hospital=summary)
            ok = True
            notes = None
        except Exception as e:
            ok = False
            notes = str(e)
        trace.append(
            WorkflowTraceStep(
                name="reallocation_plan",
                input=realloc_req.dict() if 'realloc_req' in locals() else {},
                output=realloc_resp.dict() if realloc_resp else {},
                success=ok,
                duration_ms=round((time.perf_counter() - t3) * 1000, 2),
                notes=notes,
            )
        )

        summary = "Workflow complete"
        return WorkflowResponse(
            status="ok",
            summary=summary,
            analyze=analyze_resp if isinstance(analyze_resp, dict) else None,
            research=research_resp,
            insights=insights_resp,
            inventory_snapshot=inventory_snap,
            reallocation=realloc_resp,
            trace=trace,
        )
