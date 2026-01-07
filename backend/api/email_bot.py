from fastapi import APIRouter, Body
from pydantic import BaseModel
from agents.email_agent import run_email_bot

router = APIRouter(prefix="/email-bot", tags=["autonomous"])

class IncomingEmail(BaseModel):
    sender: str
    subject: str
    body: str

@router.post("/webhook")
async def receive_email(payload: IncomingEmail):
    """
    Simulates receiving an email. Triggers the Autonomous Agent.
    """
    print(f"🤖 Bot received email from {payload.sender}: {payload.subject}")
    
    result = await run_email_bot(payload.subject, payload.body, payload.sender)
    
    return {
        "status": "processed",
        "intent_detected": result["intent"],
        "generated_draft": result["draft_reply"],
        "action_taken": "Quotation Generated" if result["quotation_id"] else "Replied"
    }