from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .database import Base

class EmailAccount(Base):
    __tablename__ = "email_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # <-- Делаем nullable=True
    is_active = Column(Boolean, default=True)
    
class EmailMessage(Base):
    __tablename__ = "email_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email_account_id = Column(UUID(as_uuid=True), ForeignKey("email_accounts.id"))
    sender = Column(String(255), nullable=False)
    recipient = Column(String(255), nullable=False)
    subject = Column(Text)
    body_text = Column(Text)
    body_html = Column(Text)
    received_at = Column(DateTime(timezone=True), server_default=func.now())