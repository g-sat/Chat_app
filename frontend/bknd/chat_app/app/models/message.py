from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    read = Column(Boolean, default=False) 