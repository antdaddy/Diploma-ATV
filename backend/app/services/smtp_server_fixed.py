import asyncio
import logging
from aiosmtpd.controller import Controller
from aiosmtpd.smtp import SMTP
from email.parser import BytesParser
from email.policy import default
import psycopg2
from datetime import datetime
import sys
import os

# Добавляем текущую директорию в путь Python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def save_email_to_db(sender, recipient, subject, body_text, body_html=""):
    """Сохраняет письмо в PostgreSQL"""
    try:
        import uuid  # <-- ДОБАВЬ ЭТУ СТРОКУ
        
        # Подключаемся к БД
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="atv_db",
            user="atv_user",
            password="atv_password"
        )
        cursor = conn.cursor()
        
        # 1. Ищем ящик получателя
        cursor.execute(
            "SELECT id FROM email_accounts WHERE email = %s",
            (recipient,)
        )
        account = cursor.fetchone()
        
        if not account:
            print(f"❌ Ящик не найден в БД: {recipient}")
            
            # Покажем какие ящики есть
            cursor.execute("SELECT email FROM email_accounts LIMIT 5")
            emails = [row[0] for row in cursor.fetchall()]
            print(f"   Доступные ящики: {emails}")
            
            conn.close()
            return False
        
        account_id = account[0]
        print(f"✅ Ящик найден! ID: {account_id}")
        
        # 2. Генерируем UUID для письма
        message_id = str(uuid.uuid4())
        print(f"📝 Генерируем ID письма: {message_id}")
        
        # 3. Сохраняем письмо (ВКЛЮЧАЯ id)
        cursor.execute("""
            INSERT INTO email_messages 
            (id, email_account_id, sender, recipient, subject, body_text, body_html, received_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (message_id, account_id, sender, recipient, subject, body_text, body_html, datetime.utcnow()))
        
        saved_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"💾 Письмо сохранено! ID: {saved_id}")
        print(f"   От: {sender}")
        print(f"   Кому: {recipient}")
        print(f"   Тема: {subject}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"🔥 Ошибка БД: {e}")
        import traceback
        traceback.print_exc()
        return False

class SimpleHandler:
    async def handle_DATA(self, server: SMTP, session, envelope):
        """Обработка входящих email сообщений"""
        try:
            print(f"\n" + "="*50)
            print("📨 ПОЛУЧЕНО НОВОЕ ПИСЬМО!")
            print("="*50)
            print(f"   Отправитель: {envelope.mail_from}")
            print(f"   Получатели: {envelope.rcpt_tos}")
            print(f"   Размер: {len(envelope.content)} байт")
            
            # Парсим письмо
            msg = BytesParser(policy=default).parsebytes(envelope.content)
            subject = msg.get('subject', 'Без темы')
            print(f"   Тема: {subject}")
            
            # Извлекаем тело письма
            body_text = ""
            body_html = ""
            
            if msg.is_multipart():
                for part in msg.iter_parts():
                    if part.get_content_type() == 'text/plain':
                        body_text = part.get_content()
                    elif part.get_content_type() == 'text/html':
                        body_html = part.get_content()
            else:
                body_text = msg.get_content()
            
            # Сохраняем каждому получателю
            success_count = 0
            for recipient in envelope.rcpt_tos:
                print(f"\n🔍 Обрабатываю получателя: {recipient}")
                if save_email_to_db(
                    sender=envelope.mail_from,
                    recipient=recipient,
                    subject=subject,
                    body_text=body_text,
                    body_html=body_html
                ):
                    success_count += 1
            
            print(f"\n✅ Обработка завершена. Сохранено писем: {success_count}/{len(envelope.rcpt_tos)}")
            print("="*50 + "\n")
            
            return '250 Message accepted for delivery'
            
        except Exception as e:
            print(f"🔥 Критическая ошибка: {e}")
            import traceback
            traceback.print_exc()
            return '500 Internal server error'

def main():
    """Запуск SMTP сервера"""
    print("🚀 ЗАПУСК SMTP СЕРВЕРА")
    print("Порт: 1025")
    print("Для остановки нажмите Ctrl+C\n")
    
    handler = SimpleHandler()
    controller = Controller(
        handler,
        hostname='0.0.0.0',
        port=1025
    )
    
    controller.start()
    
    try:
        # Бесконечный цикл
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("\n\n⏹️ Остановка сервера...")
        controller.stop()

if __name__ == "__main__":
    main()