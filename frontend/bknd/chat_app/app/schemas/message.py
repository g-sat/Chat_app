from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str
    receiver_id: Optional[int] = None
    ticket_id: Optional[int] = None

class MessageCreate(MessageBase):
    pass

class MessageRead(MessageBase):
    id: int
    sender_id: int
    timestamp: datetime
    read: bool

    class Config:
        from_attributes = True 