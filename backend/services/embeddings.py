import asyncio
import json
import google.generativeai as genai
from typing import List, Optional
from core.config import get_settings
from core.database import fetch, execute, fetchval

# Optional import for OpenAI
try:
    from openai import AsyncOpenAI
    _HAS_OPENAI = True
except ImportError:
    _HAS_OPENAI = False

settings = get_settings()

if settings.google_api_key:
    genai.configure(api_key=settings.google_api_key)

openai_client = None
if _HAS_OPENAI and settings.openai_api_key:
    openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

async def embed_text(text: str) -> List[float]:
    """
    Generate embeddings for a single string using the configured provider.
    """
    text = text.replace("\n", " ") # Common cleanup
    provider = settings.llm_provider.lower()
    model = settings.embedding_model_name

    if provider == "google":
        try:
            # Google's text-embedding-004
            result = genai.embed_content(
                model=model,
                content=text,
                task_type="retrieval_document", 
                title=None
            )
            return result['embedding']
        except Exception as e:
            print(f"Google Embedding Error: {e}")
            # Fallback mock (768 dim is standard for Gemini embeddings)
            return [0.0] * 768

    elif provider == "openai":
        if not _HAS_OPENAI:
            raise ImportError("OpenAI provider selected but 'openai' package is not installed.")
        if not openai_client: 
            raise ValueError("OpenAI Key missing")
            
        resp = await openai_client.embeddings.create(input=[text], model=model)
        return resp.data[0].embedding
    
    else:
        # Mock
        return [0.01] * 768

async def get_cached_user_embedding(user_id: int) -> Optional[List[float]]:
    """
    Retrieve the stored embedding for a user profile.
    """
    row = await fetchval("SELECT embedding FROM users WHERE id = $1", user_id)
    if row:
        if isinstance(row, str):
            try:
                return json.loads(row)
            except:
                return None
        return row
    return None

async def embed_and_store_user(user_id: int, text: str):
    """
    Generate embedding for user profile text and store it.
    """
    vector = await embed_text(text)
    if vector:
        await execute("UPDATE users SET embedding = $1 WHERE id = $2", str(vector), user_id)
    return vector

async def embed_and_store_item(item_id: int, text: str):
    """
    Generate embedding for an item (course) and store it.
    """
    vector = await embed_text(text)
    if vector:
        await execute("UPDATE items SET embedding = $1 WHERE id = $2", str(vector), item_id)
    return vector

async def embed_and_store_product(product_id: int, text: str):
    """
    Generate embedding for a product (lighting fixture) and store it.
    """
    vector = await embed_text(text)
    if vector:
        await execute("UPDATE products SET embedding = $1 WHERE id = $2", str(vector), product_id)
    return vector

async def embed_all_items_missing(limit: int = 50):
    """
    Batch process items (courses) that don't have embeddings yet.
    """
    rows = await fetch("SELECT id, title, description FROM items WHERE embedding IS NULL LIMIT $1", limit)
    count = 0
    for row in rows:
        text = f"{row['title']} {row['description']}"
        await embed_and_store_item(row['id'], text)
        count += 1
    return count

async def embed_all_products_missing(limit: int = 200):
    """
    Batch process products (lighting) that don't have embeddings yet.
    """
    # We fetch relevant columns to build a rich semantic string
    rows = await fetch(
        """
        SELECT id, description, fixture_type, wattage, cct, ip_rating 
        FROM products 
        WHERE embedding IS NULL 
        LIMIT $1
        """, 
        limit
    )
    count = 0
    for row in rows:
        # Construct a descriptive string for semantic search
        # E.g. "Outdoor Wall Grazer 75W 3000K IP67..."
        text = (
            f"{row.get('fixture_type', '')} "
            f"{row.get('description', '')} "
            f"{row.get('wattage', '')} "
            f"{row.get('cct', '')} "
            f"{row.get('ip_rating', '')}"
        ).strip()
        
        await embed_and_store_product(row['id'], text)
        count += 1
        
    return count