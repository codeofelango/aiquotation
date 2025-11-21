from fastapi import APIRouter

try:
	from ..core.database import execute, fetchrow
	from ..models.interactions import Interaction
except ImportError:
	from core.database import execute, fetchrow
	from models.interactions import Interaction

router = APIRouter(prefix="/interactions", tags=["interactions"])


@router.post("", status_code=204)
async def record_interaction(payload: Interaction) -> None:
	# ensure a current journey exists; if not, create one
	j = await fetchrow("SELECT id FROM journeys WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1", payload.user_id)
	if not j:
		_ = await execute("INSERT INTO journeys (user_id, started_at) VALUES ($1, $2)", payload.user_id, payload.timestamp)
		j = await fetchrow("SELECT id FROM journeys WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1", payload.user_id)
	journey_id = j["id"]
	await execute(
		"""
		INSERT INTO journey_actions (journey_id, action_type, item_id, timestamp)
		VALUES (
			$1, $2, $3, $4
		)
		""",
		journey_id,
		payload.action_type,
		payload.item_id,
		payload.timestamp,
	)
	return None


