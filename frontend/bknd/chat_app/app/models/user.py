from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Table, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ticket relationships
    created_tickets = relationship("Ticket", foreign_keys="[Ticket.creator_id]", back_populates="creator")
    assigned_tickets = relationship("Ticket", foreign_keys="[Ticket.assignee_id]", back_populates="assignee")
    
    # Friend request relationships
    sent_requests = relationship("FriendRequest", foreign_keys="[FriendRequest.sender_id]", back_populates="sender")
    received_requests = relationship("FriendRequest", foreign_keys="[FriendRequest.receiver_id]", back_populates="receiver")

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="PENDING")  # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class UserContact(Base):
    __tablename__ = "user_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id]) 