-- Table to store uploaded documents metadata
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

-- Table to store document chunks and embeddings
CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER,
    content TEXT,
    embedding vector(768) -- Matches Gemini embedding dimension
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);




CREATE TABLE IF NOT EXISTS rag_chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- Optional: Link to logged-in user
    user_email TEXT, -- Denormalized for easier query
    role TEXT NOT NULL, -- 'user' or 'bot'
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_history_user ON rag_chat_history(user_email);

-- Add session_id to track conversations
ALTER TABLE rag_chat_history ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_rag_history_session ON rag_chat_history(session_id);