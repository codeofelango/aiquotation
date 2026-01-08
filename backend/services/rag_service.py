import re
from typing import List, Dict, Any
from services.embeddings import embed_text
from core.database import execute, fetch, fetchval

# Chunking settings
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Splits text into overlapping chunks."""
    text = re.sub(r'\s+', ' ', text).strip()
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

async def process_document(doc_id: int, text: str):
    """Chunks text, generates embeddings, and stores them."""
    chunks = chunk_text(text)
    
    for i, chunk in enumerate(chunks):
        vector = await embed_text(chunk)
        if vector:
            await execute(
                """
                INSERT INTO rag_chunks (document_id, chunk_index, content, embedding)
                VALUES ($1, $2, $3, $4)
                """,
                doc_id, i, chunk, str(vector)
            )
            
    await execute("UPDATE rag_documents SET processed = TRUE WHERE id = $1", doc_id)

async def retrieve_context(query: str, top_k: int = 5) -> str:
    """Retrieves relevant document chunks for a query."""
    vector = await embed_text(query)
    if not vector: return ""
    
    rows = await fetch(
        """
        SELECT content, 1 - (embedding <=> $1) as score
        FROM rag_chunks
        ORDER BY embedding <=> $1
        LIMIT $2
        """,
        str(vector), top_k
    )
    
    # Concatenate chunks to form context
    context = "\n\n".join([r['content'] for r in rows])
    return context