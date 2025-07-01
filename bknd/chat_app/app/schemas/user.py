from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str 