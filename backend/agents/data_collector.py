from typing import Any, Dict, List, DefaultDict
from collections import defaultdict

try:
	from ..core.database import fetch
except ImportError:
	from core.database import fetch


_ACTION_WEIGHTS = {
	"enroll": 3.0,
	"like": 2.0,
	"view": 1.0,
}


async def run(state: Dict[str, Any]) -> Dict[str, Any]:
	user = state.get("user") or {}
	user_id = int(user.get("id", 0))
	if not user_id:
		return state

	rows = await fetch(
		"""
		SELECT ja.action_type, ja.item_id, 
		       i.title, i.description, i.category, i.tags, i.difficulty
		FROM journey_actions ja
		JOIN journeys j ON ja.journey_id = j.id
		JOIN items i ON i.id = ja.item_id
		WHERE j.user_id = $1
		ORDER BY ja.timestamp DESC
		LIMIT 50
		""",
		user_id,
	)

	category_weights: DefaultDict[str, float] = defaultdict(float)
	tag_weights: DefaultDict[str, float] = defaultdict(float)
	recent: List[Dict[str, Any]] = []

	for r in rows:
		action = (r["action_type"] or "view").lower()
		weight = _ACTION_WEIGHTS.get(action, 1.0)
		category = r["category"] or "General"
		category_weights[category] += weight
		for t in (r["tags"] or []):
			tag_weights[str(t)] += weight
		recent.append(
			{
				"action_type": action,
				"item_id": r["item_id"],
				"title": r["title"],
				"description": r["description"],
				"category": category,
				"tags": r["tags"] or [],
				"difficulty": r["difficulty"],
				"weight": weight,
			}
		)

	state["recent_interactions"] = recent
	state["category_weights"] = dict(category_weights)
	state["tag_weights"] = dict(tag_weights)
	return state


