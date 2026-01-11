from typing import List, Dict, Any, Optional
from core.database import fetch, execute, fetchval

async def list_tables() -> List[str]:
    """List all public tables in the database."""
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    rows = await fetch(query)
    return [r["table_name"] for r in rows]

async def describe_table(table_name: str) -> List[Dict[str, str]]:
    """Get column information for a specific table."""
    query = """
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1
    """
    rows = await fetch(query, table_name)
    return [dict(r) for r in rows]

async def get_table_count(table_name: str) -> int:
    """Get row count for a table. Validates table name to prevent SQL injection."""
    # Validate table name exists first
    tables = await list_tables()
    if table_name not in tables:
        raise ValueError(f"Table '{table_name}' does not exist")
    
    # Safe to interpolate now
    query = f"SELECT COUNT(*) FROM {table_name}"
    count = await fetchval(query)
    return int(count)

async def execute_query(query: str, params: list = None) -> List[Dict[str, Any]]:
    """Execute a SELECT query."""
    if params is None:
        params = []
    rows = await fetch(query, *params)
    return [dict(r) for r in rows]

async def execute_write(query: str, params: list = None) -> str:
    """Execute INSERT/UPDATE/DELETE."""
    if params is None:
        params = []
    result = await execute(query, *params)
    return result

async def run_custom_sql(sql: str, params: list = None) -> Any:
    """Execute any SQL, returning rows for SELECT or status for others."""
    sql_lower = sql.strip().lower()
    if sql_lower.startswith("select") or " returning " in sql_lower:
        return await execute_query(sql, params)
    else:
        return await execute_write(sql, params)