"""LangChain-based agent orchestration.

This module composes data from multiple services and uses an LLM (OpenAI via LangChain) if available
to perform reasoning over the aggregated data. If no OpenAI key is configured it falls back to a
deterministic heuristic summary to avoid hard failure during development.
"""
from typing import List, Dict, Any, Optional
import asyncio
from ..services import OpenFDAService, EuropePMCService, NominatimService, WHOService, WorldBankService
from ..config import get_settings

try:
    # LangChain and OpenAI LLM
    from langchain.llms import OpenAI
    from langchain import PromptTemplate, LLMChain
    _HAS_LANGCHAIN = True
except Exception:
    _HAS_LANGCHAIN = False


class LangAgent:
    """High-level agent to analyze cases by combining external data and LLM reasoning."""

    def __init__(self, settings=None) -> None:
        self.settings = settings or get_settings()

    async def analyze_case(self, symptoms: List[str], location: Optional[str], required_resources: Optional[List[str]] = None) -> Dict[str, Any]:
        """Perform multi-source fetches and return a structured analysis.

        This method gathers data concurrently from services, and then either asks an LLM to synthesize
        a concise analysis, or falls back to a deterministic summary.
        """
        # Kick off concurrent service calls
        tasks = []
        # geocode if location provided
        if location:
            tasks.append(NominatimService.geocode(location))
        else:
            tasks.append(asyncio.sleep(0, result={}))

        # Fetch some WHO and World Bank sample indicators (small set)
        tasks.append(WHOService.fetch_indicator("Indicator"))
        tasks.append(WorldBankService.fetch_indicator("SP.POP.TOTL"))

        # Fetch EuropePMC papers for symptoms keywords combined
        sym_query = " ".join(symptoms) if symptoms else ""
        tasks.append(EuropePMCService.search_papers(sym_query, limit=5))

        # Fetch OpenFDA info for the first required resource if provided
        if required_resources and len(required_resources) > 0:
            tasks.append(OpenFDAService.search_drug(required_resources[0], limit=5))
        else:
            tasks.append(asyncio.sleep(0, result={}))

        results = await asyncio.gather(*tasks)

        geocode_res, who_res, wb_res, papers_res, openfda_res = results

        # Prepare a compact context string
        context = {
            "symptoms": symptoms,
            "location": location,
            "required_resources": required_resources,
            "geocode": geocode_res,
            "who": who_res,
            "worldbank": wb_res,
            "papers": papers_res,
            "openfda": openfda_res,
        }

        # Use LLM if configured and available
        if _HAS_LANGCHAIN and self.settings.OPENAI_API_KEY:
            try:
                llm = OpenAI(openai_api_key=self.settings.OPENAI_API_KEY, temperature=0.2)
                prompt = PromptTemplate(
                    input_variables=["context"],
                    template=("You are an expert medical data analyst. Given the following JSON context, "
                              "produce: 1) probable diseases (short list with confidence), 2) resource needs, "
                              "3) nearest facility recommendations. Keep output as JSON with keys: probable_diseases, resource_needs, nearest_facilities.\nContext:\n{context}")
                )
                chain = LLMChain(llm=llm, prompt=prompt)
                # run LLM in thread pool because LangChain LLMs may be sync
                loop = asyncio.get_event_loop()
                llm_output = await loop.run_in_executor(None, lambda: chain.run(context=context))
                # Attempt to parse output as JSON if LLM produced JSON-like text
                import json

                try:
                    parsed = json.loads(llm_output)
                    return parsed
                except Exception:
                    # Return the raw string in a wrapped object
                    return {"raw_llm": llm_output, "context": context}
            except Exception as exc:
                # Fall back to deterministic summary on any errors
                return self._fallback_summary(context, error=str(exc))

        # Fallback deterministic summarizer
        return self._fallback_summary(context)

    def _fallback_summary(self, context: Dict[str, Any], error: Optional[str] = None) -> Dict[str, Any]:
        """Produce a safe deterministic summary when LLM not available."""
        symptoms = context.get("symptoms") or []
        probable = []
        # Very simple heuristics -- not medical advice
        if any(s.lower().find("fever") >= 0 for s in symptoms):
            probable.append({"name": "Infection (viral/bacterial)", "confidence": 0.6, "notes": "Fever present"})
        if any(s.lower().find("cough") >= 0 for s in symptoms):
            probable.append({"name": "Respiratory infection", "confidence": 0.5})
        if not probable:
            probable.append({"name": "Undifferentiated illness", "confidence": 0.2})

        # Resource needs = required_resources or infer basic items
        resources = context.get("required_resources") or ["basic PPE", "oxygen supply"]

        # Nearest facilities: attempt to parse geocode
        facilities = []
        geocode = context.get("geocode") or {}
        try:
            results = geocode.get("results", []) if isinstance(geocode, dict) else []
            for r in results[:3]:
                loc = r.get("geometry", {}).get("location", {})
                facilities.append({
                    "name": r.get("formatted_address", "unknown"),
                    "address": r.get("formatted_address"),
                    "latitude": loc.get("lat"),
                    "longitude": loc.get("lng"),
                })
        except Exception:
            pass

        return {
            "probable_diseases": probable,
            "resource_needs": resources,
            "nearest_facilities": facilities,
            "fallback_reason": error,
        }
