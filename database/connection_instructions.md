# Neon + pgvector Setup

1. Create a Neon Postgres project and database.
2. In Neon dashboard, copy the connection string (postgresql://...).
3. Set `DATABASE_URL` in the backend environment to that value.
4. Connect to the DB (psql or any client) and run:
   - `\i database/schema.sql`
   - `\i database/seed_courses.sql`
   - `\i database/seed_users.sql`
5. Optional: after loading sufficient data, create the vector index:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
   ```
6. Start the backend: `uvicorn backend.main:app --reload`
7. Frontend expects `NEXT_PUBLIC_BACKEND_URL` (default http://localhost:8000).


