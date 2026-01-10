from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import os

# You typically want to import this from your settings/config
# from core.config import settings 

# If you don't have the library, run: pip install tavily-python
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

router = APIRouter(prefix="/external", tags=["external-search"])

# --- Models ---

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float

class ExternalSearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

# --- Endpoints ---

@router.get("/search-product", response_model=ExternalSearchResponse)
async def search_product_external(
    query: str = Query(..., min_length=2, description="Product name or RFQ item description"),
    limit: int = 5
):
    """
    Search for a product on Google using the Tavily API.
    Useful for finding market prices, specs, or availability for RFQ items.
    """
    
    # 1. Get API Key (Best practice: Load from environment variable)
    api_key = os.getenv("TAVILY_API_KEY")
    
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="Tavily API Key is missing. Please set TAVILY_API_KEY in your environment."
        )

    if not TavilyClient:
        raise HTTPException(
            status_code=500,
            detail="Tavily library not installed. Please run 'pip install tavily-python'"
        )

    try:
        # 2. Initialize Client
        client = TavilyClient(api_key=api_key)

        # 3. Perform Search
        # We assume the user wants 'search' context to find products.
        # include_images=True can be added if your frontend supports it.
        response = client.search(
            query=query,
            search_depth="basic", # 'advanced' is slower but deeper
            max_results=limit,
            include_domains=[],   # Optional: Filter by specific stores if needed
            exclude_domains=[]
        )

        # 4. Format Results
        results = []
        for item in response.get("results", []):
            results.append(SearchResult(
                title=item.get("title", "No Title"),
                url=item.get("url", "#"),
                content=item.get("content", ""),
                score=item.get("score", 0.0)
            ))

        return ExternalSearchResponse(query=query, results=results)

    except Exception as e:
        print(f"❌ External Search Error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")