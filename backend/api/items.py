from fastapi import APIRouter, HTTPException, Query
from typing import List, Any, Optional
from pydantic import BaseModel

from core.database import fetch, execute, fetchval
from services.embeddings import embed_and_store_product, embed_all_products_missing
from services.vector_search import search_similar_products

router = APIRouter(prefix="/items", tags=["items"])

# --- Models ---
class ProductCreate(BaseModel):
    title: str # We keep this in the model but won't insert it into DB if column is generated
    description: str = ""
    fixture_type: str = ""
    wattage: str = ""
    cct: str = ""
    ip_rating: str = ""
    price: float = 0.0
    category: str = "Lighting"

# --- Endpoints ---

@router.get("/", response_model=List[dict])
async def get_products():
    """
    Fetch all products from the 'products' table.
    """
    rows = await fetch("SELECT * FROM products ORDER BY id DESC LIMIT 100")
    return [dict(row) for row in rows]

@router.post("/add")
async def add_product(payload: ProductCreate):
    """
    Add a new product to the 'products' table and generate its embedding.
    """
    # FIX: Removed 'title' from INSERT because it is a GENERATED ALWAYS column in the DB schema.
    # The DB will auto-create the title like "Wall Grazer 72W 3000K"
    query = """
        INSERT INTO products (description, fixture_type, wattage, cct, ip_rating, price, indoor_outdoor)
        VALUES ($1, $2, $3, $4, $5, $6, 'General')
        RETURNING id
    """
    try:
        product_id = await fetchval(
            query, 
            payload.description, 
            payload.fixture_type, 
            payload.wattage, 
            payload.cct, 
            payload.ip_rating,
            payload.price
        )
        
        # Generate embedding immediately
        search_text = f"{payload.fixture_type} {payload.description} {payload.wattage} {payload.cct} {payload.ip_rating}"
        await embed_and_store_product(product_id, search_text)
        
        return {"status": "success", "id": product_id}
    except Exception as e:
        print(f"❌ Failed to add product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_products_endpoint(q: str = Query(..., min_length=1)):
    """
    Semantic search for products.
    """
    # We use a mocked embedding generation here or import from services
    from services.embeddings import embed_text
    vector = await embed_text(q)
    results = await search_similar_products(vector, top_k=20)
    return results

@router.post("/embed_all")
async def embed_all_endpoint():
    count = await embed_all_products_missing(limit=500)
    return {"status": "success", "processed": count}