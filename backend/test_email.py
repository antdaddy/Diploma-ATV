#!/usr/bin/env python3
"""
Скрипт для тестирования отправки писем на временный email
Использование: python test_email.py <email-address>
Пример: python test_email.py test123@temp.atv.local
"""
import sys
import smtplib
from email.message import EmailMessage

def send_test_email(recipient_email: str):
    """Отправить тестовое письмо на временный email"""
    
    msg = EmailMessage()
    msg['From'] = 'test@example.com'
    msg['To'] = recipient_email
    msg['Subject'] = 'Тестовое письмо от ПМ АТВ'
    
    body = """
    Это тестовое письмо для проверки работы системы.
    
    Содержимое письма:
    - Текстовая часть
    - HTML версия (если поддерживается)
    
    С уважением,
    Система тестирования ПМ АТВ
    """
    
    msg.set_content(body)
    
    # Добавляем HTML версию
    html_body = """
    <html>
      <body>
        <h2>Тестовое письмо от ПМ АТВ</h2>
        <p>Это тестовое письмо для проверки работы системы.</p>
        <ul>
          <li>Текстовая часть</li>
          <li>HTML версия</li>
        </ul>
        <p><strong>С уважением,</strong><br>Система тестирования ПМ АТВ</p>
      </body>
    </html>
    """
    msg.add_alternative(html_body, subtype='html')
    
    try:
        # Подключаемся к SMTP серверу
        smtp = smtplib.SMTP('localhost', 1025)
        smtp.send_message(msg)
        smtp.quit()
        print(f"✅ Письмо успешно отправлено на {recipient_email}")
    except Exception as e:
        print(f"❌ Ошибка отправки письма: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python test_email.py <email-address>")
        print("Пример: python test_email.py test123@temp.atv.local")
        sys.exit(1)
    
    recipient = sys.argv[1]
    send_test_email(recipient)