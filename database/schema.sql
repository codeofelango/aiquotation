-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    interests TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items (courses)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    difficulty TEXT NOT NULL,
    embedding VECTOR(768)
);

-- Journeys
CREATE TABLE IF NOT EXISTS journeys (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journey actions (interactions)
CREATE TABLE IF NOT EXISTS journey_actions (
    id SERIAL PRIMARY KEY,
    journey_id INT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL
);

-- User embeddings
CREATE TABLE IF NOT EXISTS embeddings_users (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    embedding VECTOR(768)
);

-- A/B tests
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    group_name TEXT NOT NULL,
    variant TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B events
CREATE TABLE IF NOT EXISTS ab_events (
    id SERIAL PRIMARY KEY,
    test_id INT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    result TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

-- Optional: vector index (requires pgvector ivfflat; build after data)
-- CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

