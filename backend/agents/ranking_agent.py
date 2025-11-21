from typing import Any, Dict, List, DefaultDict
from collections import defaultdict


def _normalize(values: List[float]) -> List[float]:
	"""Normalize scores to [0,1] while preserving relative differences."""
	if not values:
		return values
	mn = min(values)
	mx = max(values)
	# If all scores are extremely close, spread them gently by rank for stability
	if mx - mn < 1e-3:
		n = max(1, len(values))
		# Linearly space between 0.55 and 0.95 to avoid identical display values
		if n == 1:
			return [0.85]
		step = (0.95 - 0.55) / (n - 1)
		return [0.95 - i * step for i in range(n)]
	# Normalize but shift to avoid harsh 0.0 scores (min becomes 0.3, max becomes 1.0)
	normalized = [(v - mn) / (mx - mn) for v in values]
	return [0.3 + (0.7 * n) for n in normalized]


async def run(state: Dict[str, Any]) -> Dict[str, Any]:
	candidates: List[Dict[str, Any]] = list(state.get("candidates", []))
	category_weights: Dict[str, float] = dict(state.get("category_weights", {}))

	# Compute category boost up to +0.2 based on relative weight
	max_w = max(category_weights.values()) if category_weights else 0.0
	def cat_boost(cat: str) -> float:
		if max_w <= 0:
			return 0.0
		return 0.15 * (category_weights.get(cat, 0.0) / max_w)

	# Apply boosts and preserve original scores
	boosted: List[Dict[str, Any]] = []
	for it in candidates:
		llm_score = float(it.get("score", 0.5))
		similarity = float(it.get("similarity", llm_score))
		# Blend: 70% LLM rerank, 30% vector similarity
		base = 0.7 * llm_score + 0.3 * similarity
		cat = str(it.get("category", "General"))
		boost = cat_boost(cat)
		# Add small tie-breaker based on title hash to prevent identical values after rounding
		title = str(it.get("title", ""))
		tie_break = (abs(hash(title)) % 1000) / 1000_000.0  # up to +0.001
		new_score = base + boost + tie_break
		obj = dict(it)
		obj["score"] = new_score
		obj["_boost"] = boost
		obj["_base_score"] = base
		obj["_llm_score"] = llm_score
		obj["_similarity"] = similarity
		boosted.append(obj)

	# Sort by score desc
	boosted.sort(key=lambda x: x.get("score", 0.0), reverse=True)

	# Enforce diversity: cap per category
	per_category_cap = 4
	selected: List[Dict[str, Any]] = []
	category_counts: DefaultDict[str, int] = defaultdict(int)
	for it in boosted:
		cat = str(it.get("category", "General"))
		if category_counts[cat] >= per_category_cap:
			continue
		selected.append(it)
		category_counts[cat] += 1
		if len(selected) >= 12:
			break

	# Normalize final scores to [0.3, 1.0] range while preserving differences
	final_scores = _normalize([float(x.get("score", 0.0)) for x in selected])
	for i, sc in enumerate(final_scores):
		selected[i]["score"] = round(sc, 2)  # Round to 2 decimals for display

	state["recommendations"] = selected
	return state


