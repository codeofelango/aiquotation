from typing import Any, Dict, List, Tuple

try:
	from ..core.database import fetchrow
	from ..services.embeddings import embed_text, get_cached_user_embedding, embed_and_store_user
	from ..services.vector_search import search_similar_items
	from ..services.ranking import rerank
	from ..services.ml_client import chat_reasoning
	from ..agents.graph import run_recommendation_graph
except ImportError:
	from core.database import fetchrow
	from services.embeddings import embed_text, get_cached_user_embedding, embed_and_store_user
	from services.vector_search import search_similar_items
	from services.ranking import rerank
	from services.ml_client import chat_reasoning
	from agents.graph import run_recommendation_graph


async def _load_user_profile(user_id: int) -> Dict[str, Any]:
	row = await fetchrow(
		"""
		SELECT id, name, email, interests
		FROM users
		WHERE id = $1
		""",
		int(user_id),
	)
	if not row:
		return {}
	return {"id": row["id"], "name": row["name"], "email": row["email"], "interests": row["interests"]}


async def _summarize_user(user: Dict[str, Any]) -> str:
	interests = ", ".join(user.get("interests", []) or [])
	prompt = f"Summarize this user for course recommendations. Name: {user.get('name')}. Interests: {interests}."
	summary = await chat_reasoning(prompt, system_prompt="You are a recommender system assistant.", max_tokens=200)
	return summary.strip()


async def generate_recommendations(user_id: int, top_k: int = 20) -> Dict[str, Any]:
	# 1) Load user profile
	user = await _load_user_profile(user_id)
	if not user:
		return []
	# 2) Summarize user
	summary = await _summarize_user(user)
	# 3) Embed summary (cache and reuse)
	user_vector = await get_cached_user_embedding(user_id)
	if not user_vector:
		user_vector = await embed_and_store_user(user_id, summary or "General learner profile")
	# 4) Vector search
	candidates = await search_similar_items(user_vector, top_k=top_k)
	# 5) LLM rerank
	reranked = await rerank(query=summary, candidates=candidates)
	# 6) LangGraph multi-agent flow (optionally adjust/learn)
	state = {"user": user, "summary": summary, "candidates": reranked}
	final_state = await run_recommendation_graph(state)
	# 7) Final recommendations
	final_recs = final_state.get("recommendations", reranked)
	explanations = final_state.get("explanations", {})
	# attach explanations by item id if available
	for r in final_recs:
		item_id = int(r.get("id", 0))
		if item_id in explanations and not r.get("explanation"):
			r["explanation"] = explanations[item_id]
	
	# 8) Derive current courses from recent interactions (enroll actions)
	current_courses: List[Dict[str, Any]] = []
	seen: set = set()
	for it in final_state.get("recent_interactions", []):
		if it.get("action_type") != "enroll":
			continue
		item_id = int(it.get("item_id", 0))
		if not item_id or item_id in seen:
			continue
		seen.add(item_id)
		current_courses.append(
			{
				"id": item_id,
				"title": it.get("title", ""),
				"description": it.get("description", ""),
				"category": it.get("category", "General"),
				"tags": it.get("tags", []),
				"difficulty": it.get("difficulty", "Beginner"),
			}
		)
		# keep it concise
		if len(current_courses) >= 6:
			break

	return {"recommendations": final_recs, "current_courses": current_courses}


