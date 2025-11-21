from typing import List
from fastapi import APIRouter, HTTPException

try:
	from ..core.database import fetch, fetchrow
	from ..models.users import User
except ImportError:
	from core.database import fetch, fetchrow
	from models.users import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[User])
async def list_users() -> List[User]:
	rows = await fetch(
		"""
		SELECT id, name, email, interests, created_at
		FROM users
		ORDER BY id ASC
		"""
	)
	return [
		User(id=r["id"], name=r["name"], email=r["email"], interests=r["interests"], created_at=r["created_at"])
		for r in rows
	]


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int) -> User:
	r = await fetchrow(
		"""
		SELECT id, name, email, interests, created_at
		FROM users WHERE id = $1
		""",
		int(user_id),
	)
	if not r:
		raise HTTPException(status_code=404, detail="User not found")
	return User(id=r["id"], name=r["name"], email=r["email"], interests=r["interests"], created_at=r["created_at"])


