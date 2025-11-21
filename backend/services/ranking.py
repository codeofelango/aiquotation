from typing import Any, Dict, List
from .ml_client import rerank_with_llm


async def rerank(query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
	"""
	Use Qwen 32B (via EURI) for reranking under the hood of rerank_with_llm.
	"""
	return await rerank_with_llm(query, candidates)


