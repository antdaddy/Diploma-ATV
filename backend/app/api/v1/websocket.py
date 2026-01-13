from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import Set
import uuid
import json
import logging

from ...database import get_db
from ...models import EmailAccount

logger = logging.getLogger(__name__)

router = APIRouter()

# Хранение активных WebSocket соединений: {email_account_id: Set[WebSocket]}
active_connections: dict[str, Set[WebSocket]] = {}

def get_db_sync():
    """Синхронная функция для получения БД"""
    from ...database import SessionLocal
    return SessionLocal()

@router.websocket("/ws/{email_id}")
async def websocket_endpoint(websocket: WebSocket, email_id: str):
    """
    WebSocket endpoint для real-time уведомлений о новых письмах
    """
    await websocket.accept()
    
    try:
        # Проверяем существование email аккаунта
        db = get_db_sync()
        try:
            account = db.query(EmailAccount).filter(
                EmailAccount.id == uuid.UUID(email_id)
            ).first()
            
            if not account:
                await websocket.close(code=1008, reason="Email account not found")
                return
            
            # Добавляем подключение
            if email_id not in active_connections:
                active_connections[email_id] = set()
            active_connections[email_id].add(websocket)
            
            logger.info(f"WebSocket подключен для email_id: {email_id}")
            
            # Отправляем подтверждение подключения
            await websocket.send_json({
                "type": "connected",
                "email_id": email_id,
                "email": account.email
            })
            
            # Синхронизируем с глобальным словарем для SMTP сервера
            from ...services.smtp_server import websocket_connections
            if email_id not in websocket_connections:
                websocket_connections[email_id] = []
            websocket_connections[email_id].append(websocket)
            
            # Ждем сообщений от клиента (ping/pong)
            while True:
                try:
                    data = await websocket.receive_text()
                    # Обработка ping сообщений
                    if data == "ping":
                        await websocket.send_text("pong")
                except WebSocketDisconnect:
                    break
                    
        except Exception as e:
            logger.error(f"Ошибка WebSocket: {str(e)}")
            await websocket.close(code=1011, reason=str(e))
        finally:
            db.close()
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket отключен для email_id: {email_id}")
    except Exception as e:
        logger.error(f"Ошибка WebSocket соединения: {str(e)}")
    finally:
        # Удаляем подключение
        if email_id in active_connections:
            active_connections[email_id].discard(websocket)
            if not active_connections[email_id]:
                del active_connections[email_id]
        
        # Удаляем из глобального словаря SMTP сервера
        from ...services.smtp_server import websocket_connections
        if email_id in websocket_connections:
            try:
                websocket_connections[email_id].remove(websocket)
                if not websocket_connections[email_id]:
                    del websocket_connections[email_id]
            except ValueError:
                pass