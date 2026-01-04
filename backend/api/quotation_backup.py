from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Any
import logging

# Use absolute imports
from services.pdf_processor import extract_text_from_pdf
from agents.rfp_agent import run_quotation_flow
from models.rfp import QuotationResponse

router = APIRouter(prefix="/quotation", tags=["quotation"])
logger = logging.getLogger("uvicorn")

@router.post("/generate", response_model=QuotationResponse)
async def generate_quotation(file: UploadFile = File(...)) -> Any:
    logger.info(f"Received file upload: {file.filename}, Content-Type: {file.content_type}")
    
    # Case insensitive check for PDF extension
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail=f"Only PDF files are supported. Got: {file.filename}")
    
    try:
        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")
        
        text = extract_text_from_pdf(content)
        logger.info(f"Extracted text length: {len(text)} characters")
        
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file might be scanned (images only) or empty.")
            
        if len(text) < 10: 
            raise HTTPException(status_code=400, detail=f"PDF content too short ({len(text)} chars). Please upload a document with more text.")

        quotation = await run_quotation_flow(text)
        
        return QuotationResponse(quotation=quotation)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing quotation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error processing PDF: {str(e)}")