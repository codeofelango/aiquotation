-- Seed users (example). If you have users-with-journeys.json, convert to INSERTs accordingly.
INSERT INTO users (name, email, interests) VALUES
('Alice Johnson', 'alice@example.com', ARRAY['python','data','ai']),
('Bob Smith', 'bob@example.com', ARRAY['design','ui','ux']),
('Carol Lee', 'carol@example.com', ARRAY['marketing','seo','content']);

-- Create a journey per user
INSERT INTO journeys (user_id) SELECT id FROM users ORDER BY id;

-- Example actions
INSERT INTO journey_actions (journey_id, action_type, item_id, timestamp)
SELECT j.id, 'view', 1, NOW() FROM journeys j WHERE j.user_id = (SELECT id FROM users WHERE email='alice@example.com');

INSERT INTO journey_actions (journey_id, action_type, item_id, timestamp)
SELECT j.id, 'enroll', 2, NOW() FROM journeys j WHERE j.user_id = (SELECT id FROM users WHERE email='bob@example.com');

INSERT INTO journey_actions (journey_id, action_type, item_id, timestamp)
SELECT j.id, 'like', 3, NOW() FROM journeys j WHERE j.user_id = (SELECT id FROM users WHERE email='carol@example.com');

