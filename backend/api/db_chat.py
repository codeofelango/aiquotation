from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import json
import traceback
from datetime import datetime, date
from decimal import Decimal

# Try importing the LLM service, fallback if missing
try:
    from services.ml_client import chat_reasoning
except ImportError:
    async def chat_reasoning(prompt, max_tokens=1000):
        return "Error: LLM service not available."

from services import db_tools
from core.database import fetch, execute

router = APIRouter(prefix="/db-chat", tags=["db-chat"])

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

# Custom JSON encoder for Database types
class DbEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def safe_json_dumps(data):
    return json.dumps(data, cls=DbEncoder)

async def ensure_chat_table():
    """Automatically create the chat history table if it doesn't exist."""
    try:
        await execute("""
            CREATE TABLE IF NOT EXISTS db_chat_history (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sql_query TEXT,
                data_snapshot JSONB,
                timestamp TIMESTAMPTZ DEFAULT NOW()
            );
        """)
    except Exception as e:
        print(f"Warning: Could not check/create db_chat_history table: {e}")

@router.get("/sessions")
async def get_sessions(x_user_email: Optional[str] = Header(None)):
    await ensure_chat_table()
    try:
        query = """
            SELECT 
                session_id, 
                MAX(timestamp) as last_active,
                (SELECT content FROM db_chat_history h2 
                 WHERE h2.session_id = h1.session_id AND role = 'user' 
                 ORDER BY timestamp ASC LIMIT 1) as title
            FROM db_chat_history h1
            GROUP BY session_id
            ORDER BY last_active DESC
            LIMIT 20
        """
        rows = await fetch(query)
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return []

@router.get("/history/{session_id}")
async def get_history(session_id: str):
    await ensure_chat_table()
    try:
        query = """
            SELECT role, content, sql_query, data_snapshot 
            FROM db_chat_history 
            WHERE session_id = $1 
            ORDER BY timestamp ASC
        """
        rows = await fetch(query, session_id)
        return [dict(r) for r in rows]
    except Exception:
        return []

@router.post("/message")
async def chat_db(payload: ChatRequest):
    await ensure_chat_table()
    session_id = payload.session_id or str(uuid.uuid4())
    
    try:
        # 1. Store User Msg
        await execute(
            "INSERT INTO db_chat_history (session_id, role, content) VALUES ($1, 'user', $2)",
            session_id, payload.query
        )

        # 2. Get Schema Context
        tables = await db_tools.list_tables()
        schema_info = []
        
        # Prioritize core business tables
        # Note: 'items' often contains product info, 'quotations' or 'opportunities' contains value/sales info
        core_tables = ["items", "users", "quotations", "opportunities", "products", "interactions", "journeys"]
        
        for t in tables:
            if t in core_tables or len(tables) < 15:
                cols = await db_tools.describe_table(t)
                if cols:
                    col_str = ", ".join([f"{c['column_name']}({c['data_type']})" for c in cols])
                    schema_info.append(f"Table {t}: {col_str}")
        
        context_str = "\n".join(schema_info)

        # 3. LLM: Generate SQL
        prompt = f"""
        You are a Senior PostgreSQL Data Analyst. 
        
        Database Schema:
        {context_str}
        
        User Question: {payload.query}
        
        Instructions:
        1. If the user asks for "sales" or "orders", check tables like 'quotations' or 'opportunities' which represent business value.
        2. Return ONLY valid SQL inside ```sql``` blocks.
        3. If no SQL is needed, just return text.
        4. Use ILIKE for text searches.
        5. Limit results to 20 rows.
        """
        
        llm_resp = await chat_reasoning(prompt, max_tokens=300)
        
        if not llm_resp:
            llm_resp = "I'm sorry, I couldn't generate a response at this time."

        sql_query = None
        data_snapshot = None
        final_response = llm_resp

        # 4. Extract and Run SQL
        if "```sql" in llm_resp:
            try:
                # Extract SQL carefully
                parts = llm_resp.split("```sql")
                if len(parts) > 1:
                    sql_content = parts[1].split("```")[0].strip()
                    sql_query = sql_content
                
                if sql_query:
                    # Execute
                    results = await db_tools.run_custom_sql(sql_query)
                    data_snapshot = results
                    
                    # 5. Summarize Results
                    # Serialize safely for the prompt
                    data_str = safe_json_dumps(results[:10])
                    
                    summary_prompt = f"""
                    User Question: {payload.query}
                    SQL Query Executed: {sql_query}
                    Data Results (First 10 rows): {data_str} 
                    Total Rows: {len(results)}
                    
                    Provide a concise, professional answer based on these results.
                    """
                    summary_resp = await chat_reasoning(summary_prompt)
                    if summary_resp:
                        final_response = summary_resp
                    
            except Exception as e:
                print(f"SQL Execution/Processing Error: {e}")
                # We do NOT fail the request, we just append error info to the chat
                final_response += f"\n\n(Note: I attempted to run a query but it encountered an error: {str(e)})"

        # 6. Store Bot Response
        # Safe serialization for the database
        snapshot_json = safe_json_dumps(data_snapshot) if data_snapshot is not None else None
        
        await execute(
            """
            INSERT INTO db_chat_history (session_id, role, content, sql_query, data_snapshot) 
            VALUES ($1, 'bot', $2, $3, $4)
            """,
            session_id, final_response, sql_query, snapshot_json
        )

        return {
            "session_id": session_id,
            "response": final_response,
            "sql": sql_query,
            "data": data_snapshot
        }

    except Exception as e:
        print(f"Chat DB Critical Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))