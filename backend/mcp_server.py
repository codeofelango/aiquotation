#!/usr/bin/env python3
"""
PostgreSQL MCP Server for Claude Desktop
Provides database operations via Model Context Protocol
"""

import sys
import json
import asyncio
from pathlib import Path

# Ensure backend directory is in path
sys.path.insert(0, str(Path(__file__).parent))

from mcp.server import Server
from mcp.types import Tool, TextContent
from mcp.server.stdio import stdio_server
from core.database import init_pool, close_pool
import services.db_tools as db

server = Server("postgresql-mcp-server")

@server.list_tools()
async def list_tools():
    """List all available database tools"""
    return [
        Tool(
            name="execute_query",
            description="Execute a SELECT query and return results. Use for reading data from tables.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SQL SELECT query to execute"
                    },
                    "params": {
                        "type": "array",
                        "description": "Optional query parameters for parameterized queries",
                        "items": {"type": "string"}
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="execute_write",
            description="Execute INSERT, UPDATE, or DELETE queries. Use for modifying data.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SQL INSERT, UPDATE, or DELETE query"
                    },
                    "params": {
                        "type": "array",
                        "description": "Optional query parameters",
                        "items": {"type": "string"}
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="run_custom_sql",
            description="Execute any SQL query (SELECT, INSERT, UPDATE, DELETE, etc.). Automatically handles query type.",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "Any SQL query to execute"
                    },
                    "params": {
                        "type": "array",
                        "description": "Optional query parameters",
                        "items": {"type": "string"}
                    }
                },
                "required": ["sql"]
            }
        ),
        Tool(
            name="list_tables",
            description="List all tables in the database with their schemas",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="describe_table",
            description="Get detailed schema information for a specific table including columns, types, and constraints",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table to describe"
                    }
                },
                "required": ["table_name"]
            }
        ),
        Tool(
            name="get_table_count",
            description="Get the total number of rows in a table",
            inputSchema={
                "type": "object",
                "properties": {
                    "table_name": {
                        "type": "string",
                        "description": "Name of the table"
                    }
                },
                "required": ["table_name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    print(f"Tool called: {name} with arguments: {arguments}", file=sys.stderr)
    """Handle tool execution"""
    try:
        result = None
        
        if name == "execute_query":
            query = arguments.get("query")
            params = arguments.get("params")
            result = await db.execute_query(query, params)
        
        elif name == "execute_write":
            query = arguments.get("query")
            params = arguments.get("params")
            result = await db.execute_write(query, params)
        
        elif name == "run_custom_sql":
            sql = arguments.get("sql")
            params = arguments.get("params")
            result = await db.run_custom_sql(sql, params)
        
        elif name == "list_tables":
            result = await db.list_tables()
        
        elif name == "describe_table":
            table_name = arguments.get("table_name")
            result = await db.describe_table(table_name)
        
        elif name == "get_table_count":
            table_name = arguments.get("table_name")
            result = await db.get_table_count(table_name)
        
        else:
            result = {"success": False, "error": f"Unknown tool: {name}"}
        
        return [TextContent(type="text", text=json.dumps(result, indent=2, default=str))]
    
    except Exception as error:
        return [TextContent(
            type="text",
            text=json.dumps({"success": False, "error": str(error)}, indent=2)
        )]

async def main():
    """Main entry point for MCP server"""
    # Initialize DB connection from existing config
    await init_pool()
    
    try:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options()
            )
    finally:
        await close_pool()

if __name__ == "__main__":
    asyncio.run(main())