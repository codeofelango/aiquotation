-- Create a journey for any user that doesn't have one
INSERT INTO journeys (user_id, started_at)
SELECT u.id, NOW() - ( (u.id % 10) || ' days' )::interval
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM journeys j WHERE j.user_id = u.id);

-- Seed minimal actions for journeys that currently have zero actions:
--   - 2 views, 1 like, 1 enroll (deterministic item selection based on user_id)
WITH journeys_to_seed AS (
  SELECT j.id, j.user_id
  FROM journeys j
  LEFT JOIN journey_actions a ON a.journey_id = j.id
  GROUP BY j.id, j.user_id
  HAVING COUNT(a.journey_id) = 0
),
acts AS (
  SELECT 1 AS seq, 'view'::text AS action_type UNION ALL
  SELECT 2, 'view' UNION ALL
  SELECT 3, 'like' UNION ALL
  SELECT 4, 'enroll'
)
INSERT INTO journey_actions (journey_id, action_type, item_id, timestamp)
SELECT j.id,
       a.action_type,
       i.id,
       NOW() - (a.seq || ' hours')::interval
FROM journeys_to_seed j
CROSS JOIN acts a
JOIN LATERAL (
  SELECT id
  FROM items
  ORDER BY id
  OFFSET GREATEST(0, ((j.user_id + a.seq) % GREATEST((SELECT COUNT(*) FROM items), 1)))
  LIMIT 1
) i ON TRUE;


