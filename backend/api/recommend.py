from typing import List
from fastapi import APIRouter, HTTPException

try:
	from ..services.recommend_flow import generate_recommendations
	from ..models.recommendations import Recommendation, RecommendationResponse
	from ..models.items import Item
except ImportError:
	from services.recommend_flow import generate_recommendations
	from models.recommendations import Recommendation, RecommendationResponse
	from models.items import Item

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.get("/{user_id}", response_model=RecommendationResponse)
async def recommend_for_user(user_id: int) -> RecommendationResponse:
	result = await generate_recommendations(user_id=user_id, top_k=20)
	# Backward compatibility: if a plain list is returned, wrap it
	if isinstance(result, list):
		recs = result
		current_courses_raw = []
	else:
		recs = list(result.get("recommendations", []))
		current_courses_raw = list(result.get("current_courses", []))
	# Map to Recommendation models
	mapped: List[Recommendation] = []
	for r in recs:
		item = Item(
			id=r["id"],
			title=r["title"],
			description=r["description"],
			category=r["category"],
			tags=r["tags"],
			difficulty=r["difficulty"],
			embedding=None,
		)
		score = float(r.get("score", 0.0))
		expl = r.get("explanation")
		mapped.append(Recommendation(item=item, score=score, explanation=expl))
	current_courses: List[Item] = []
	for it in current_courses_raw:
		current_courses.append(
			Item(
				id=it["id"],
				title=it["title"],
				description=it["description"],
				category=it["category"],
				tags=it["tags"],
				difficulty=it["difficulty"],
				embedding=None,
			)
		)
	return RecommendationResponse(user_id=user_id, recommendations=mapped, current_courses=current_courses)


