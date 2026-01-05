from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from core.database import fetchrow

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(payload: LoginRequest):
    # In a real app, you would hash passwords. 
    # Here we check if the user exists by email.
    
    user = await fetchrow("SELECT id, name, email FROM users WHERE email = $1", payload.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Mocking a token response
    return {
        "token": f"mock-jwt-token-{user['id']}",
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        }
    }