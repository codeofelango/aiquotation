-- Assign users to variants (A for even user_id, B for odd) and create an exposure event
WITH tests AS (
  SELECT id, variant
  FROM ab_tests
  WHERE group_name = 'recommendations'
),
targets AS (
  SELECT u.id AS user_id,
         CASE WHEN (u.id % 2 = 0) THEN 'A' ELSE 'B' END AS variant
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM ab_events e
    JOIN ab_tests t ON e.test_id = t.id
    WHERE t.group_name = 'recommendations' AND e.user_id = u.id
  )
)
INSERT INTO ab_events (test_id, user_id, result, timestamp)
SELECT t.id, trg.user_id, 'served', NOW()
FROM targets trg
JOIN tests t ON t.variant = trg.variant;


