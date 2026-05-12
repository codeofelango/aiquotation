from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any

# Import helper functions from the existing async database module
from core.database import fetch, execute

router = APIRouter(prefix="/crm", tags=["CRM"])

# --- LEADS ---

@router.get("/leads")
async def get_leads():
    """
    Fetch all leads.
    """
    try:
        query = "SELECT * FROM leads ORDER BY created_at DESC"
        records = await fetch(query)
        return [dict(record) for record in records]
    except Exception as e:
        # In case table doesn't exist or other DB error
        print(f"Error fetching leads: {e}")
        return []

@router.post("/leads")
async def create_lead(lead: Dict[str, Any] = Body(...)):
    """
    Create a new lead.
    """
    try:
        query = """
            INSERT INTO leads (title, company_name, source, status, estimated_value)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """
        rows = await fetch(
            query, 
            lead.get("title"), 
            lead.get("company_name"), 
            lead.get("source"), 
            lead.get("status", "New"), 
            lead.get("estimated_value")
        )
        
        if rows:
            new_id = rows[0]['id']
            return {"id": new_id, "message": "Lead created successfully"}
        return {"message": "Lead created"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- PIPELINE (OPPORTUNITIES) ---

@router.get("/opportunities")
async def get_opportunities():
    """
    Fetch opportunities for the pipeline view.
    """
    try:
        query = "SELECT * FROM leads WHERE status != 'Disqualified' ORDER BY created_at DESC"
        records = await fetch(query)
        return [dict(record) for record in records]
    except Exception as e:
        print(f"Error fetching opportunities: {e}")
        return []

@router.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: int, status_update: Dict[str, str] = Body(...)):
    """
    Update the status/stage of a lead/opportunity.
    """
    try:
        query = "UPDATE leads SET status = $1 WHERE id = $2"
        await execute(query, status_update["status"], lead_id)
        return {"message": "Status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))