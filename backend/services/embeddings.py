from typing import Iterable, List, Optional

try:
	from .ml_client import get_embedding
	from ..core.database import fetch, fetchrow, execute
	from ..core.utils import to_pgvector_literal
except ImportError:
	from services.ml_client import get_embedding
	from core.database import fetch, fetchrow, execute
	from core.utils import to_pgvector_literal


async def embed_text(text: str) -> List[float]:
	return await get_embedding(text)


async def embed_and_store_user(user_id: int, summary_text: str) -> List[float]:
	vec = await embed_text(summary_text)
	vec_lit = to_pgvector_literal(vec)
	await execute(
		"""
		INSERT INTO embeddings_users (user_id, embedding)
		VALUES ($1, $2::vector)
		ON CONFLICT (user_id) DO UPDATE SET embedding = EXCLUDED.embedding
		""",
		int(user_id),
		vec_lit,
	)
	return vec


async def get_cached_user_embedding(user_id: int) -> Optional[List[float]]:
	row = await fetchrow("SELECT embedding FROM embeddings_users WHERE user_id = $1", int(user_id))
	if not row or row["embedding"] is None:
		return None
	# asyncpg returns vector as string like '[..]'; parse to floats
	raw = row["embedding"]
	if isinstance(raw, str):
		raw = raw.strip().strip("[]")
		if not raw:
			return None
		return [float(x) for x in raw.split(",")]
	return None


async def embed_and_store_item(item_id: int, text: str) -> None:
	vec = await embed_text(text)
	vec_lit = to_pgvector_literal(vec)
	await execute(
		"UPDATE items SET embedding = $1::vector WHERE id = $2",
		vec_lit,
		int(item_id),
	)


async def embed_all_items_missing(limit: int = 1000) -> int:
	rows = await fetch(
		"SELECT id, title, description FROM items WHERE embedding IS NULL ORDER BY id ASC LIMIT $1",
		int(limit),
	)
	count = 0
	for r in rows:
		text = f"{r['title']}. {r['description']}"
		await embed_and_store_item(r["id"], text)
		count += 1
	return count


