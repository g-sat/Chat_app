from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.message import MessageCreate, MessageRead
from app.models.message import Message
from app.models.user import User
from app.core.database import SessionLocal

router = APIRouter(prefix="/api/messages", tags=["messages"])

@router.post("/", response_model=MessageRead)
def send_message(message_in: MessageCreate):
    db = SessionLocal()
    db_message = Message(
        sender_id=message_in.sender_id if hasattr(message_in, 'sender_id') else 1,  # Replace with actual user logic
        receiver_id=message_in.receiver_id,
        ticket_id=message_in.ticket_id,
        content=message_in.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    db.close()
    return MessageRead.from_orm(db_message)

@router.get("/ticket/{ticket_id}", response_model=List[MessageRead])
def list_ticket_messages(ticket_id: int):
    db = SessionLocal()
    messages = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp).all()
    db.close()
    return [MessageRead.from_orm(m) for m in messages]

@router.get("/user/{user_id}", response_model=List[MessageRead])
def list_user_messages(user_id: int):
    db = SessionLocal()
    messages = db.query(Message).filter(
        ((Message.sender_id == user_id) | (Message.receiver_id == user_id))
    ).order_by(Message.timestamp).all()
    db.close()
    return [MessageRead.from_orm(m) for m in messages]

@router.post("/{message_id}/read")
def mark_message_read(message_id: int):
    db = SessionLocal()
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        db.close()
        raise HTTPException(status_code=404, detail="Message not found")
    message.read = True
    db.commit()
    db.close()
    return {"detail": "Message marked as read"} 