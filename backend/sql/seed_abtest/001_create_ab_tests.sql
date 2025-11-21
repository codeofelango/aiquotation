-- Create A/B test variants for the recommendations group if they don't exist
INSERT INTO ab_tests (group_name, variant)
SELECT 'recommendations', 'A'
WHERE NOT EXISTS (
  SELECT 1 FROM ab_tests WHERE group_name = 'recommendations' AND variant = 'A'
);

INSERT INTO ab_tests (group_name, variant)
SELECT 'recommendations', 'B'
WHERE NOT EXISTS (
  SELECT 1 FROM ab_tests WHERE group_name = 'recommendations' AND variant = 'B'
);


