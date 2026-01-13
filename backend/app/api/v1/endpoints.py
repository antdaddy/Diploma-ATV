from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from typing import List
from datetime import datetime, timedelta

from ... import schemas, models
from ...database import get_db
from ...services.email_service import generate_temp_email

router = APIRouter()

@router.post("/email", response_model=schemas.EmailAccount)
def create_temp_email_account(db: Session = Depends(get_db)):
    """
    Создать новый временный почтовый ящик
    """
    # Генерируем уникальный email
    email_address = generate_temp_email()
    
    # Рассчитываем срок истечения (например, +24 часа)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Создаём запись в БД
    db_account = models.EmailAccount(
        email=email_address,
        expires_at=expires_at  # <-- Добавляем expires_at
    )
    
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    return db_account

@router.get("/email/{email_id}", response_model=schemas.EmailAccount)
def get_email_account(email_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить информацию о почтовом ящике
    """
    account = db.query(models.EmailAccount).filter(models.EmailAccount.id == email_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    return account

@router.delete("/email/{email_id}")
def delete_email_account(email_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Удалить почтовый ящик и все связанные письма
    """
    account = db.query(models.EmailAccount).filter(models.EmailAccount.id == email_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Удаляем все сообщения
    db.query(models.EmailMessage).filter(models.EmailMessage.email_account_id == email_id).delete()
    
    # Удаляем аккаунт
    db.delete(account)
    db.commit()
    
    return {"message": "Email account deleted successfully"}

@router.get("/email/{email_id}/messages", response_model=List[schemas.EmailMessage])
def get_messages(email_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить все письма для указанного ящика
    """
    # Проверяем существование аккаунта
    account = db.query(models.EmailAccount).filter(models.EmailAccount.id == email_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    messages = db.query(models.EmailMessage)\
        .filter(models.EmailMessage.email_account_id == email_id)\
        .order_by(models.EmailMessage.received_at.desc())\
        .all()
    return messages

@router.get("/messages/{message_id}", response_model=schemas.EmailMessage)
def get_message(message_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Получить конкретное письмо по ID
    """
    message = db.query(models.EmailMessage).filter(models.EmailMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message

@router.get("/email/by-address/{email_address}", response_model=schemas.EmailAccount)
def get_email_account_by_address(email_address: str, db: Session = Depends(get_db)):
    """
    Получить почтовый ящик по email адресу
    """
    account = db.query(models.EmailAccount).filter(models.EmailAccount.email == email_address).first()
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    return account