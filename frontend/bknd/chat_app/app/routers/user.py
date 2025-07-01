from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserRead
from app.core.database import SessionLocal
from app.core.security import decode_access_token

router = APIRouter(prefix="/api/users", tags=["users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: int):
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    db.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user 