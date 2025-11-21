from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class User(BaseModel):
	id: int
	name: str
	email: EmailStr
	interests: List[str]
	created_at: datetime
	summary: Optional[str] = None


