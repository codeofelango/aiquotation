from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any
import google.generativeai as genai
from core.config import get_settings
from services.vector_search import search_similar_products
from PIL import Image
import io

router = APIRouter()

# Initialize settings
settings = get_settings()

# Configure GenAI
if settings.google_api_key:
    genai.configure(api_key=settings.google_api_key)

@router.post("/search", response_model=List[Dict[str, Any]])
async def visual_search(file: UploadFile = File(...)):
    """
    Upload an image, describe it using a Vision model, and search for products matching that description.
    """
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Step 1: Use a Vision model to describe the image
        # This is more robust than direct image embedding if the specific embedding model 
        # doesn't support images or if the library version is older.
        vision_model = genai.GenerativeModel('gemini-2.0-flash') # Or gemini-1.5-flash
        
        prompt = "Describe this lighting fixture in detail for a product catalog search. Include fixture type, material, color, estimated wattage usage context, and style."
        response = vision_model.generate_content([prompt, image])
        
        if not response.text:
             raise HTTPException(status_code=500, detail="Failed to analyze image")
             
        description = response.text
        print(f"📷 Image analysis: {description[:100]}...")

        # Step 2: Embed the generated description
        # Now we are embedding text, which is guaranteed to work with embedding-001
        result = genai.embed_content(
            model="models/embedding-001",
            content=description,
            task_type="retrieval_query"
        )
        
        if not result or 'embedding' not in result:
             raise HTTPException(status_code=500, detail="Failed to generate embedding from description")
             
        embedding = result['embedding']
        
        # Step 3: Search database
        products = await search_similar_products(embedding, top_k=10)
        
        return products

    except Exception as e:
        print(f"Visual search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))