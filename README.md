# GenAI-Based Recommendation System

A production-ready, AI-powered recommendation engine built with FastAPI, Next.js, and PostgreSQL. This system leverages large language models, vector embeddings, and multi-agent workflows to deliver highly personalized course recommendations.

---

## Architecture Overview

![System Architecture](architecture.png)

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with pgvector extension (Neon)
- **AI/ML**: EURI API (gpt-5-mini, m2-bert embeddings)
- **Agent Framework**: LangGraph for multi-agent orchestration
- **Vector Search**: pgvector for semantic similarity

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components with loading states

---

## Key Features

### Intelligent Recommendation Engine
- **Vector Embeddings**: Semantic understanding of course content using 768-dimensional embeddings
- **Multi-Agent System**: Coordinated workflow across data collection, embedding, ranking, feedback, and experimentation agents
- **Personalized Explanations**: LLM-generated reasoning for each recommendation
- **Dynamic Scoring**: Combines vector similarity with category preferences and user behavior

### Real-Time Personalization
- User profile analysis with interest tracking
- Journey-based recommendations from interaction history
- Category-weighted scoring with diversity enforcement
- Adaptive learning from user feedback

### Developer Experience
- Automatic embedding generation for new courses
- Background batch processing on server startup
- Graceful fallbacks when ML API unavailable
- Comprehensive error logging and monitoring

---

## Project Structure

```
├── backend/
│   ├── agents/              # Multi-agent recommendation workflow
│   │   ├── data_collector.py
│   │   ├── embedding_agent.py
│   │   ├── ranking_agent.py
│   │   ├── feedback_agent.py
│   │   └── graph.py
│   ├── api/                 # FastAPI route handlers
│   │   ├── recommend.py
│   │   ├── items.py
│   │   ├── users.py
│   │   └── interactions.py
│   ├── core/                # Configuration and utilities
│   │   ├── config.py
│   │   ├── database.py
│   │   └── utils.py
│   ├── models/              # Pydantic data models
│   ├── services/            # Business logic layer
│   │   ├── embeddings.py
│   │   ├── vector_search.py
│   │   ├── ranking.py
│   │   └── ml_client.py
│   ├── scripts/             # Utility scripts
│   │   ├── import_users_from_json.py
│   │   └── generate_item_embeddings.py
│   └── main.py              # Application entry point
│
├── frontend/
│   ├── app/                 # Next.js app directory
│   │   ├── users/[id]/      # User recommendation pages
│   │   ├── items/           # Course catalog
│   │   └── abtest/          # A/B testing dashboard
│   ├── components/          # Reusable React components
│   │   ├── RecommendationList.tsx
│   │   ├── CourseCard.tsx
│   │   └── Navbar.tsx
│   └── lib/
│       └── api.ts           # API client utilities
│
├── database/
│   ├── schema.sql           # Database schema with pgvector
│   ├── seed_courses.sql     # 50 sample courses
│   └── seed_users.sql       # Sample user data
│
└── users-with-journeys.json # User journey dataset (12 users)
```

---

## Installation & Setup

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL database (Neon recommended)
- EURI API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\Activate.ps1  # Windows PowerShell
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   Create `.env` file in `backend/` directory (or copy from `backend/env.example`):
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ML_API_BASE_URL=https://api.euron.one/api/v1/euri
   ML_API_KEY=your_euri_api_key
   EMBEDDING_MODEL_NAME=togethercomputer/m2-bert-80M-32k-retrieval
   LLM_MODEL_NAME=gpt-5-mini-2025-08-07
   BACKEND_HOST=0.0.0.0
   BACKEND_PORT=8000
   ```

5. **Initialize database**
   
   Run SQL files in Neon SQL Editor or via psql:
   ```bash
   psql $DATABASE_URL -f ../database/schema.sql
   psql $DATABASE_URL -f ../database/seed_courses.sql
   psql $DATABASE_URL -f ../database/seed_users.sql
   ```

6. **Generate embeddings (recommended)**
   
   The backend will attempt background embedding generation on startup, but you can explicitly embed all missing items via:
   ```bash
   curl -X POST http://localhost:8000/items/embed_all
   ```
   (Requires `ML_API_KEY`.)

7. **Start the server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   API available at: `http://localhost:8000`
   
   API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **(Optional) Configure backend URL**

   Create `frontend/.env.local` (or copy from `frontend/env.local.example`):
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Application available at: `http://localhost:3000`

---

## API Endpoints

### Recommendations

```http
GET /recommend/{user_id}
```
Returns personalized course recommendations with scores and explanations.

**Response:**
```json
{
  "user_id": 1,
  "recommendations": [
    {
      "item": {
        "id": 31,
        "title": "Machine Learning Basics",
        "description": "Supervised and unsupervised learning overview.",
        "category": "AI/ML",
        "tags": ["ml", "supervised", "unsupervised"],
        "difficulty": "Beginner"
      },
      "score": 0.92,
      "explanation": "Perfect match for your AI and data interests"
    }
  ]
}
```

### Items

```http
GET /items
```
List all courses

```http
POST /items/add
```
Add a new course (auto-generates embeddings)

**Request:**
```json
{
  "title": "Course Title",
  "description": "Course description",
  "category": "Programming",
  "tags": ["python", "web"],
  "difficulty": "Intermediate"
}
```

### Users

```http
GET /users
```
List all users

```http
GET /users/{user_id}
```
Get user profile with interests

---

## Recommendation Pipeline

### Stage 1: Data Collection
- Loads user profile (interests, preferences)
- Fetches interaction history (views, purchases, progress)
- Computes category weights from past behavior

### Stage 2: Embedding Generation
- Generates user summary using LLM
- Creates 768-dimensional embedding from summary
- Caches embedding for future requests

### Stage 3: Vector Search
- Performs semantic similarity search using pgvector
- Returns top-k candidates based on cosine distance
- Includes initial similarity scores (0-1 range)

### Stage 4: LLM Reranking
- Contextual reranking using GPT-5-Mini
- Considers user interests and course descriptions
- Adjusts scores based on relevance and fit

### Stage 5: Multi-Agent Refinement
- **Data Collector**: Enriches with behavioral signals
- **Embedding Agent**: Validates vector representations
- **Ranking Agent**: Applies category boosts and diversity constraints
- **Feedback Agent**: Generates personalized explanations
- **Experiment Agent**: A/B test variant assignment
- **Learning Agent**: Updates models based on feedback

### Stage 6: Final Output
- Normalized scores (0.3-1.0 range)
- Diverse recommendations (max 4 per category)
- Personalized explanations for each item
- Metadata for tracking and analytics

---

## Database Schema

### Core Tables

**users**
- User profiles with interests and preferences
- Created timestamps for cohort analysis

**items**
- Course catalog with metadata
- 768-dimensional vector embeddings (pgvector)

**journeys**
- User learning paths over time
- Links to interaction events

**journey_actions**
- Granular user interactions (view, like, enroll, progress)
- Timestamped for temporal analysis

**embeddings_users**
- Cached user profile embeddings
- Updated when interests change

**ab_tests / ab_events**
- Experimentation framework
- Variant assignment and outcome tracking

---

## Configuration

### ML Models

**Embedding Model**: `togethercomputer/m2-bert-80M-32k-retrieval`
- 768-dimensional dense vectors
- Optimized for semantic similarity
- Fast inference times

**Language Model**: `gpt-5-mini-2025-08-07`
- Used for summarization and explanation generation
- Handles reranking with contextual understanding
- Temperature: 0.3 for consistent outputs

### Scoring Parameters

**Normalization Range**: 0.3 - 1.0
- Prevents harsh 0.0 scores
- Preserves relative differences
- User-friendly score display

**Category Diversity**: Max 4 per category
- Ensures variety across recommendations
- Prevents filter bubble effect

**Top-K Candidates**: 20 initial results
- Narrowed to 12 final recommendations
- Balance between quality and diversity

---

## Development Workflows

### Adding New Courses

Courses added via API automatically trigger embedding generation:

```bash
curl -X POST http://localhost:8000/items/add \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Course",
    "description": "Course description",
    "category": "Programming",
    "tags": ["python"],
    "difficulty": "Beginner"
  }'
```

### Regenerating Embeddings

For bulk regeneration or fixing missing embeddings:

```bash
python -m scripts.generate_item_embeddings
```

### Importing New Users

From JSON file with journey data:

```bash
python -m scripts.import_users_from_json --path data/users.json
```

---

## Performance Considerations

### Caching Strategy
- User embeddings cached in database
- Settings cached at application startup
- Vector search results use pgvector indexes

### API Rate Limiting
- Explanation generation limited to top 10 items
- Batch processing for embedding generation
- Fallback to local methods when API unavailable

### Scalability
- Async/await throughout for concurrent operations
- Connection pooling for database queries
- Background tasks for non-blocking operations

---

## Monitoring & Debugging

### Logging
- Request/response logging for ML API calls
- Error tracking with detailed stack traces
- Performance metrics for each pipeline stage

### Health Checks
```http
GET /
```
Returns server status

### Database Queries

**Check embedding coverage:**
```sql
SELECT COUNT(*) as total,
       COUNT(embedding) as with_embeddings
FROM items;
```

**View recommendation performance:**
```sql
SELECT u.name, COUNT(ja.id) as interactions
FROM users u
LEFT JOIN journeys j ON u.id = j.user_id
LEFT JOIN journey_actions ja ON j.id = ja.journey_id
GROUP BY u.id, u.name;
```

---

## Troubleshooting

### Empty Recommendations
- Verify items have embeddings: Run `generate_item_embeddings.py`
- Check database connection in `.env`
- Ensure ML API key is valid

### All Scores Identical
- Vector search may be returning similar distances
- Check if embeddings were generated correctly
- Verify normalization logic in `ranking_agent.py`

### ML API Errors
- Check model names match EURI API specifications
- Verify API key is active and has credits
- System falls back to local methods automatically

### Frontend Not Loading
- Ensure backend is running on port 8000
- Check CORS configuration in `main.py`
- Verify Next.js is on port 3000

---

- Neon for serverless PostgreSQL with pgvector
- LangGraph for agent orchestration framework
- Next.js and FastAPI communities for excellent tooling
