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
    json_str = json_str.replace("```json", "").replace("```", "").strip()
    if not json_str.endswith("]}") and not json_str.endswith("]"):
        last_object_end = json_str.rfind("}")
        if last_object_end != -1:
            json_str = json_str[:last_object_end+1]
            if json_str.count("[") > json_str.count("]"): json_str += "]"
            if json_str.count("{") > json_str.count("}"): json_str += "}"
    json_str = re.sub(r",\s*\]", "]", json_str)
    json_str = re.sub(r",\s*\}", "}", json_str)
    return json_str

def normalize_keys(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes keys to match Frontend expectations (Title Case).
    """
    normalized = item.copy()
    
    # Helper to map lowercase/variant keys to Standard keys
    mappings = {
        "Wattage": ["wattage", "watts", "power"],
        "Fixture_Type": ["fixture_type", "type", "category"],
        "Beam_Angle": ["beam_angle", "beam", "angle", "Beam Angle"],
        "Lumen_Output": ["lumen_output", "lumens", "flux", "Lumen Output"],
        "Color_Temperature": ["color_temperature", "cct", "color", "CCT"],
        "IP_Rating": ["ip_rating", "ip", "IP"],
        "type_id": ["id", "code", "ref"],
        "Description": ["description", "desc"]
    }

    for standard_key, variants in mappings.items():
        # If standard key is missing, look for variants
        if standard_key not in normalized or not normalized[standard_key] or normalized[standard_key] == "N/A":
            for v in variants:
                if v in item and item[v] and item[v] != "N/A":
                    normalized[standard_key] = item[v]
                    break
    
    return normalized

def refine_with_regex(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Robust regex extraction from description.
    """
    desc = item.get("Description", "")
    if not desc: return item

    def set_if_missing(key, val):
        if not item.get(key) or item[key] == "N/A":
            item[key] = val

    # 1. Wattage: "12W", "12.5 W", "12 watts"
    watt_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:W|w|Watts|watts)\b', desc, re.IGNORECASE)
    if watt_match: set_if_missing("Wattage", f"{watt_match.group(1)}W")

    # 2. CCT: "3000K", "3000 K"
    cct_match = re.search(r'(\d{3,4})\s*(?:K|k|Kelvin)\b', desc, re.IGNORECASE)
    if cct_match: set_if_missing("Color_Temperature", f"{cct_match.group(1)}K")
    
    # 3. IP Rating: "IP65", "IP 44"
    ip_match = re.search(r'IP\s*(\d{2})', desc, re.IGNORECASE)
    if ip_match: set_if_missing("IP_Rating", f"IP{ip_match.group(1)}")

    # 4. Beam Angle: "40°", "40 deg", "40D"
    beam_match = re.search(r'(\d+)\s*(?:°|deg|d|D)\b', desc, re.IGNORECASE)
    if beam_match: set_if_missing("Beam_Angle", f"{beam_match.group(1)}D")

    # 5. Lumens: "1042lm", "1000 lm"
    lm_match = re.search(r'(\d+)\s*(?:lm|LM|lumens)\b', desc, re.IGNORECASE)
    if lm_match: set_if_missing("Lumen_Output", f"{lm_match.group(1)}lm")

    return item

async def extract_requirements_node(state: RFPState) -> RFPState:
    text = state.get("pdf_text", "")
    if not text:
        state["error"] = "No text found in PDF"
        return state

    prompt = f"""You are an expert Lighting Specification Analyst. Extract lighting line items from the document.

    **Goal:** Create a clean JSON list of fixtures.

    **Output Schema (JSON):**
    {{
      "requirements": [
        {{
          "type_id": "Ref ID (e.g. L1)",
          "Description": "Concise description",
          "Fixture_Type": "Type (e.g. Downlight)",
          "Wattage": "Watts (e.g. 10W)",
          "Color_Temperature": "CCT (e.g. 3000K)",
          "IP_Rating": "IP Rating (e.g. IP65)",
          "Beam_Angle": "Beam (e.g. 20D)",
          "Lumen_Output": "Lumens (e.g. 800lm)",
          "Qty": "1"
        }}
      ]
    }}

    **Instructions:**
    1. Extract first 20 items.
    2. Copy values EXACTLY as they appear in text (e.g. '12W', '40°').
    3. Use 'N/A' if missing.
    4. Output Valid JSON only.

    **TEXT:**
    {text[:25000]}...
    """
    
    try:
        response = await chat_reasoning(
            prompt, 
            system_prompt="Output ONLY valid JSON.",
            max_tokens=4000
        )
        
        cleaned = response.replace("```json", "").replace("```", "").strip()
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            repaired = clean_and_repair_json(cleaned)
            try: data = json.loads(repaired)
            except: data = {"requirements": []}

        req_list = []
        if isinstance(data, dict):
            req_list = data.get("requirements", []) or data.get("line_item", [])
            if not req_list and "type_id" in data: req_list = [data]
        elif isinstance(data, list):
            req_list = data
            
        # Apply Normalization AND Regex Fallback
        state["requirements"] = [refine_with_regex(normalize_keys(item)) for item in req_list]

    except Exception as e:
        print(f"Extraction Error: {e}")
        state["error"] = str(e)
        state["requirements"] = []
    
    return state

async def match_products_node(state: RFPState) -> RFPState:
    reqs = state.get("requirements", [])
    matches = []
    
    for req in reqs:
        # Build search text
        search_text = (
            f"{req.get('Fixture_Type', '')} "
            f"{req.get('Wattage', '')} "
            f"{req.get('Color_Temperature', '')} "
            f"{req.get('IP_Rating', '')} "
            f"{req.get('Beam_Angle', '')} "
            f"{req.get('Lumen_Output', '')} "
            f"{req.get('Description', '')}"
        ).strip()

        if len(search_text) < 3 or "N/A" in search_text:
             search_text = req.get('Description', '')

        if not search_text: continue
            
        embedding = await embed_text(search_text)
        candidates = await search_similar_products(embedding, top_k=5)
        
        if candidates:
            best = candidates[0]
            alts = candidates[1:3]
            alt_text = " | ".join([f"{a['title']} (${a.get('price', '0')})" for a in alts])
            score = best.get("score", 0.0)
            
            try: qty_val = float(req.get("Qty", 1))
            except: qty_val = 1.0

            match_obj = {
                "requirement_id": req.get("type_id", req.get("id", "N/A")),
                "product_id": best.get("id"),
                "product_title": best.get("title"),
                "product_description": best.get("description"),
                "match_score": score,
                "reasoning": f"Best Match: {best.get('title')} ({score:.2f}). Alts: {alt_text}",
                "quantity": qty_val,
                "unit_price": float(best.get("price", 100.0)),
                "price": float(best.get("price", 100.0)) * qty_val,
                "image_url": best.get("image_url") or "",
                "alternatives": candidates
            }
            matches.append(match_obj)
            
    state["matches"] = matches
    return state

async def generate_quotation_node(state: RFPState) -> RFPState:
    matches = state.get("matches", [])
    total_price = sum(m["price"] for m in matches)
    quotation = {
        "rfp_title": "Lighting Proposal",
        "client_name": "Valued Client",
        "generated_at": datetime.now(),
        "requirements": state.get("requirements", []),
        "matches": matches,
        "total_price": total_price,
        "summary": f"Generated proposal with {len(matches)} items.",
        "terms": "Valid for 30 days."
    }
    state["quotation"] = quotation
    return state

async def run_quotation_flow(pdf_text: str) -> Quotation:
    initial_state: RFPState = {"pdf_text": pdf_text, "requirements": [], "matches": [], "quotation": {}, "error": None}
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
        s = await extract_requirements_node(initial_state)
        s = await match_products_node(s)
        final_state = await generate_quotation_node(s)
    q_data = final_state.get("quotation", {})
    return Quotation(**q_data)