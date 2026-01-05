from fastapi import APIRouter, HTTPException, Query, Body, Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from core.database import fetch, execute, fetchval
from services.embeddings import embed_text
from core.utils import to_pgvector_literal

router = APIRouter(prefix="/opportunities", tags=["opportunities"])

class OpportunityCreate(BaseModel):
    client_name: str
    project_name: str
    expected_rfp_date: Optional[date] = None
    estimated_value: float = 0.0
    notes: str = ""
    status: str = "New"

@router.get("/", response_model=List[dict])
async def list_opportunities():
    rows = await fetch("SELECT * FROM opportunities ORDER BY created_at DESC")
    return [dict(row) for row in rows]

@router.post("/add")
async def add_opportunity(payload: OpportunityCreate):
    search_text = f"{payload.client_name} {payload.project_name} {payload.notes}"
    vector = await embed_text(search_text)
    
    query = """
        INSERT INTO opportunities (client_name, project_name, status, expected_rfp_date, estimated_value, notes, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    """
    
    op_id = await fetchval(
        query,
        payload.client_name,
        payload.project_name,
        payload.status,
        payload.expected_rfp_date,
        payload.estimated_value,
        payload.notes,
        str(vector) if vector else None
    )
    
    return {"status": "success", "id": op_id}

@router.put("/{id}")
async def update_opportunity(id: int, payload: OpportunityCreate):
    # Check if exists
    exists = await fetchval("SELECT 1 FROM opportunities WHERE id = $1", id)
    if not exists:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Update embedding if text changed (optional optimization: check diff)
    search_text = f"{payload.client_name} {payload.project_name} {payload.notes}"
    vector = await embed_text(search_text)

    query = """
        UPDATE opportunities 
        SET client_name = $1, project_name = $2, status = $3, expected_rfp_date = $4, estimated_value = $5, notes = $6, embedding = $7
        WHERE id = $8
    """
    
    await execute(
        query,
        payload.client_name,
        payload.project_name,
        payload.status,
        payload.expected_rfp_date,
        payload.estimated_value,
        payload.notes,
        str(vector) if vector else None,
        id
    )
    
    return {"status": "success", "id": id}

@router.get("/search")
async def search_opportunities(q: str = Query(..., min_length=1)):
    vector = await embed_text(q)
    vec_literal = to_pgvector_literal(vector)
    
    query = f"""
        SELECT *, 
        (1 - (embedding <=> {vec_literal})) as similarity
        FROM opportunities
        WHERE 
            client_name ILIKE $1 OR 
            project_name ILIKE $1 OR 
            (embedding <=> {vec_literal}) < 0.5
        ORDER BY similarity DESC
        LIMIT 20
    """
    
    rows = await fetch(query, f"%{q}%")
    return [dict(row) for row in rows]