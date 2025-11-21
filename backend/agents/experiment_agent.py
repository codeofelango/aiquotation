from typing import Any, Dict

try:
	from ..core.database import fetchrow, execute
except ImportError:
	from core.database import fetchrow, execute


async def _get_or_create_test(group_name: str, variant: str) -> int:
	row = await fetchrow(
		"SELECT id FROM ab_tests WHERE group_name = $1 AND variant = $2 ORDER BY id LIMIT 1",
		group_name,
		variant,
	)
	if row:
		return int(row["id"])
	_ = await execute(
		"INSERT INTO ab_tests (group_name, variant) VALUES ($1, $2)",
		group_name,
		variant,
	)
	row2 = await fetchrow(
		"SELECT id FROM ab_tests WHERE group_name = $1 AND variant = $2 ORDER BY id DESC LIMIT 1",
		group_name,
		variant,
	)
	return int(row2["id"]) if row2 else 0


async def run(state: Dict[str, Any]) -> Dict[str, Any]:
	user = state.get("user") or {}
	user_id = int(user.get("id", 0))
	variant = "A" if (user_id % 2 == 0) else "B"
	test_id = await _get_or_create_test("recommendations", variant)
	if test_id:
		await execute(
			"INSERT INTO ab_events (test_id, user_id, result, timestamp) VALUES ($1, $2, $3, NOW())",
			test_id,
			user_id,
			"served",
		)
	state["ab_variant"] = variant
	return state


