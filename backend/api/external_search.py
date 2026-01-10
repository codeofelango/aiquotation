from fastapi import APIRouter, HTTPException, Query
import os
import requests
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Explicitly load .env file to ensure variables are available
load_dotenv()

router = APIRouter()

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float
    # New fields for enhanced features
    images: List[str] = []
    
class SearchResponse(BaseModel):
    answer: Optional[str] = None
    results: List[SearchResult]

@router.get("/search-product", response_model=SearchResponse)
def search_product_external(
    query: str,
    include_images: bool = Query(True, description="Include product images in results"),
    include_answer: bool = Query(False, description="Generate an AI summary answer"),
    search_depth: str = Query("basic", regex="^(basic|advanced)$", description="Search depth level")
):
    """
    Search for product information using Tavily Search API.
    Supports images, AI answers, and variable search depth.
    """
    # Debug print to help verify what key is being seen (prints first 4 chars only for security)
    api_key = os.getenv("TAVILY_API_KEY")
    
    if not query:
        return {"results": [], "answer": None}
        
    if not api_key:
        print("⚠️ Warning: TAVILY_API_KEY not found in environment variables.")
        print("Check your .env file format. It should be: TAVILY_API_KEY=\"your_key_here\"")
        return {"results": [], "answer": None}

    try:
        # Tavily API endpoint
        url = "https://api.tavily.com/search"
        
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": search_depth,
            "include_answer": include_answer,
            "include_raw_content": False,
            "include_images": include_images,
            "max_results": 5
        }
        
        response = requests.post(url, json=payload, timeout=15) # Increased timeout for advanced search
        response.raise_for_status()
        
        data = response.json()
        results = []
        
        # Extract images if available
        # Tavily returns images in a separate 'images' list key in the root response usually,
        # or sometimes mapped to results depending on the query type. 
        # For general search, it often provides a list of image URLs in 'images'.
        global_images = data.get("images", [])
        
        for i, item in enumerate(data.get("results", [])):
            # Distribute global images to results if specific ones aren't provided
            # This is a basic fallback visualization strategy
            item_images = []
            if include_images and i < len(global_images):
                # Try to grab a relevant image. 
                # Note: Tavily 'images' is a list of URLs (strings)
                if isinstance(global_images[i], str):
                     item_images.append(global_images[i])
                elif isinstance(global_images[i], dict) and 'url' in global_images[i]:
                     item_images.append(global_images[i]['url'])

            results.append({
                "title": item.get("title", "No Title"),
                "url": item.get("url", "#"),
                "content": item.get("content", ""),
                "score": item.get("score", 0.0),
                "images": item_images
            })
            
        return {
            "answer": data.get("answer"),
            "results": results
        }

    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Tavily: {e}")
        return {"results": [], "answer": None}
    except Exception as e:
        print(f"Unexpected error in external search: {e}")
        return {"results": [], "answer": None}