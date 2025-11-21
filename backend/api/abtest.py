from typing import Any, Dict, List
from fastapi import APIRouter

try:
	from ..core.database import fetch, fetchrow
except ImportError:
	from core.database import fetch, fetchrow


router = APIRouter(prefix="/abtest", tags=["abtest"])


@router.get("/summary")
async def abtest_summary() -> Dict[str, Any]:
	group = "recommendations"

	# Active tests
	row = await fetchrow("SELECT COUNT(*) AS c FROM ab_tests WHERE group_name = $1", group)
	active_tests = int(row["c"]) if row else 0

	# Exposures and unique users per variant
	exposure_rows = await fetch(
		"""
		SELECT t.variant, COUNT(*) AS exposures, COUNT(DISTINCT e.user_id) AS unique_users
		FROM ab_events e
		JOIN ab_tests t ON e.test_id = t.id
		WHERE t.group_name = $1
		GROUP BY t.variant
		""",
		group,
	)
	exposures: Dict[str, Dict[str, int]] = {
		str(r["variant"]): {"exposures": int(r["exposures"]), "unique_users": int(r["unique_users"])}
		for r in exposure_rows
	}

	# Interaction totals per variant (dedupe to distinct users first)
	interaction_rows = await fetch(
		"""
		WITH users_by_variant AS (
			SELECT DISTINCT e.user_id, t.variant
			FROM ab_events e
			JOIN ab_tests t ON e.test_id = t.id
			WHERE t.group_name = $1
		)
		SELECT u.variant,
		       COALESCE(SUM(CASE WHEN ja.action_type = 'view' THEN 1 ELSE 0 END), 0) AS views,
		       COALESCE(SUM(CASE WHEN ja.action_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
		       COALESCE(SUM(CASE WHEN ja.action_type = 'enroll' THEN 1 ELSE 0 END), 0) AS enrolls
		FROM users_by_variant u
		JOIN journeys j ON j.user_id = u.user_id
		LEFT JOIN journey_actions ja ON ja.journey_id = j.id
		GROUP BY u.variant
		""",
		group,
	)
	interactions: Dict[str, Dict[str, int]] = {
		str(r["variant"]): {
			"views": int(r["views"]),
			"likes": int(r["likes"]),
			"enrolls": int(r["enrolls"]),
		}
		for r in interaction_rows
	}

	# Build final stats, adding derived rates
	variants = {}
	for variant in ["A", "B"]:
		exp = exposures.get(variant, {"exposures": 0, "unique_users": 0})
		ints = interactions.get(variant, {"views": 0, "likes": 0, "enrolls": 0})
		exposures_count = exp["exposures"]
		users_count = exp["unique_users"] or 0
		views = ints["views"]
		likes = ints["likes"]
		enrolls = ints["enrolls"]
		variants[variant] = {
			"exposures": exposures_count,
			"unique_users": users_count,
			"views": views,
			"likes": likes,
			"enrolls": enrolls,
			"views_per_user": (views / users_count) if users_count else 0.0,
			"likes_per_user": (likes / users_count) if users_count else 0.0,
			"enrolls_per_user": (enrolls / users_count) if users_count else 0.0,
			"enroll_rate_per_exposure": (enrolls / exposures_count) if exposures_count else 0.0,
		}

	return {
		"group": group,
		"totals": {"active_tests": active_tests, "variants": list(variants.keys())},
		"variants": variants,
	}


