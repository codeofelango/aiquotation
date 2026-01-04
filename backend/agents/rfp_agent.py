import json
import re
from typing import Any, Dict, List, TypedDict, Optional
from datetime import datetime

try:
    from langgraph.graph import StateGraph, END
    _HAS_LANGGRAPH = True
except ImportError:
    _HAS_LANGGRAPH = False

from models.rfp import Quotation
from services.ml_client import chat_reasoning
from services.embeddings import embed_text
from services.vector_search import search_similar_products

class RFPState(TypedDict):
    pdf_text: str
    requirements: List[Dict[str, Any]]
    matches: List[Dict[str, Any]]
    quotation: Dict[str, Any]
    error: Optional[str]

def clean_and_repair_json(json_str: str) -> str:
    """
    Advanced JSON cleanup and repair.
    1. Removes markdown code blocks.
    2. Fixes trailing commas.
    3. Attempts to close truncated structures.
    """
    # 1. Strip Markdown
    json_str = json_str.replace("```json", "").replace("```", "").strip()
    
    # 2. Fix Trailing Commas (Common LLM error)
    # Replaces ", }" with "}" and ", ]" with "]"
    json_str = re.sub(r",\s*\}", "}", json_str)
    json_str = re.sub(r",\s*\]", "]", json_str)

    # 3. Check for truncation and repair
    # If it doesn't end with typical closing characters
    if not (json_str.endswith("}") or json_str.endswith("]")):
        # Find the last valid closing position for the main list or object
        # Heuristic: We want a list of requirements. 
        # Structure is usually { "requirements": [ ... ] }
        
        # If we are inside the list, try to close it.
        if '"requirements": [' in json_str:
            # Find last closing brace of an item '}'
            last_item_end = json_str.rfind("}")
            if last_item_end != -1:
                # Cut off everything after the last extraction
                json_str = json_str[:last_item_end+1]
                # Add closures
                json_str += "]}"
    
    return json_str

async def extract_requirements_node(state: RFPState) -> RFPState:
    text = state.get("pdf_text", "")
    if not text:
        state["error"] = "No text found in PDF"
        return state

    prompt = f"""You are an expert Lighting Specification Analyst. Given a document, extract the following information and organize it into a JSON object.

    **Goal:** Extract lighting fixture line items.

    **Output Schema (JSON):**
    {{
      "requirements": [
        {{
          "type_id": "Ref number/ID/Code (e.g. L1, F1)",
          "Indoor_Outdoor": "Indoor or Outdoor",
          "Installation_Type": "Surface/Recessed/Pendant/Track",
          "Fixture_Type": "Floodlight/Spotlight/Downlight/Linear/etc",
          "Wattage": "Power in Watts (e.g. 10W)",
          "IP_Rating": "IP Rating (e.g. IP65)",
          "Beam_Angle": "Degrees",
          "Driver_Type": "DALI/ON-OFF/0-10V/Phase DIM",
          "Color_Temperature": "Kelvin value (e.g. 3000K)",
          "Shape": "Round/Square/Linear",
          "Description": "Full line item description",
          "Qty": "Quantity (number only)",
          "Dimension": "Size in mm"
        }}
      ]
    }}

    **Instructions:**
    1. Extract information for each line item found in the text.
    2. If an entity is not found, set value to "N/A".
    3. For 'Indoor_Outdoor': If document says "INTERIOR", output "Indoor". If "EXTERIOR", output "Outdoor".
    4. Ensure 'Qty' is a number if possible (default to 1).
    5. Output ONLY valid JSON. 
    6. **CRITICAL:** Do not include trailing commas. Ensure all keys are in double quotes.

    **TEXT TO ANALYZE:**
    {text[:20000]}...
    """
    
    try:
        response = await chat_reasoning(
            prompt, 
            system_prompt="Output ONLY JSON. No markdown. No comments.",
            max_tokens=4000
        )
        
        # Attempt standard parse first
        cleaned = response.replace("```json", "").replace("```", "").strip()
        
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            # Apply robust repair
            repaired = clean_and_repair_json(cleaned)
            try:
                data = json.loads(repaired)
            except Exception as e2:
                print(f"❌ JSON Repair failed: {e2}")
                # Last resort: Try to find ANY extracted items via regex
                # This matches objects like {"type_id": ... }
                # pattern = r'\{[^{}]*"type_id"[^{}]*\}' # Too simple for nested
                raise e2

        req_list = []
        if isinstance(data, dict):
            if "requirements" in data:
                req_list = data["requirements"]
            elif "line_item" in data: 
                req_list = data["line_item"]
            else:
                found = False
                for v in data.values():
                    if isinstance(v, list):
                        req_list = v
                        found = True
                        break
                if not found: 
                    req_list = [data]
        elif isinstance(data, list):
            req_list = data
            
        state["requirements"] = req_list

    except Exception as e:
        print(f"Extraction Error (using fallback): {e}")
        state["error"] = f"Failed to extract requirements: {str(e)}"
        # Fallback ensures flow continues
        state["requirements"] = [
            {
                "type_id": "ERR-01", 
                "Description": "Extraction failed. Please check PDF format.", 
                "Indoor_Outdoor": "N/A",
                "importance": "High"
            }
        ]
    
    return state

async def match_products_node(state: RFPState) -> RFPState:
    reqs = state.get("requirements", [])
    matches = []
    
    for req in reqs:
        # Construct search text from extracted fields
        search_text = (
            f"{req.get('Fixture_Type', '')} {req.get('Installation_Type', '')} "
            f"{req.get('Wattage', '')} {req.get('Color_Temperature', '')} "
            f"{req.get('Description', req.get('description', ''))}"
        ).strip()

        if "N/A" in search_text:
             clean_desc = req.get('Description', req.get('description', ''))
             if clean_desc and clean_desc != "N/A":
                 search_text = clean_desc

        if not search_text: 
            continue
            
        embedding = await embed_text(search_text)
        
        # Use the product search function
        candidates = await search_similar_products(embedding, top_k=5)
        
        if candidates:
            best = candidates[0]
            alts = candidates[1:3]
            alt_text = " | ".join([f"{a['title']} (${a.get('price', 'N/A')})" for a in alts])
            
            score = best.get("score", 0.0)
            
            try:
                qty_val = float(req.get("Qty", 1))
            except:
                qty_val = 1.0

            # Store alternatives in the match object for the UI to use
            # We add an 'alternatives' field explicitly to the dict
            match_obj = {
                "requirement_id": req.get("type_id", req.get("id", "N/A")),
                "product_id": best.get("id"),
                "product_title": best.get("title"),
                "product_description": best.get("description"),
                "match_score": score,
                "reasoning": (
                    f"Best Match: {best.get('title')} ({score:.2f}). "
                    f"Matches Specs: {req.get('Wattage', '')} {req.get('Color_Temperature', '')}. "
                    f"Alternatives: {alt_text}"
                ),
                "quantity": qty_val,
                "unit_price": float(best.get("price", 100.0)),
                "price": float(best.get("price", 100.0)) * qty_val,
                "alternatives": [
                    {
                        "id": a["id"], 
                        "title": a["title"], 
                        "description": a.get("description", ""), 
                        "price": float(a.get("price", 0)), 
                        "score": a.get("score", 0)
                    } for a in alts
                ]
            }
            matches.append(match_obj)
            
    state["matches"] = matches
    return state

async def generate_quotation_node(state: RFPState) -> RFPState:
    matches = state.get("matches", [])
    total_price = sum(m["price"] for m in matches)
    
    summary_prompt = (
        f"Generate a professional lighting quotation summary. "
        f"Total Items: {len(matches)}. Cost: ${total_price}. "
        f"Key Fixtures: {', '.join(set([m['product_title'] for m in matches[:3]]))}. "
    )
    
    try:
        summary = await chat_reasoning(summary_prompt, max_tokens=100)
    except Exception:
        summary = "Lighting quotation generated based on technical specifications."
    
    quotation = {
        "rfp_title": "Lighting Proposal",
        "client_name": "Valued Client",
        "generated_at": datetime.now(),
        "requirements": state.get("requirements", []),
        "matches": matches,
        "total_price": total_price,
        "summary": summary.strip() if hasattr(summary, 'strip') else str(summary),
        "terms": "Valid for 30 days. Warranty: 5 Years on LED drivers."
    }
    state["quotation"] = quotation
    return state

async def run_quotation_flow(pdf_text: str) -> Quotation:
    initial_state: RFPState = {
        "pdf_text": pdf_text,
        "requirements": [],
        "matches": [],
        "quotation": {},
        "error": None
    }

    if _HAS_LANGGRAPH:
        graph = StateGraph(RFPState)
        graph.add_node("extract", extract_requirements_node)
        graph.add_node("match", match_products_node)
        graph.add_node("generate", generate_quotation_node)
        
        graph.set_entry_point("extract")
        graph.add_edge("extract", "match")
        graph.add_edge("match", "generate")
        graph.add_edge("generate", END)
        
        app = graph.compile()
        final_state = await app.ainvoke(initial_state)
    else:
        # Fallback for manual execution
        s = await extract_requirements_node(initial_state)
        s = await match_products_node(s)
        final_state = await generate_quotation_node(s)

    q_data = final_state.get("quotation", {})
    return Quotation(**q_data)