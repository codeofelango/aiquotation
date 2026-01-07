from fastapi import APIRouter, HTTPException, Body, BackgroundTasks
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import bcrypt
import random
import string
from core.database import fetchrow, execute
from core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

# Email Configuration
mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_STARTTLS=settings.mail_starttls,
    MAIL_SSL_TLS=settings.mail_ssl_tls,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class VerifyRequest(BaseModel):
    email: str
    code: str

class ResendRequest(BaseModel):
    email: str

class ResetRequest(BaseModel):
    email: str
    code: str
    new_password: str

def generate_code():
    return ''.join(random.choices(string.digits, k=6))

# --- Direct Bcrypt Implementation ---
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72: pwd_bytes = pwd_bytes[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    if len(pwd_bytes) > 72: pwd_bytes = pwd_bytes[:72]
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except ValueError:
        return False

# --- Helper to send email ---
async def send_email_background(email: str, subject: str, body: str):
    if not settings.mail_password:
        print(f"📧 [MOCK EMAIL to {email}] {subject} \n {body[:50]}...")
        return

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype=MessageType.html
    )
    fm = FastMail(mail_config)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"❌ Failed to send email to {email}: {e}")

# --- Endpoints ---

@router.post("/register")
async def register(payload: RegisterRequest, background_tasks: BackgroundTasks):
    existing = await fetchrow("SELECT id FROM users WHERE email = $1", payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(payload.password)
    code = generate_code()
    
    await fetchrow(
        """
        INSERT INTO users (email, name, password_hash, verification_code, is_verified)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING id
        """,
        payload.email, payload.name, hashed, code
    )
    
    body = f"""
    <h3>Welcome to Project Phoenix</h3>
    <p>Hello {payload.name},</p>
    <p>Your verification code is: <strong style="font-size: 24px;">{code}</strong></p>
    <p>Please enter this code to activate your account.</p>
    """
    background_tasks.add_task(send_email_background, payload.email, "Verify your account", body)
    
    return {"status": "success", "message": "Verification code sent to email"}

@router.post("/resend-code")
async def resend_code(payload: ResendRequest, background_tasks: BackgroundTasks):
    user = await fetchrow("SELECT id, name FROM users WHERE email = $1", payload.email)
    if not user:
        return {"status": "success", "message": "If account exists, code sent"}

    code = generate_code()
    await execute("UPDATE users SET verification_code = $1 WHERE email = $2", code, payload.email)
    
    body = f"""
    <h3>New Verification Code</h3>
    <p>Hello {user['name']},</p>
    <p>Your new verification code is: <strong style="font-size: 24px;">{code}</strong></p>
    """
    background_tasks.add_task(send_email_background, payload.email, "New Verification Code", body)
    
    return {"status": "success", "message": "Code resent"}

@router.post("/verify")
async def verify_email(payload: VerifyRequest):
    user = await fetchrow("SELECT id, verification_code FROM users WHERE email = $1", payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if str(user['verification_code']) != str(payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    await execute("UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE email = $1", payload.email)
    return {"status": "success", "message": "Account verified"}

@router.post("/login")
async def login(payload: LoginRequest):
    user = await fetchrow("SELECT * FROM users WHERE email = $1", payload.email)
    
    if not user or not user['password_hash']:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(payload.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user['is_verified']:
        raise HTTPException(status_code=403, detail="Email not verified")
    
    return {
        "token": f"mock-jwt-{user['id']}",
        "user": {"id": user['id'], "name": user['name'], "email": user['email']}
    }

@router.post("/forgot-password")
async def forgot_password(background_tasks: BackgroundTasks, payload: dict = Body(...)):
    email = payload.get("email")
    user = await fetchrow("SELECT id FROM users WHERE email = $1", email)
    if not user:
        # Return success to prevent email enumeration
        return {"status": "success", "message": "If account exists, code sent"}
        
    code = generate_code()
    await execute("UPDATE users SET reset_code = $1 WHERE email = $2", code, email)
    
    body = f"""
    <h3>Password Reset Request</h3>
    <p>Your password reset code is: <strong>{code}</strong></p>
    <p>If you did not request this, please ignore this email.</p>
    """
    background_tasks.add_task(send_email_background, email, "Reset your password", body)

    return {"status": "success", "message": "Reset code sent"}

@router.post("/reset-password")
async def reset_password(payload: ResetRequest):
    user = await fetchrow("SELECT id, reset_code FROM users WHERE email = $1", payload.email)
    if not user or str(user['reset_code']) != str(payload.code):
        raise HTTPException(status_code=400, detail="Invalid code")
        
    hashed = hash_password(payload.new_password)
    await execute("UPDATE users SET password_hash = $1, reset_code = NULL WHERE email = $2", hashed, payload.email)
    
    return {"status": "success", "message": "Password updated"}