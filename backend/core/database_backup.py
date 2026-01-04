import asyncpg
from typing import Any, List, Optional
from .config import get_settings

_pool: Optional[asyncpg.pool.Pool] = None


async def init_pool() -> None:
	global _pool
	if _pool is None:
		settings = get_settings()
		if not settings.database_url:
			raise RuntimeError("DATABASE_URL is not set")
		_pool = await asyncpg.create_pool(dsn=settings.database_url, min_size=1, max_size=10)


async def close_pool() -> None:
	global _pool
	if _pool is not None:
		await _pool.close()
		_pool = None


def _ensure_pool() -> asyncpg.pool.Pool:
	if _pool is None:
		raise RuntimeError("Database pool is not initialized. Call init_pool() first.")
	return _pool

async def get_db_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        await init_pool()
    if pool is None:
        raise Exception("Database pool not initialized")
    return pool

async def fetch(query: str, *args: Any) -> List[asyncpg.Record]:
	pool = _ensure_pool()
	async with pool.acquire() as conn:
		return await conn.fetch(query, *args)


async def fetchrow(query: str, *args: Any) -> Optional[asyncpg.Record]:
	pool = _ensure_pool()
	async with pool.acquire() as conn:
		return await conn.fetchrow(query, *args)


async def fetchval(query: str, *args: Any) -> Any:
	pool = _ensure_pool()
	async with pool.acquire() as conn:
		return await conn.fetchval(query, *args)


async def execute(query: str, *args: Any) -> str:
	pool = _ensure_pool()
	async with pool.acquire() as conn:
		return await conn.execute(query, *args)


