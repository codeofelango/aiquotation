from typing import List
from fastapi import APIRouter, HTTPException

try:
	from ..core.database import fetch, execute, fetchrow
	from ..models.items import Item, ItemCreate
	from ..services.embeddings import embed_and_store_item, embed_all_items_missing
except ImportError:
	from core.database import fetch, execute, fetchrow
	from models.items import Item, ItemCreate
	from services.embeddings import embed_and_store_item, embed_all_items_missing

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=List[Item])
async def list_items() -> List[Item]:
	rows = await fetch(
		"""
		SELECT id, title, description, category, tags, difficulty
		FROM items
		ORDER BY id ASC
		"""
	)
	return [
		Item(
			id=r["id"],
			title=r["title"],
			description=r["description"],
			category=r["category"],
			tags=r["tags"],
			difficulty=r["difficulty"],
			embedding=None,
		)
		for r in rows
	]


@router.post("/add", response_model=Item)
async def add_item(payload: ItemCreate) -> Item:
	# Insert new item
	_ = await execute(
		"""
		INSERT INTO items (title, description, category, tags, difficulty, embedding)
		VALUES ($1, $2, $3, $4, $5, NULL)
		RETURNING id
		""",
		payload.title,
		payload.description,
		payload.category,
		payload.tags,
		payload.difficulty,
	)
	row = await fetchrow("SELECT id FROM items ORDER BY id DESC LIMIT 1")
	if not row:
		raise HTTPException(status_code=500, detail="Failed to insert item")
	item_id = row["id"]
	
	# Automatically generate and store embedding for the new item
	try:
		text = f"{payload.title}. {payload.description}"
		await embed_and_store_item(item_id, text)
		print(f"✅ Auto-generated embedding for new item: {payload.title}")
	except Exception as e:
		# Log error but don't fail the request - embedding can be generated later
		print(f"⚠️  Failed to generate embedding for item {item_id}: {e}")
	
	return Item(id=item_id, **payload.dict(), embedding=None)


@router.post("/embed/{item_id}", status_code=204)
async def embed_item(item_id: int) -> None:
	row = await fetchrow("SELECT id, title, description FROM items WHERE id = $1", int(item_id))
	if not row:
		raise HTTPException(status_code=404, detail="Item not found")
	await embed_and_store_item(row["id"], f"{row['title']}. {row['description']}")
	return None


@router.post("/embed_all", status_code=200)
async def embed_all() -> dict:
	count = await embed_all_items_missing(limit=1000)
	return {"embedded": count}


