import json
from typing import TypedDict, Optional, Dict, Any
from langgraph.graph import StateGraph, END

from services.ml_client import chat_reasoning
from agents.rfp_agent import run_quotation_flow
from core.database import fetchval
from core.config import get_settings

settings = get_settings()

# State Definition
class EmailState(TypedDict):
    email_subject: str
    email_body: str
    sender: str
    intent: str 
    quotation_id: Optional[int]
    draft_reply: str
    error: Optional[str]

# --- Nodes ---

async def analyze_intent_node(state: EmailState) -> EmailState:
    """Classifies if the email is a Request for Proposal (RFP)."""
    prompt = f"""
    Analyze this email. Is the sender asking for a quotation or sending lighting specs?
    
    Subject: {state['email_subject']}
    Body: {state['email_body']}
    
    Output ONE word: 'rfp', 'status', or 'other'.
    """
    intent = await chat_reasoning(prompt, max_tokens=10)
    state['intent'] = intent.strip().lower().replace(".", "")
    return state

async def generate_quote_node(state: EmailState) -> EmailState:
    """If RFP, runs the full Quotation Engine and saves to DB."""
    if 'rfp' in state['intent']:
        try:
            # 1. Run the AI Quotation Flow
            quotation = await run_quotation_flow(state['email_body'])
            
            # 2. Prepare for Database
            content_json = quotation.model_dump(mode='json')
            content_str = json.dumps(content_json)
            
            # 3. Insert into Database as 'draft'
            # This makes it appear in the "Pending Review" dashboard immediately
            q_id = await fetchval(
                """
                INSERT INTO quotations (rfp_title, client_name, status, total_price, content)
                VALUES ($1, $2, 'draft', $3, $4)
                RETURNING id
                """,
                quotation.rfp_title or state['email_subject'], # Fallback to subject if AI didn't name it
                state['sender'], # Use sender email/name as client
                quotation.total_price,
                content_str
            )
            
            state['quotation_id'] = q_id
            
            summary = f"Generated Quote #{q_id} with {len(quotation.matches)} items. Total: ${quotation.total_price:,.2f}"
            state['draft_reply'] = summary
            
        except Exception as e:
            print(f"❌ Auto-Quote Failed: {e}")
            state['error'] = str(e)
            state['quotation_id'] = None
            
    return state

async def draft_email_node(state: EmailState) -> EmailState:
    """Writes a professional email reply based on the action taken."""
    
    if state.get('error'):
        prompt = f"Draft a polite email to {state['sender']} apologizing that we couldn't process their request automatically. Error: {state['error']}"
    elif state['intent'] == 'rfp' and state.get('quotation_id'):
        # Link to the dashboard for the internal user (in the draft note) or just tell the client
        dashboard_link = f"http://localhost:3000/quotation/{state['quotation_id']}"
        
        prompt = f"""
        You are a Sales Engineer assistant. Draft a reply to {state['sender']}.
        
        Context: You successfully processed their RFP and created Quote #{state['quotation_id']}.
        Stats: {state['draft_reply']}
        
        Action: Tell them the quotation has been drafted and is currently under engineering review. 
        It will be sent shortly.
        
        Tone: Professional, helpful, concise.
        """
    else:
        prompt = f"Draft a generic reply to {state['sender']} acknowledging receipt. Subject: {state['email_subject']}."

    reply = await chat_reasoning(prompt)
    state['draft_reply'] = reply
    return state

# --- Graph ---
def build_email_agent():
    graph = StateGraph(EmailState)
    
    graph.add_node("classify", analyze_intent_node)
    graph.add_node("process_quote", generate_quote_node)
    graph.add_node("draft_reply", draft_email_node)
    
    graph.set_entry_point("classify")
    
    def route_intent(state):
        if 'rfp' in state['intent']:
            return "process_quote"
        else:
            return "draft_reply"

    graph.add_conditional_edges("classify", route_intent)
    graph.add_edge("process_quote", "draft_reply")
    graph.add_edge("draft_reply", END)
    
    return graph.compile()

async def run_email_bot(subject: str, body: str, sender: str):
    app = build_email_agent()
    initial = {
        "email_subject": subject,
        "email_body": body,
        "sender": sender,
        "intent": "",
        "quotation_id": None,
        "draft_reply": "",
        "error": None
    }
    return await app.ainvoke(initial)