from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None

class TicketRead(TicketBase):
    id: int
    creator_id: int
    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True 