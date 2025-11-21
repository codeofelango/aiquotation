from typing import Any, Dict, List, Tuple


def _top_categories(category_weights: Dict[str, float], k: int = 3) -> List[Tuple[str, float]]:
	items = sorted(category_weights.items(), key=lambda kv: kv[1], reverse=True)
	return items[:k]


async def run(state: Dict[str, Any]) -> Dict[str, Any]:
	# Provide learning summary back to caller
	cw = dict(state.get("category_weights", {}))
	state["learning_summary"] = {
		"top_categories": _top_categories(cw, 3),
	}
	return state


