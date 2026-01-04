import os
import json
import google.generativeai as genai
from typing import List, Dict, Any
from core.config import get_settings

# Optional import for OpenAI
try:
    from openai import AsyncOpenAI
    _HAS_OPENAI = True
except ImportError:
    _HAS_OPENAI = False

settings = get_settings()

# Initialize Clients
if settings.google_api_key:
    genai.configure(api_key=settings.google_api_key)

openai_client = None
if _HAS_OPENAI and settings.openai_api_key:
    openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

async def chat_reasoning(
    prompt: str, 
    system_prompt: str = "You are a helpful assistant.", 
    max_tokens: int = 1024,
    temperature: float = 0.0
) -> str:
    """
    Unified chat function supporting both Google Gemini and OpenAI.
    """
    provider = settings.llm_provider.lower()
    model = settings.llm_model_name

    if provider == "google":
        try:
            gemini_model = genai.GenerativeModel(
                model_name=model,
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens
                )
            )
            response = await gemini_model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini Error: {e}")
            raise e

    elif provider == "openai" or "gpt" in model:
        if not _HAS_OPENAI:
            raise ImportError("OpenAI provider selected but 'openai' package is not installed.")
        if not openai_client:
            raise ValueError("OpenAI API Key not found")
            
        try:
            response = await openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI Error: {e}")
            raise e
            
    else:
        return f"Mock response from {model}: {prompt[:50]}..."

async def rerank_with_llm(query: str, items: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Reranks a list of items based on the user query using the configured LLM.
    Returns the reordered list of items.
    """
    if not items:
        return []

    # Construct a concise prompt for reranking
    item_list_str = "\n".join([f"{i+1}. {item['title']}: {item.get('description', '')[:150]}..." for i, item in enumerate(items)])
    
    prompt = (
        f"I am looking for: '{query}'\n\n"
        f"Here are the options:\n{item_list_str}\n\n"
        f"Please select the top {top_k} most relevant options from this list. "
        "Return ONLY a JSON array of the original indices (1-based) in order of relevance. "
        "Example: [3, 1, 2]"
    )

    try:
        response = await chat_reasoning(
            prompt, 
            system_prompt="You are a helpful ranking assistant. Output valid JSON only.",
            max_tokens=100,
            temperature=0.0
        )
        
        # Clean and parse
        cleaned = response.replace("```json", "").replace("```", "").strip()
        indices = json.loads(cleaned)
        
        if not isinstance(indices, list):
            raise ValueError("LLM did not return a list")

        # Map 1-based indices back to 0-based items
        ranked_items = []
        for idx in indices:
            if isinstance(idx, int) and 1 <= idx <= len(items):
                ranked_items.append(items[idx-1])
        
        # If LLM returned fewer items than available, append the rest? 
        # Usually we just return what was ranked, or append the rest if strict ordering is needed.
        # For this function, let's just return the ranked ones.
        return ranked_items

    except Exception as e:
        print(f"Reranking failed: {e}. Returning original order.")
        return items[:top_k]