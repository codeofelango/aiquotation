from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Header
from typing import List, Any, Dict, Optional
import logging
import json

from services.pdf_processor import extract_text_from_pdf
from agents.rfp_agent import run_quotation_flow
from models.quotation_db import QuotationDB, QuotationUpdate, AuditLogEntry
from core.database import fetchval, fetch, execute, fetchrow
from services.vector_search import search_similar_products
from services.embeddings import embed_text
from core.activity_logger import log_user_activity # New import

router = APIRouter(prefix="/quotation", tags=["quotation"])
logger = logging.getLogger("uvicorn")

@router.post("/upload", response_model=QuotationDB)
async def upload_and_process_rfp(
    file: UploadFile = File(...),
    x_user_id: Optional[int] = Header(None),
    x_user_email: Optional[str] = Header(None)
) -> Any:
    logger.info(f"Processing RFP: {file.filename}")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        text = extract_text_from_pdf(content)
        
        if not text or len(text) < 10:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        ai_quotation = await run_quotation_flow(text)
        content_json = ai_quotation.model_dump(mode='json')
        content_str = json.dumps(content_json)
        
        q_id = await fetchval(
            """
            INSERT INTO quotations (rfp_title, client_name, status, total_price, content)
            VALUES ($1, $2, 'draft', $3, $4)
            RETURNING id
            """,
            ai_quotation.rfp_title,
            ai_quotation.client_name or "New Client",
            ai_quotation.total_price,
            content_str
        )
        
        # Log Activity
        await log_user_activity(
            user_id=x_user_id,
            user_email=x_user_email,
            action="Created Quotation",
            entity_type="Quotation",
            entity_id=q_id,
            details={"filename": file.filename, "value": ai_quotation.total_price}
        )
        
        row = await fetchrow("SELECT * FROM quotations WHERE id = $1", q_id)
        return _map_row_to_model(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

# ... (Rest of existing endpoints list/get remain same) ...

@router.get("/list", response_model=List[QuotationDB])
async def list_quotations():
    try:
        rows = await fetch("SELECT * FROM quotations ORDER BY updated_at DESC")
        return [_map_row_to_model(row) for row in rows]
    except Exception as e:
        logger.error(f"Error listing quotations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=QuotationDB)
async def get_quotation(id: int):
    try:
        row = await fetchrow("SELECT * FROM quotations WHERE id = $1", id)
        if not row:
            raise HTTPException(status_code=404, detail="Quotation not found")
        return _map_row_to_model(row)
    except Exception as e:
        logger.error(f"Error fetching quotation {id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/update")
async def update_quotation(
    id: int, 
    payload: QuotationUpdate,
    x_user_id: Optional[int] = Header(None),
    x_user_email: Optional[str] = Header(None)
):
    try:
        current_row = await fetchrow("SELECT content FROM quotations WHERE id = $1", id)
        if not current_row:
            raise HTTPException(status_code=404, detail="Not found")
        
        content_val = current_row['content']
        content = json.loads(content_val) if isinstance(content_val, str) else content_val
        if not isinstance(content, dict): content = {}

        if payload.client_name:
            content["client_name"] = payload.client_name
            await execute("UPDATE quotations SET client_name = $1 WHERE id = $2", payload.client_name, id)

        if payload.items:
            new_total = 0.0
            matches = content.get("matches", [])
            for update_item in payload.items:
                for match in matches:
                    if match.get("product_id") == update_item.product_id:
                        match["quantity"] = update_item.quantity
                        match["unit_price"] = update_item.unit_price
                        match["price"] = update_item.unit_price * update_item.quantity
                        
            new_total = sum(m.get("price", 0) for m in matches)
            content["total_price"] = new_total
            await execute("UPDATE quotations SET total_price = $1 WHERE id = $2", new_total, id)
            
            await log_user_activity(
                user_id=x_user_id,
                user_email=x_user_email,
                action="Updated Pricing/Qty",
                entity_type="Quotation",
                entity_id=id,
                details={"new_total": new_total}
            )

        await execute(
            "UPDATE quotations SET content = $1, updated_at = NOW() WHERE id = $2", 
            json.dumps(content), id
        )
        return {"status": "success", "total_price": content.get("total_price", 0)}
    except Exception as e:
        logger.error(f"Error updating quotation {id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/rematch")
async def rematch_quotation(
    id: int, 
    requirements: List[Dict[str, Any]] = Body(...),
    x_user_id: Optional[int] = Header(None),
    x_user_email: Optional[str] = Header(None)
):
    try:
        current_row = await fetchrow("SELECT content FROM quotations WHERE id = $1", id)
        if not current_row:
            raise HTTPException(status_code=404, detail="Not found")
        
        content_val = current_row['content']
        content = json.loads(content_val) if isinstance(content_val, str) else content_val
        
        new_matches = []
        for req in requirements:
            search_text = (
                f"{req.get('Fixture_Type', '')} {req.get('Installation_Type', '')} "
                f"{req.get('Wattage', '')} {req.get('Color_Temperature', '')} "
                f"{req.get('Description', req.get('description', ''))}"
            ).strip()
            
            if not search_text or "N/A" in search_text:
                 search_text = req.get('Description', req.get('description', ''))

            if not search_text: continue
                
            embedding = await embed_text(search_text)
            candidates = await search_similar_products(embedding, top_k=5)
            
            if candidates:
                best = candidates[0]
                alts = candidates[1:3]
                alt_text = " | ".join([f"{a['title']} (${a.get('price', 'N/A')})" for a in alts])
                score = best.get("score", 0.0)
                
                try:
                    qty_val = float(req.get("Qty", 1))
                except:
                    qty_val = 1.0

                new_matches.append({
                    "requirement_id": req.get("id") or req.get("type_id") or "N/A",
                    "product_id": best.get("id"),
                    "product_title": best.get("title"),
                    "product_description": best.get("description"),
                    "match_score": score,
                    "reasoning": (
                        f"Best Match: {best.get('title')} ({score:.2f}). "
                        f"Matches Specs: {req.get('Wattage', '')} {req.get('Color_Temperature', '')}. "
                        f"Alternatives: {alt_text}"
                    ),
                    "quantity": qty_val,
                    "unit_price": float(best.get("price", 100.0)),
                    "price": float(best.get("price", 100.0)) * qty_val,
                    "image_url": f"https://placehold.co/100x100?text={best.get('title', 'Img')[:3]}",
                    "alternatives": [
                        {
                            "id": a["id"], 
                            "title": a["title"], 
                            "description": a.get("description", ""), 
                            "price": float(a.get("price", 0)), 
                            "score": a.get("score", 0)
                        } for a in alts
                    ]
                })

        content["requirements"] = requirements
        content["matches"] = new_matches
        content["total_price"] = sum(m["price"] for m in new_matches)
        
        await execute(
            "UPDATE quotations SET content = $1, total_price = $2, updated_at = NOW() WHERE id = $3", 
            json.dumps(content), content["total_price"], id
        )
        
        await log_user_activity(
            user_id=x_user_id,
            user_email=x_user_email,
            action="Regenerated Matches",
            entity_type="Quotation",
            entity_id=id,
            details={"match_count": len(new_matches)}
        )
        
        return {"status": "success", "matches": new_matches, "total_price": content["total_price"]}

    except Exception as e:
        logger.error(f"Rematch failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/status")
async def set_status(
    id: int, 
    status: str = Body(..., embed=True),
    x_user_id: Optional[int] = Header(None),
    x_user_email: Optional[str] = Header(None)
):
    allowed = ["draft", "saved", "created", "printed", "sent", "re_changes"]
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")
    
    await execute("UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
    
    await log_user_activity(
        user_id=x_user_id,
        user_email=x_user_email,
        action="Updated Status",
        entity_type="Quotation",
        entity_id=id,
        details={"new_status": status}
    )
    return {"status": "success"}

@router.get("/{id}/audit", response_model=List[AuditLogEntry])
async def get_audit_log(id: int):
    rows = await fetch("SELECT * FROM quotation_audit_log WHERE quotation_id = $1 ORDER BY timestamp DESC", id)
    return [dict(row) for row in rows]

def _map_row_to_model(row: Any) -> Dict[str, Any]:
    d = dict(row)
    if "content" in d and isinstance(d["content"], str):
        try:
            d["content"] = json.loads(d["content"])
        except:
            d["content"] = {}
    return d