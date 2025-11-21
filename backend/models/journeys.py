from datetime import datetime
from pydantic import BaseModel


class Journey(BaseModel):
	id: int
	user_id: int
	started_at: datetime


class JourneyAction(BaseModel):
	id: int
	journey_id: int
	action_type: str
	item_id: int
	timestamp: datetime


