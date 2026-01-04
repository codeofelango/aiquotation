import asyncpg
from typing import Any, List, Optional
from .config import get_settings

pool: Optional[asyncpg.Pool] = None

async def init_pool():
    global pool
    settings = get_settings()
    dsn = settings.database_url
    if not dsn:
        dsn = f"postgresql://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_server}:{settings.postgres_port}/{settings.postgres_db}"
    
    try:
        pool = await asyncpg.create_pool(dsn)
        print("✅ Database connection pool created")
    except Exception as e:
        print(f"❌ Failed to create database pool: {e}")
        raise e

async def close_pool():
    global pool
    if pool:
        await pool.close()
        print("✅ Database connection pool closed")

async def get_db_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        await init_pool()
    if pool is None:
        raise Exception("Database pool not initialized")
    return pool

async def fetchval(query: str, *args) -> Any:
    """Fetch a single value from the first row and column."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(query, *args)

async def fetchrow(query: str, *args) -> Optional[asyncpg.Record]:
    """Fetch a single row."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)

async def fetch(query: str, *args) -> List[asyncpg.Record]:
    """Fetch multiple rows."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)

# Alias for compatibility if needed
fetchall = fetch

async def execute(query: str, *args) -> str:
    """Execute a command (INSERT, UPDATE, DELETE)."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)