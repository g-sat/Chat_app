from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
from datetime import datetime

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_USER = "WAITING_USER"
    CLOSED = "CLOSED"

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.NORMAL, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tickets")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tickets") 