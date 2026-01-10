from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List, Any, Optional
from pydantic import BaseModel
import shutil
import os
import uuid

from core.database import fetch, execute, fetchval
from services.embeddings import embed_and_store_product, embed_all_products_missing
from services.vector_search import search_similar_products

router = APIRouter(prefix="/items", tags=["items"])

# --- Models ---
class ProductCreate(BaseModel):
    title: str 
    description: str = ""
    fixture_type: str = ""
    wattage: str = ""
    cct: str = ""
    ip_rating: str = ""
    price: float = 0.0
    category: str = "Lighting"
    images: List[str] = []

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    fixture_type: Optional[str] = None
    wattage: Optional[str] = None
    cct: Optional[str] = None
    ip_rating: Optional[str] = None
    price: Optional[float] = None
    images: Optional[List[str]] = None

# --- Endpoints ---

@router.post("/upload-image")
async def upload_product_image(file: UploadFile = File(...)):
    """
    Uploads a product image and returns the static URL.
    """
    try:
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = f"static/uploads/{filename}"
        
        # Ensure directory exists
        os.makedirs("static/uploads", exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"/static/uploads/{filename}"}
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Image upload failed")

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
    Add a new product and generate its embedding.
    """
    main_image = payload.images[0] if payload.images else None
    
    # FIX: Do not manually format array as string. asyncpg expects a list.
    # images_array_str = "{" + ",".join(f'"{img}"' for img in payload.images) + "}"

    query = """
        INSERT INTO products (description, fixture_type, wattage, cct, ip_rating, price, indoor_outdoor, images, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, 'General', $7::text[], $8)
        RETURNING id
    """
    try:
        product_id = await fetchval(
            query, 
            # payload.title, (Removed because it is a generated column)
            payload.description, 
            payload.fixture_type, 
            payload.wattage, 
            payload.cct, 
            payload.ip_rating,
            payload.price,
            payload.images, # FIX: Pass the list directly
            main_image
        )
        
        # Generate embedding immediately
        search_text = f"{payload.fixture_type} {payload.title} {payload.description} {payload.wattage} {payload.cct} {payload.ip_rating}"
        await embed_and_store_product(product_id, search_text)
        
        return {"status": "success", "id": product_id}
    except Exception as e:
        print(f"❌ Failed to add product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{product_id}")
async def update_product(product_id: int, payload: ProductUpdate):
    """
    Update a product and REGENERATE its embedding.
    """
    fields = []
    values = []
    idx = 1
    
    # Skipped updating 'title' because it is a generated column.

    if payload.description is not None:
        fields.append(f"description = ${idx}")
        values.append(payload.description)
        idx += 1
    if payload.fixture_type is not None:
        fields.append(f"fixture_type = ${idx}")
        values.append(payload.fixture_type)
        idx += 1
    if payload.wattage is not None:
        fields.append(f"wattage = ${idx}")
        values.append(payload.wattage)
        idx += 1
    if payload.cct is not None:
        fields.append(f"cct = ${idx}")
        values.append(payload.cct)
        idx += 1
    if payload.ip_rating is not None:
        fields.append(f"ip_rating = ${idx}")
        values.append(payload.ip_rating)
        idx += 1
    if payload.price is not None:
        fields.append(f"price = ${idx}")
        values.append(payload.price)
        idx += 1
    if payload.images is not None:
        # FIX: Pass list directly, do not format as string
        fields.append(f"images = ${idx}::text[]")
        values.append(payload.images)
        idx += 1
        if payload.images:
            fields.append(f"image_url = ${idx}")
            values.append(payload.images[0])
            idx += 1

    if not fields:
        return {"status": "no changes"}

    values.append(product_id)
    query = f"UPDATE products SET {', '.join(fields)} WHERE id = ${idx}"

    try:
        # Check if product exists first
        exists = await fetchval("SELECT id FROM products WHERE id = $1", product_id)
        if not exists:
            raise HTTPException(status_code=404, detail="Product not found")

        await execute(query, *values)
        
        # Fetch updated record to get generated fields for embedding
        rows = await fetch("SELECT title, description, fixture_type, wattage, cct, ip_rating FROM products WHERE id = $1", product_id)
        
        if rows:
            p = dict(rows[0])
            search_text = (
                f"{p.get('fixture_type', '')} "
                f"{p.get('title', '')} "
                f"{p.get('description', '')} "
                f"{p.get('wattage', '')} "
                f"{p.get('cct', '')} "
                f"{p.get('ip_rating', '')}"
            ).strip()
            
            await embed_and_store_product(product_id, search_text)
            
        return {"status": "success", "message": "Product updated"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_products_endpoint(q: str = Query(..., min_length=1)):
    """
    Semantic search for products.
    """
    from services.embeddings import embed_text
    vector = await embed_text(q)
    results = await search_similar_products(vector, top_k=20)
    return results

@router.post("/embed_all")
async def embed_all_endpoint():
    count = await embed_all_products_missing(limit=500)
    return {"status": "success", "processed": count}