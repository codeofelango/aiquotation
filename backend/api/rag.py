from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Body, Header
from pydantic import BaseModel
from typing import List, Optional
import uuid
from services.pdf_processor import extract_text_from_pdf
from services.rag_service import process_document, retrieve_context
from services.ml_client import chat_reasoning
from core.database import fetchval, fetch, execute
from core.activity_logger import log_user_activity

router = APIRouter(prefix="/rag", tags=["rag"])

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    x_user_id: Optional[int] = Header(None),
    x_user_email: Optional[str] = Header(None)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    content = await file.read()
    text = extract_text_from_pdf(content)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text")
        
    doc_id = await fetchval(
        "INSERT INTO rag_documents (filename) VALUES ($1) RETURNING id",
        file.filename
    )
    
    background_tasks.add_task(process_document, doc_id, text)
    await log_user_activity(x_user_id, x_user_email, "Uploaded RAG Doc", "Document", doc_id)
    
    return {"status": "success", "message": "Document uploaded", "doc_id": doc_id}

# --- NEW: Get List of Sessions ---
@router.get("/sessions")
async def get_sessions(x_user_email: Optional[str] = Header(None)):
    if not x_user_email: return []
    
    # Get unique sessions with their last message time
    rows = await fetch(
        """
        SELECT session_id, MAX(timestamp) as last_active,
               (SELECT content FROM rag_chat_history h2 WHERE h2.session_id = h1.session_id AND role = 'user' ORDER BY timestamp ASC LIMIT 1) as title
        FROM rag_chat_history h1
        WHERE user_email = $1 AND session_id IS NOT NULL
        GROUP BY session_id
        ORDER BY last_active DESC
        LIMIT 20
        """,
        x_user_email
    )
    return [dict(row) for row in rows]

# --- Get Messages for a Session ---
@router.get("/history/{session_id}")
async def get_session_history(session_id: str, x_user_email: Optional[str] = Header(None)):
    if not x_user_email: return []
    
    rows = await fetch(
        "SELECT role, content FROM rag_chat_history WHERE session_id = $1 AND user_email = $2 ORDER BY timestamp ASC",
        session_id, x_user_email
    )
    return [dict(row) for row in rows]

@router.post("/chat")
async def chat_with_docs(
    payload: ChatRequest,
    x_user_id: Optional[int] = Header(None),
    x_user_email: Optional[str] = Header(None)
):
    session_id = payload.session_id or str(uuid.uuid4())
    
    # 1. Save User Message
    if x_user_email:
        await execute(
            "INSERT INTO rag_chat_history (user_id, user_email, role, content, session_id) VALUES ($1, $2, 'user', $3, $4)",
            x_user_id, x_user_email, payload.query, session_id
        )

    # 2. Retrieve & Generate
    context = await retrieve_context(payload.query)
    
    if not context:
        response_text = "I don't have enough information in the uploaded documents to answer that."
    else:
        prompt = f"""
        You are a helpful assistant answering questions based ONLY on the provided document context.
        
        Context:
        {context}
        
        Question: {payload.query}
        
        Answer (be concise):
        """
        response_text = await chat_reasoning(prompt)

    # 3. Save Bot Response
    if x_user_email:
        await execute(
            "INSERT INTO rag_chat_history (user_id, user_email, role, content, session_id) VALUES ($1, $2, 'bot', $3, $4)",
            x_user_id, x_user_email, response_text, session_id
        )

    return {"response": response_text, "session_id": session_id}