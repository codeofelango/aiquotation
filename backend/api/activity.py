from fastapi import APIRouter, Query
from typing import List, Optional
from core.database import fetch

router = APIRouter(prefix="/activity", tags=["activity"])

@router.get("/", response_model=List[dict])
async def list_activity(q: Optional[str] = None):
    """
    Fetch system activity logs.
    """
    if q:
        query = """
            SELECT * FROM activity_log 
            WHERE 
                action ILIKE $1 OR 
                user_email ILIKE $1 OR 
                entity_type ILIKE $1
            ORDER BY timestamp DESC 
            LIMIT 50
        """
        rows = await fetch(query, f"%{q}%")
    else:
        query = "SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 50"
        rows = await fetch(query)
        
    return [dict(row) for row in rows]