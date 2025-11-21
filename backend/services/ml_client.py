import json
from typing import Any, Dict, List, Optional
import httpx
import numpy as np

try:
	from ..core.config import get_settings
except ImportError:
	from core.config import get_settings

# OFFICIAL EURI API EXAMPLES (as comments)
#
# 🔵 Chat completions example
# curl -X POST https://api.euron.one/api/v1/euri/chat/completions \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer YOUR_API_TOKEN" \
#   -d '{
#     "messages":[{
#       "role": "user",
#       "content":"what is AGI"
#     },{
#       "role": "assistant",
#       "content":[{"type":"text","text":"AGI stands for Artificial General Intelligence..."}]
#     }],
#     "model": "gpt-4.1-nano",
#     "max_tokens": 1000,
#     "temperature": 0.7
#   }'
#
# 🔵 Embeddings example
# curl -X POST https://api.euron.one/api/v1/euri/embeddings \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer YOUR_API_TOKEN" \
#   -d '{
#     "input": "The food was delicious...",
#     "model": "text-embedding-3-small"
#   }'


def _headers() -> Dict[str, str]:
	settings = get_settings()
	return {
		"Content-Type": "application/json",
		"Authorization": f"Bearer {settings.ml_api_key}",
	}


async def get_embedding(text: str) -> List[float]:
	settings = get_settings()
	# Fallback (no API key): deterministic pseudo-embedding
	if not settings.ml_api_key or settings.ml_api_key == "REPLACE_WITH_REAL_EURI_API_KEY":
		print("⚠️  ML_API_KEY not configured, using deterministic fallback embeddings")
		seed = abs(hash(text)) % (2**32)
		rng = np.random.default_rng(seed)
		vec = rng.normal(0, 0.01, 768).astype(np.float32)
		# L2 normalize
		norm = np.linalg.norm(vec) + 1e-12
		return (vec / norm).tolist()
	url = f"{settings.ml_api_base_url}/embeddings"
	payload = {
		"input": text,
		"model": settings.embedding_model_name,
	}
	async with httpx.AsyncClient(timeout=60.0) as client:
		try:
			resp = await client.post(url, headers=_headers(), json=payload)
			resp.raise_for_status()
		except httpx.HTTPStatusError as e:
			print(f"❌ Embedding API Error: {e.response.status_code} - {e.response.text}")
			# Fallback to deterministic embedding
			seed = abs(hash(text)) % (2**32)
			rng = np.random.default_rng(seed)
			vec = rng.normal(0, 0.01, 768).astype(np.float32)
			norm = np.linalg.norm(vec) + 1e-12
			return (vec / norm).tolist()
		data = resp.json()
		# Expected shape: {"data":[{"embedding":[...]}], ...}
		embedding = data.get("data", [{}])[0].get("embedding", [])
		return [float(x) for x in embedding]


async def chat_reasoning(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 512) -> str:
	settings = get_settings()
	# Fallback for dev without key: return a minimal summary/echo
	if not settings.ml_api_key or settings.ml_api_key == "REPLACE_WITH_REAL_EURI_API_KEY":
		print("⚠️  ML_API_KEY not configured, using fallback mode")
		return prompt[:max_tokens]
	url = f"{settings.ml_api_base_url}/chat/completions"
	messages: List[Dict[str, Any]] = []
	if system_prompt:
		messages.append({"role": "system", "content": system_prompt})
	messages.append({"role": "user", "content": prompt})
	payload = {
		"messages": messages,
		"model": settings.llm_model_name,
		"max_tokens": max_tokens,
		"temperature": 0.3,
	}
	async with httpx.AsyncClient(timeout=120.0) as client:
		try:
			resp = await client.post(url, headers=_headers(), json=payload)
			resp.raise_for_status()
		except httpx.HTTPStatusError as e:
			# Log request/response for debugging
			print(f"❌ ML API Error: {e.response.status_code} - {e.response.text}")
			print(f"📤 Request payload: {json.dumps(payload, indent=2)}")
			# Fallback to simple echo
			return prompt[:max_tokens]
		data = resp.json()
		choices = data.get("choices", [])
		if not choices:
			return ""
		# Try to support both structured content and plain text
		message = choices[0].get("message", {})
		content = message.get("content", "")
		if isinstance(content, list):
			parts = []
			for part in content:
				if isinstance(part, dict) and part.get("type") == "text":
					parts.append(part.get("text", ""))
			return "\n".join(p for p in parts if p)
		return str(content)


async def rerank_with_llm(query: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
	"""
	Rerank a list of items using an LLM prompt. Returns items with 'score' added and sorted desc.
	We keep this simple/robust by using a structured JSON instruction.
	"""
	settings = get_settings()
	# Fallback: lexical scoring if no API key
	if not settings.ml_api_key or settings.ml_api_key == "REPLACE_WITH_REAL_EURI_API_KEY":
		print("⚠️  ML_API_KEY not configured, using lexical fallback for reranking")
		q_terms = {t.lower() for t in query.split()}
		with_scores = []
		for it in items:
			text = f"{it.get('title','')} {it.get('description','')}"
			t_terms = {t.lower() for t in text.split()}
			overlap_terms = sorted(q_terms & t_terms)
			inter = len(overlap_terms)
			union = len(q_terms | t_terms) or 1
			score = inter / union
			obj_it = dict(it)
			# Preserve similarity from vector search as auxiliary
			if "score" in it:
				try:
					obj_it["similarity"] = float(it["score"])
				except Exception:
					pass
			obj_it["score"] = float(score)
			if overlap_terms and not obj_it.get("explanation"):
				obj_it["explanation"] = f"Shares keywords: {', '.join(list(overlap_terms)[:3])}"
			with_scores.append(obj_it)
		with_scores.sort(key=lambda x: x.get("score", 0.0), reverse=True)
		return with_scores

	instructions = (
		"Given the user query and a list of items (title and description), assign a relevance score 0-1 and a one-sentence reason. "
		"Return ONLY JSON in the following format: "
		'{"ranked":[{"index": <original_index>, "score": <float between 0 and 1>, "reason":"<concise reason>"}]} '
		"Do not include any text outside the JSON. Keep each reason under 12 words and specific to the item."
	)
	item_payload = [{"index": i, "title": it.get("title", ""), "description": it.get("description", "")} for i, it in enumerate(items)]
	prompt = f"{instructions}\n\nQuery: {query}\n\nItems:\n{json.dumps(item_payload)}"
	try:
		raw = await chat_reasoning(prompt, system_prompt="You are a precise reranker.", max_tokens=512)
	except Exception as e:
		print(f"⚠️  Reranking failed: {e}, using fallback")
		# Fallback to lexical
		q_terms = {t.lower() for t in query.split()}
		with_scores = []
		for it in items:
			text = f"{it.get('title','')} {it.get('description','')}"
			t_terms = {t.lower() for t in text.split()}
			inter = len(q_terms & t_terms)
			union = len(q_terms | t_terms) or 1
			score = inter / union
			obj_it = dict(it)
			obj_it["score"] = float(score)
			with_scores.append(obj_it)
		with_scores.sort(key=lambda x: x.get("score", 0.0), reverse=True)
		return with_scores
	
	ranked_map: Dict[int, float] = {}
	reason_map: Dict[int, str] = {}
	try:
		obj = json.loads(raw)
		for r in obj.get("ranked", []):
			idx = int(r.get("index"))
			score = float(r.get("score"))
			ranked_map[idx] = max(0.0, min(1.0, score))
			reason = str(r.get("reason", ""))[:200].strip()
			if reason:
				reason_map[idx] = reason
	except Exception:
		# Fallback: equal scores
		for i in range(len(items)):
			ranked_map[i] = 0.5

	# Attach scores and sort
	with_scores = []
	for i, it in enumerate(items):
		sc = ranked_map.get(i, 0.0)
		obj_it = dict(it)
		# Preserve similarity from vector search if present
		if "score" in it:
			try:
				obj_it["similarity"] = float(it["score"])
			except Exception:
				pass
		obj_it["score"] = sc
		# Attach LLM-provided reason if available
		if i in reason_map and not obj_it.get("explanation"):
			obj_it["explanation"] = reason_map[i]
		with_scores.append(obj_it)
	with_scores.sort(key=lambda x: x.get("score", 0.0), reverse=True)
	return with_scores


