from typing import Any, Dict, List

try:
	from ..services.ml_client import chat_reasoning
except ImportError:
	from services.ml_client import chat_reasoning


async def run(state: Dict[str, Any]) -> Dict[str, Any]:
	recs: List[Dict[str, Any]] = list(state.get("recommendations", []))
	user: Dict[str, Any] = dict(state.get("user", {}))
	summary: str = str(state.get("summary", ""))
	
	# Generate personalized explanations for top recommendations
	explanations: Dict[int, str] = {}
	
	# Get user interests for context
	interests = user.get("interests", []) or []
	interest_str = ", ".join(interests) if interests else "general learning"
	
	# Generate explanations for top 10 items (avoid too many API calls)
	for idx, r in enumerate(recs[:10]):
		item_id = int(r.get("id", r.get("item", {}).get("id", 0)))
		# If reranker already provided a reason, keep it
		if str(r.get("explanation", "")).strip():
			explanations[item_id] = str(r.get("explanation")).strip()
			continue
		title = str(r.get("title", ""))
		description = str(r.get("description", ""))
		category = str(r.get("category", ""))
		score = float(r.get("score", 0.0))
		
		# Build a prompt for personalized explanation
		prompt = (
			f"Explain in ONE concise sentence (max 12 words) why '{title}' "
			f"is recommended for someone interested in: {interest_str}. "
			f"Focus on the connection between their interests and this {category} course."
		)
		
		try:
			explanation = await chat_reasoning(
				prompt,
				system_prompt="You are a helpful recommendation explainer. Be concise and specific.",
				max_tokens=50
			)
			# Clean up the explanation
			explanation = explanation.strip().strip('"').strip("'")
			if not explanation:
				explanation = f"Matches your interest in {interest_str}"
			explanations[item_id] = explanation
		except Exception as e:
			# Fallback to simple explanation
			print(f"⚠️  Failed to generate explanation for {title}: {e}")
			if category and interests:
				# Try to find matching interest
				matching = [i for i in interests if i.lower() in description.lower() or i.lower() in title.lower()]
				if matching:
					explanations[item_id] = f"Aligns with your {matching[0]} interests"
				else:
					explanations[item_id] = f"Strong match for {category} learners"
			else:
				explanations[item_id] = "Highly relevant to your profile"
	
	# For remaining items (11+), use simpler explanations to save API calls
	for r in recs[10:]:
		item_id = int(r.get("id", r.get("item", {}).get("id", 0)))
		if item_id not in explanations:
			category = str(r.get("category", ""))
			explanations[item_id] = f"Recommended {category} course"
	
	state["explanations"] = explanations
	return state


