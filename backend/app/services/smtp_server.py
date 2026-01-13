import asyncio
import logging
from aiosmtpd.controller import Controller
from aiosmtpd.handlers import Message
from email.message import EmailMessage
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import SessionLocal
from ..models import EmailAccount, EmailMessage as EmailMessageModel
from .email_parser import parse_email_message

logger = logging.getLogger(__name__)

# Глобальный словарь для хранения WebSocket соединений
websocket_connections = {}

class EmailHandler(Message):
    """
    Обработчик входящих SMTP сообщений
    """
    async def handle_message(self, message: EmailMessage):
        try:
            # Получаем получателя
            recipient = message.get("To", "")
            if not recipient:
                logger.warning("Получено письмо без получателя")
                return
            
            # Извлекаем email адрес из формата "Name <email@domain.com>"
            recipient_email = recipient
            if "<" in recipient and ">" in recipient:
                recipient_email = recipient.split("<")[1].split(">")[0].strip()
            
            db: Session = SessionLocal()
            try:
                # Ищем почтовый ящик
                account = db.query(EmailAccount).filter(
                    EmailAccount.email == recipient_email
                ).first()
                
                if not account:
                    logger.warning(f"Получено письмо на несуществующий ящик: {recipient_email}")
                    return
                
                # Конвертируем EmailMessage в bytes для парсинга
                raw_message = bytes(message.as_string(), encoding='utf-8')
                
                # Парсим сообщение
                parsed = parse_email_message(raw_message)
                
                # Сохраняем в БД
                db_message = EmailMessageModel(
                    email_account_id=account.id,
                    sender=parsed["sender"],
                    recipient=parsed["recipient"],
                    subject=parsed["subject"],
                    body_text=parsed["body_text"],
                    body_html=parsed["body_html"],
                    received_at=parsed["received_at"] or datetime.utcnow()
                )
                
                db.add(db_message)
                db.commit()
                db.refresh(db_message)
                
                logger.info(f"Сообщение сохранено: {db_message.id} для {recipient_email}")
                
                # Отправляем уведомление через WebSocket, если есть подключение
                await notify_websocket_clients(account.id, db_message.id)
                
            except Exception as e:
                logger.error(f"Ошибка при сохранении письма: {str(e)}")
                db.rollback()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Ошибка обработки письма: {str(e)}")

async def notify_websocket_clients(email_account_id, message_id):
    """
    Уведомление всех WebSocket клиентов о новом письме
    """
    email_id_str = str(email_account_id)
    if email_id_str in websocket_connections:
        for websocket in websocket_connections[email_id_str]:
            try:
                await websocket.send_json({
                    "type": "new_message",
                    "email_account_id": email_id_str,
                    "message_id": str(message_id)
                })
            except Exception as e:
                logger.error(f"Ошибка отправки WebSocket уведомления: {str(e)}")

class SMTPServer:
    """
    SMTP сервер для приема входящих писем
    """
    def __init__(self, host: str = "0.0.0.0", port: int = 1025):
        self.host = host
        self.port = port
        self.controller = None
    
    def start(self):
        """Запуск SMTP сервера"""
        handler = EmailHandler()
        self.controller = Controller(handler, hostname=self.host, port=self.port)
        self.controller.start()
        logger.info(f"SMTP сервер запущен на {self.host}:{self.port}")
    
    def stop(self):
        """Остановка SMTP сервера"""
        if self.controller:
            self.controller.stop()
            logger.info("SMTP сервер остановлен")

# Глобальный экземпляр сервера
smtp_server = None

def get_smtp_server() -> SMTPServer:
    """Получить глобальный экземпляр SMTP сервера"""
    global smtp_server
    if smtp_server is None:
        from ..core.config import settings
        smtp_server = SMTPServer(host=settings.SMTP_HOST, port=settings.SMTP_PORT)
    return smtp_server