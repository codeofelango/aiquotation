import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
	from .core.config import get_settings
	from .core.database import init_pool, close_pool, fetchval
	from .api.recommend import router as recommend_router
	from .api.items import router as items_router
	from .api.users import router as users_router
	from .api.interactions import router as interactions_router
	from .api.abtest import router as abtest_router
	from .services.embeddings import embed_all_items_missing
except ImportError:
	from core.config import get_settings
	from core.database import init_pool, close_pool, fetchval
	from api.recommend import router as recommend_router
	from api.items import router as items_router
	from api.users import router as users_router
	from api.interactions import router as interactions_router
	from api.abtest import router as abtest_router
	from services.embeddings import embed_all_items_missing


@asynccontextmanager
async def lifespan(app: FastAPI):
	await init_pool()
	
	# Background task: Auto-generate embeddings for any items missing them
	async def check_embeddings():
		try:
			missing_count = await fetchval("SELECT COUNT(*) FROM items WHERE embedding IS NULL")
			if missing_count > 0:
				print(f"🔄 Found {missing_count} items without embeddings. Generating in background...")
				count = await embed_all_items_missing(limit=100)
				print(f"✅ Auto-generated embeddings for {count} items")
		except Exception as e:
			print(f"⚠️  Background embedding generation failed: {e}")
	
	# Run embedding check in background (non-blocking)
	asyncio.create_task(check_embeddings())
	
	yield
	await close_pool()


def create_app() -> FastAPI:
	app = FastAPI(title="Recommendation Backend", version="0.1.0", lifespan=lifespan)
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

	@app.get("/")
	async def root():
		return {"status": "ok"}

	return app


app = create_app()


if __name__ == "__main__":
	settings = get_settings()
	import uvicorn

	uvicorn.run("backend.main:app", host=settings.backend_host, port=settings.backend_port, reload=True)


