from typing import List, Optional
from pydantic import BaseModel


class ItemCreate(BaseModel):
	title: str
	description: str
	category: str
	tags: List[str]
	difficulty: str


class Item(ItemCreate):
	id: int
	embedding: Optional[List[float]] = None


