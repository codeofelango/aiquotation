from typing import Any, Dict


async def run(state: Dict[str, Any]) -> Dict[str, Any]:
	# Compute category boost hints to be used by ranking
	category_weights = state.get("category_weights") or {}
	if category_weights:
		total = sum(float(v) for v in category_weights.values())
		if total > 0:
			state["category_preferences"] = {k: float(v) / total for k, v in category_weights.items()}
	return state


