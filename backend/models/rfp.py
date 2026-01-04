from typing import List, Optional, Any, Union
from pydantic import BaseModel, Field, AliasChoices
from datetime import datetime

class RFPRequirement(BaseModel):
    # Allow 'type_id' from LLM to map to 'id', and 'Description' to 'description'
    id: str = Field(validation_alias=AliasChoices('type_id', 'id'), default="N/A", description="Ref number/ID")
    description: str = Field(validation_alias=AliasChoices('Description', 'description'), default="", description="Line item description")
    
    # New Lighting Specific Fields
    Indoor_Outdoor: Optional[str] = Field(default="N/A")
    Installation_Type: Optional[str] = Field(default="N/A")
    Fixture_Type: Optional[str] = Field(default="N/A")
    Wattage: Optional[str] = Field(default="N/A")
    IP_Rating: Optional[str] = Field(default="N/A")
    Beam_Angle: Optional[str] = Field(default="N/A")
    Driver_Type: Optional[str] = Field(default="N/A")
    Color_Temperature: Optional[str] = Field(default="N/A")
    Shape: Optional[str] = Field(default="N/A")
    Dimension: Optional[str] = Field(default="N/A")
    Qty: Optional[Union[str, int, float]] = Field(default=1)
    
    category: Optional[str] = Field(default="Lighting", description="Category of the requirement")
    importance: str = Field(default="High", description="Importance level")

class MatchedProduct(BaseModel):
    requirement_id: str
    product_id: int
    product_title: str
    product_description: str
    match_score: float
    reasoning: str = Field(description="Why this product matches")
    price: float = Field(default=0.0)
    quantity: float = Field(default=1.0)
    unit_price: float = Field(default=0.0)

class Quotation(BaseModel):
    rfp_title: str
    client_name: Optional[str]
    generated_at: datetime
    requirements: List[RFPRequirement]
    matches: List[MatchedProduct]
    total_price: float
    summary: str
    terms: str

class QuotationResponse(BaseModel):
    quotation: Quotation