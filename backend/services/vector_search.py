from typing import List, Dict, Any, Iterable
from core.database import fetch
from core.utils import to_pgvector_literal

async def search_similar_items(embedding: Iterable[float], top_k: int = 20) -> List[Dict[str, Any]]:
    """
    Original function: Search for similar items (courses) in the 'items' table.
    """
    vec_literal = to_pgvector_literal(embedding)
    try:
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
                    "score": similarity,
                }
            )
        return results
    except Exception as e:
        print(f"Item search failed: {e}")
        return []

async def search_similar_products(embedding: Iterable[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    New function: Search for similar lighting products in the 'products' table for Quotations.
    """
    if not embedding:
        return []

    # Ensure embedding is a string literal for pgvector if passed as list
    # The 'to_pgvector_literal' util handles lists -> string format '[...]'
    vec_literal = to_pgvector_literal(embedding)

    try:
        rows = await fetch(
            """
            SELECT id, title, description, price, wattage, cct, ip_rating, 
                   (1.0 / (1.0 + (embedding <-> $1::vector))) as similarity
            FROM products
            WHERE embedding IS NOT NULL
            ORDER BY embedding <-> $1::vector
            LIMIT $2
            """,
            vec_literal,
            int(top_k),
        )
        
        results = []
        for row in rows:
            r = dict(row)
            # Normalize score key to match what agent expects
            r['score'] = float(r['similarity']) if r['similarity'] else 0.0
            results.append(r)
            
        return results
    except Exception as e:
        print(f"Product search failed: {e}")
        return []