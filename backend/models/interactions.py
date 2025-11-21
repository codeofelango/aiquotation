from datetime import datetime
from pydantic import BaseModel


class Interaction(BaseModel):
	user_id: int
	item_id: int
	action_type: str
	timestamp: datetime


