from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash, create_access_token, verify_password
from app.core.database import SessionLocal
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"  # Default role is 'user'

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(user_in: RegisterRequest):
    db = SessionLocal()
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=user_in.name, email=user_in.email, password_hash=get_password_hash(user_in.password), role=user_in.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return {"id": user.id, "email": user.email}

@router.post("/login")
def login(login_in: LoginRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    db.close()
    return {"access_token": token, "token_type": "bearer"} 