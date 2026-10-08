from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from backend.app.core.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)
    institution: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    token = credentials.credentials
    user_payload = auth_service.decode_token(token)
    return user_payload

def require_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in."
        )
    user_payload = auth_service.decode_token(credentials.credentials)
    if not user_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please sign in again."
        )
    return user_payload

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    # Enforce password criteria: 8+ chars, uppercase, lowercase, number
    pw = req.password
    has_upper = any(c.isupper() for c in pw)
    has_lower = any(c.islower() for c in pw)
    has_digit = any(c.isdigit() for c in pw)
    if not (has_upper and has_lower and has_digit):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters and include uppercase, lowercase, and numeric characters."
        )

    try:
        user = auth_service.register_user(
            full_name=req.full_name,
            email=req.email,
            password=req.password,
            institution=req.institution
        )
        token = auth_service.create_access_token(user)
        return {"access_token": token, "token_type": "bearer", "user": user}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user = auth_service.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email credentials or password."
        )
    token = auth_service.create_access_token(user)
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me")
def get_profile(user: Dict[str, Any] = Depends(require_current_user)):
    return user
