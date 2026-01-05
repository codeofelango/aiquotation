import json
from typing import Optional, Any
from core.database import execute

async def log_user_activity(
    user_id: Optional[int],
    user_email: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[Any] = None
):
    """
    Logs a user action to the activity_log table.
    """
    # Fallback for system actions if no user context
    final_user_id = user_id
    final_user_email = user_email
    
    if not final_user_id and not final_user_email:
        final_user_id = 0
        final_user_email = "system"

    try:
        details_json = json.dumps(details) if details else None
        
        await execute(
            """
            INSERT INTO activity_log (user_id, user_email, action, entity_type, entity_id, details)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            final_user_id,
            final_user_email,
            action,
            entity_type,
            entity_id,
            details_json
        )
    except Exception as e:
        print(f"❌ Failed to log activity: {e}")