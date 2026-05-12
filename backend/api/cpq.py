from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

# Import helper functions from the existing async database module
from core.database import fetch

router = APIRouter(prefix="/cpq", tags=["CPQ"])

@router.get("/labor-rates")
async def get_labor_rates():
    """
    Fetch all active labor rates.
    """
    try:
        query = "SELECT * FROM labor_rates WHERE active = TRUE ORDER BY role_name ASC"
        records = await fetch(query)
        return [dict(record) for record in records]
    except Exception as e:
        print(f"Error fetching labor rates: {e}")
        return []

@router.get("/consumables")
async def get_consumables():
    """
    Fetch all consumables/materials.
    """
    try:
        query = "SELECT * FROM consumables ORDER BY name ASC"
        records = await fetch(query)
        return [dict(record) for record in records]
    except Exception as e:
        print(f"Error fetching consumables: {e}")
        return []