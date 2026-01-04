from typing import Any, Dict, List
from services.ml_client import rerank_with_llm

async def rerank(query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Rerank candidates using LLM.
    """
    return await rerank_with_llm(query, candidates)