from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
import uuid

class EmailAccountBase(BaseModel):
    email: str

class EmailAccountCreate(EmailAccountBase):
    pass

class EmailAccount(EmailAccountBase):
    id: uuid.UUID
    created_at: datetime
    expires_at: Optional[datetime] = None  # <-- Делаем опциональным
    is_active: bool
    
    class Config:
        from_attributes = True

class EmailMessageBase(BaseModel):
    sender: str
    recipient: str
    subject: Optional[str] = None

class EmailMessageCreate(EmailMessageBase):
    body_text: Optional[str] = None
    body_html: Optional[str] = None

class EmailMessage(EmailMessageCreate):
    id: uuid.UUID
    email_account_id: uuid.UUID
    received_at: datetime
    
    class Config:
        from_attributes = True