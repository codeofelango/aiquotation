import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Absolute imports
from core.config import get_settings
from core.database import init_pool, close_pool, fetchval
from api.recommend import router as recommend_router
from api.items import router as items_router
from api.users import router as users_router
from api.interactions import router as interactions_router
from api.abtest import router as abtest_router
from api.quotation import router as quotation_router
from services.embeddings import embed_all_items_missing, embed_all_products_missing

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    
    async def check_embeddings():
        try:
            # Check Items (Courses)
            missing_items = await fetchval("SELECT COUNT(*) FROM items WHERE embedding IS NULL")
            if missing_items and missing_items > 0:
                print(f"🔄 Found {missing_items} items without embeddings. Processing...")
                count = await embed_all_items_missing(limit=100)
                print(f"✅ Embedded {count} items.")

            # Check Products (Lighting)
            # Ensure products table exists first to avoid errors on fresh init
            has_products_table = await fetchval(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products')"
            )
            if has_products_table:
                missing_products = await fetchval("SELECT COUNT(*) FROM products WHERE embedding IS NULL")
                if missing_products and missing_products > 0:
                    print(f"🔄 Found {missing_products} products without embeddings. Processing...")
                    # Higher limit to process the bulk data faster
                    count = await embed_all_products_missing(limit=500) 
                    print(f"✅ Embedded {count} products.")
                    
        except Exception as e:
            print(f"⚠️  Background embedding generation check warning: {e}")
    
    # Run embedding check in background (non-blocking)
    asyncio.create_task(check_embeddings())
    
    yield
    await close_pool()

def create_app() -> FastAPI:
    app = FastAPI(title="Recommendation & Quotation Backend", version="0.1.0", lifespan=lifespan)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(recommend_router)
    app.include_router(items_router)
    app.include_router(users_router)
    app.include_router(interactions_router)
    app.include_router(abtest_router)
    app.include_router(quotation_router)

    @app.get("/")
    async def root():
        return {"status": "ok", "message": "Backend is running"}

    return app

app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run("main:app", host=settings.backend_host, port=settings.backend_port, reload=True)