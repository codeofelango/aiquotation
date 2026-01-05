-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id SERIAL PRIMARY KEY,
    client_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    status TEXT DEFAULT 'New', -- New, RFP Expected, RFQ Received, Closed
    expected_rfp_date DATE,
    estimated_value NUMERIC(12, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    embedding vector(768) -- Support for semantic search on project notes
);

-- Index for vector search
CREATE INDEX IF NOT EXISTS opportunities_embedding_idx ON opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Seed Data
INSERT INTO opportunities (client_name, project_name, status, expected_rfp_date, estimated_value, notes) VALUES
('Marriott Hotels', 'Riyadh Resort Lighting', 'RFP Expected', '2026-03-15', 500000.00, 'Large scale outdoor and indoor lighting renovation. Emphasis on warm 2700K ambient lighting.'),
('Emaar Properties', 'Dubai Creek Tower Facade', 'New', '2026-06-01', 1200000.00, 'Dynamic RGBW facade lighting requirement. Needs IP68 linear grazers.'),
('Red Sea Global', 'Coral Bloom Villas', 'RFQ Received', '2026-02-10', 750000.00, 'Luxury villa lighting. High CRI required. Sustainability focus.'),
('Aramco', 'Dhahran Office Complex', 'New', '2026-04-20', 300000.00, 'Functional office lighting, UGR<19 panels and linear profiles.'),
('Seven', 'Jazan Entertainment Hub', 'RFP Expected', '2026-05-05', 2000000.00, 'Themed entertainment lighting. DMX control systems needed.');