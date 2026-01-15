#!/usr/bin/env python3
# backend/test_integration.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import smtplib
import time
from email.message import EmailMessage

API_BASE = "http://localhost:8000/api/v1"

print("=" * 60)
print("ИНТЕГРАЦИОННЫЙ ТЕСТ ПМ АТВ")
print("=" * 60)

try:
    # 1. Создаём временный email
    print("\n1. 🆕 Создаю временный email...")
    response = requests.post(f"{API_BASE}/email", timeout=10)
    
    if response.status_code != 200:
        print(f"❌ Ошибка создания email ({response.status_code}): {response.text[:100]}")
        sys.exit(1)
    
    email_account = response.json()
    email_id = email_account["id"]
    email_address = email_account["email"]
    print(f"✅ Создан email: {email_address}")
    print(f"   ID: {email_id}")

    # 2. Отправляем тестовое письмо
    print("\n2. 📤 Отправляю тестовое письмо на SMTP порт 1025...")
    msg = EmailMessage()
    msg['Subject'] = 'Интеграционный тест ПМ АТВ'
    msg['From'] = 'integration-test@sender.com'
    msg['To'] = email_address
    msg.set_content('Это письмо отправлено для тестирования системы.')
    
    try:
        with smtplib.SMTP('localhost', 1025, timeout=10) as server:
            server.send_message(msg)
        print("✅ Письмо отправлено на SMTP сервер")
    except ConnectionRefusedError:
        print("❌ SMTP сервер не отвечает на порту 1025")
        print("   Запусти: python3 -m app.services.smtp_server")
    except Exception as e:
        print(f"❌ Ошибка SMTP: {e}")

    # 3. Ждём обработки письма
    print("\n3. ⏳ Жду обработки письма...")
    time.sleep(3)

    # 4. Проверяем полученные письма
    print("\n4. 📨 Проверяю полученные письма через API...")
    try:
        response = requests.get(f"{API_BASE}/email/{email_id}/messages", timeout=10)
        if response.status_code == 200:
            messages = response.json()
            if isinstance(messages, list):
                print(f"✅ Получено писем: {len(messages)}")
                if messages:
                    for i, msg in enumerate(messages, 1):
                        print(f"   {i}. '{msg.get('subject', 'Без темы')}' от {msg.get('sender', 'Неизвестно')}")
                else:
                    print("   (пока нет писем)")
            else:
                print(f"⚠️ Неожиданный ответ: {messages}")
        else:
            print(f"❌ Ошибка API ({response.status_code}): {response.text[:100]}")
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")

    # 5. Удаляем тестовый ящик
    print("\n5. 🗑️ Удаляю тестовый ящик...")
    try:
        response = requests.delete(f"{API_BASE}/email/{email_id}", timeout=10)
        if response.status_code == 200:
            print("✅ Ящик удалён")
        else:
            print(f"⚠️ Не удалось удалить: {response.text[:100]}")
    except Exception as e:
        print(f"❌ Ошибка удаления: {e}")

except KeyboardInterrupt:
    print("\n\n⚠️ Тест прерван пользователем")
except Exception as e:
    print(f"\n❌ Неожиданная ошибка: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("ТЕСТ ЗАВЕРШЁН")
print("=" * 60)