## Recommendation System Backend

Production‑grade backend built with FastAPI, Postgres + pgvector (Neon), EURI API, and LangGraph.

### System Overview
- FastAPI service exposing recommendation and catalog endpoints
- Postgres with `pgvector` for semantic search
- EURI API for embeddings (M2‑BERT‑80M‑32K), reranking (Qwen‑3‑32B), and reasoning (GPT‑5‑Mini)
- LangGraph orchestrates a simple multi‑agent flow

### Architecture

```
User → FastAPI → Pipeline
                 1) Load user
                 2) Summarize (LLM)
                 3) Embed summary (EURI)
                 4) Vector search (pgvector)
                 5) Rerank (Qwen via EURI)
                 6) LangGraph agents
                 7) Final recommendations

        ┌───────────────┐     ┌─────────────┐     ┌──────────────┐
        │ data_collector│ →   │ ranking     │ →   │ learning     │
        └───────────────┘     └─────────────┘     └──────────────┘
                ↓                     ↓                    ↑
        ┌───────────────┐     ┌─────────────┐     ┌──────────────┐
        │ embedding     │ →   │ feedback    │ →   │ experiment   │
        └───────────────┘     └─────────────┘     └──────────────┘
```

### Key Files
- `core/config.py` loads environment settings
- `core/database.py` asyncpg connection pool
- `services/ml_client.py` EURI API wrapper (embeddings, chat, rerank)
- `services/vector_search.py` pgvector query
- `services/recommend_flow.py` pipeline
- `agents/graph.py` multi‑agent LangGraph flow

### API
- `GET /recommend/{user_id}` → ranked recommendations
- `POST /items/add` → add item (course)
- `GET /items` → list items
- `GET /users` → list users
- `POST /interactions` → record user action

### Run Locally
1. Create a Neon Postgres database and enable `pgvector` (see database/ folder).
2. Set env vars (see below). If `.env` loading is desired, install `python-dotenv` (already in requirements).
3. Install deps: `pip install -r backend/requirements.txt`
4. Start: `uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`

### Environment Variables
- `DATABASE_URL` (postgres connection string)
- `ML_API_BASE_URL` (default: `https://api.euron.one/api/v1/euri`)
- `ML_API_KEY` (EURI API key)
- `EMBEDDING_MODEL_NAME` (default: `M2-BERT-80M-32K-Retrieval`)
- `RERANK_MODEL_NAME` (default: `Qwen-3-32B`)
- `LLM_MODEL_NAME` (default: `GPT-5-Mini`)
- `BACKEND_HOST` (default: `0.0.0.0`)
- `BACKEND_PORT` (default: `8000`)

### Curl Examples
```bash
curl http://localhost:8000/
curl http://localhost:8000/items
curl http://localhost:8000/users
curl http://localhost:8000/recommend/1
```

Add a new item:
```bash
curl -X POST http://localhost:8000/items/add \
  -H "Content-Type: application/json" \
  -d '{"title":"Intro to Python","description":"Basics of Python","category":"Programming","tags":["python","basics"],"difficulty":"Beginner"}'
```


