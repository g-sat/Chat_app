from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.ticket import Ticket
from app.models.user import User
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "NORMAL"
    assignee_id: int = None

class TicketRead(BaseModel):
    id: int
    title: str
    description: str
    priority: str
    status: str
    creator_id: int
    assignee_id: int = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TicketRead])
def list_tickets(request: Request, authorization: Optional[str] = Header(None)):
    db = SessionLocal()
    user_id = None
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = int(payload["sub"])
    if not user_id:
        db.close()
        raise HTTPException(status_code=401, detail="Not authenticated")
    tickets = db.query(Ticket).filter(
        (Ticket.creator_id == user_id) | (Ticket.assignee_id == user_id)
    ).all()
    db.close()
    return tickets

@router.post("/", response_model=TicketRead)
def create_ticket(ticket_in: TicketCreate, authorization: Optional[str] = Header(None)):
    db = SessionLocal()
    user_id = None
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = int(payload["sub"])
    if not user_id:
        db.close()
        raise HTTPException(status_code=401, detail="Not authenticated")
    ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority,
        creator_id=user_id,
        assignee_id=ticket_in.assignee_id
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    db.close()
    return ticket

@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, authorization: Optional[str] = Header(None)):
    db = SessionLocal()
    user_id = None
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = int(payload["sub"])
    if not user_id:
        db.close()
        raise HTTPException(status_code=401, detail="Not authenticated")
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        db.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.creator_id != user_id and ticket.assignee_id != user_id:
        db.close()
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    db.close()
    return ticket 