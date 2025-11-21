from typing import List, Optional
from pydantic import BaseModel
from .items import Item


class Recommendation(BaseModel):
	item: Item
	score: float
	explanation: Optional[str] = None


class RecommendationResponse(BaseModel):
	user_id: int
	recommendations: List[Recommendation]
	current_courses: List[Item] = []


