import email
from email.utils import parsedate_to_datetime
from typing import Optional, Tuple

def parse_email_message(raw_message: bytes) -> dict:
    """
    Парсинг входящего email сообщения
    """
    try:
        msg = email.message_from_bytes(raw_message)
        
        # Извлекаем заголовки
        sender = msg.get("From", "")
        recipient = msg.get("To", "")
        subject = msg.get("Subject", "")
        date_str = msg.get("Date", "")
        
        # Парсим дату
        received_at = None
        if date_str:
            try:
                received_at = parsedate_to_datetime(date_str)
            except:
                pass
        
        # Извлекаем тело письма
        body_text = None
        body_html = None
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                # Пропускаем вложения
                if "attachment" in content_disposition:
                    continue
                
                # Текстовое содержимое
                if content_type == "text/plain" and body_text is None:
                    try:
                        body_text = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    except:
                        pass
                elif content_type == "text/html" and body_html is None:
                    try:
                        body_html = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    except:
                        pass
        else:
            # Простое сообщение
            content_type = msg.get_content_type()
            payload = msg.get_payload(decode=True)
            if payload:
                try:
                    decoded = payload.decode("utf-8", errors="ignore")
                    if content_type == "text/html":
                        body_html = decoded
                    else:
                        body_text = decoded
                except:
                    pass
        
        return {
            "sender": sender,
            "recipient": recipient,
            "subject": subject,
            "body_text": body_text,
            "body_html": body_html,
            "received_at": received_at
        }
    except Exception as e:
        raise ValueError(f"Ошибка парсинга email: {str(e)}")