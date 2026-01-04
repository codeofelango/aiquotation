from typing import List, Any
from fastapi import APIRouter

# Absolute imports
from services.recommend_flow import generate_recommendations
from models.recommendations import Recommendation, RecommendationResponse
from models.items import Item

router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.get("/{user_id}", response_model=RecommendationResponse)
async def recommend_for_user(user_id: int) -> Any:
    result = await generate_recommendations(user_id=user_id, top_k=20)
    
    # Handle different return structures
    if isinstance(result, list):
        recs = result
        current_courses_raw = []
    else:
        recs = list(result.get("recommendations", []))
        current_courses_raw = list(result.get("current_courses", []))

    mapped: List[Recommendation] = []
    for r in recs:
        # Check if 'item' is nested or flat
        item_data = r.get("item", r)
        
        item = Item(
            id=item_data.get("id"),
            title=item_data.get("title"),
            description=item_data.get("description"),
            category=item_data.get("category", "General"),
            tags=item_data.get("tags", []),
            difficulty=item_data.get("difficulty", "Beginner"),
            embedding=None,
        )
        score = float(r.get("score", 0.0))
        expl = r.get("explanation")
        mapped.append(Recommendation(item=item, score=score, explanation=expl))

    current_courses: List[Item] = []
    for it in current_courses_raw:
        current_courses.append(
            Item(
                id=it.get("id"),
                title=it.get("title"),
                description=it.get("description"),
                category=it.get("category", "General"),
                tags=it.get("tags", []),
                difficulty=it.get("difficulty", "Beginner"),
                embedding=None,
            )
        )
        
    return RecommendationResponse(user_id=user_id, recommendations=mapped, current_courses=current_courses)