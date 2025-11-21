from typing import Any, Dict, Iterable, List

try:
	from ..core.database import fetch
	from ..core.utils import to_pgvector_literal
except ImportError:
	from core.database import fetch
	from core.utils import to_pgvector_literal


async def search_similar_items(embedding: Iterable[float], top_k: int = 20) -> List[Dict[str, Any]]:
	"""
	Use pgvector distance: ORDER BY embedding <-> $1::vector LIMIT $2
	We pass the vector as a literal to cast safely server-side.
	Returns items with similarity scores based on distance.
	"""
	vec_literal = to_pgvector_literal(embedding)
	rows = await fetch(
		"""
		SELECT id, title, description, category, tags, difficulty,
		       (1.0 / (1.0 + (embedding <-> $1::vector))) as similarity
		FROM items
		WHERE embedding IS NOT NULL
		ORDER BY embedding <-> $1::vector
		LIMIT $2
		""",
		vec_literal,
		int(top_k),
	)
	results: List[Dict[str, Any]] = []
	for r in rows:
		similarity = float(r["similarity"]) if r["similarity"] else 0.5
		results.append(
			{
				"id": r["id"],
				"title": r["title"],
				"description": r["description"],
				"category": r["category"],
				"tags": r["tags"],
				"difficulty": r["difficulty"],
				"score": similarity,  # Add initial similarity score
			}
		)
	return results


