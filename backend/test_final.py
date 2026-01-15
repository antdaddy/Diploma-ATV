#!/usr/bin/env python3
import requests
import smtplib
import time
from email.message import EmailMessage
import json

print("=" * 60)
print("ФИНАЛЬНЫЙ ТЕСТ СИСТЕМЫ ПМ АТВ")
print("=" * 60)

# 1. Проверяем API
print("\n1. 🔌 Проверяем FastAPI...")
try:
    resp = requests.get("http://localhost:8000/health", timeout=5)
    if resp.status_code == 200:
        print("   ✅ FastAPI работает")
    else:
        print(f"   ❌ FastAPI ошибка: {resp.status_code}")
        exit(1)
except Exception as e:
    print(f"   ❌ FastAPI недоступен: {e}")
    exit(1)

# 2. Создаём тестовый ящик
print("\n2. 📬 Создаём временный email...")
try:
    resp = requests.post(
        "http://localhost:8000/api/v1/email",
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    if resp.status_code != 200:
        print(f"   ❌ Ошибка создания: {resp.status_code}")
        print(f"   Ответ: {resp.text}")
        exit(1)
    
    account = resp.json()
    test_email = account["email"]
    email_id = account["id"]
    
    print(f"   ✅ Создан: {test_email}")
    print(f"   ID: {email_id}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    exit(1)

# 3. Отправляем тестовое письмо
print("\n3. 📤 Отправляем письмо на SMTP порт 1025...")
msg = EmailMessage()
msg['Subject'] = 'ФИНАЛЬНЫЙ ТЕСТ ПМ АТВ'
msg['From'] = 'final-test@example.com'
msg['To'] = test_email
msg.set_content('Это финальное тестовое письмо для проверки работы всей системы.')

try:
    with smtplib.SMTP('localhost', 1025, timeout=10) as server:
        server.send_message(msg)
    print("   ✅ Письмо отправлено")
except ConnectionRefusedError:
    print("   ❌ SMTP сервер не отвечает на порту 1025")
    print("   Убедитесь что он запущен")
    exit(1)
except Exception as e:
    print(f"   ❌ Ошибка отправки: {e}")
    exit(1)

# 4. Ждём обработки
print("\n4. ⏳ Ждём обработки письма...")
time.sleep(3)

# 5. Проверяем через API
print("\n5. 📨 Проверяем полученные письма через API...")
try:
    resp = requests.get(
        f"http://localhost:8000/api/v1/email/{email_id}/messages",
        timeout=10
    )
    
    if resp.status_code == 200:
        messages = resp.json()
        if isinstance(messages, list):
            print(f"   ✅ Получено писем: {len(messages)}")
            if messages:
                for i, msg in enumerate(messages, 1):
                    print(f"   {i}. '{msg.get('subject', 'Без темы')}'")
                    print(f"      От: {msg.get('sender', 'Неизвестно')}")
                    print(f"      Время: {msg.get('received_at', 'Неизвестно')}")
                    print(f"      ID письма: {msg.get('id')}")
            else:
                print("   ⚠️ Писем нет (SMTP не сохранил в БД)")
        else:
            print(f"   ❌ Неожиданный формат ответа")
            print(f"   Ответ: {messages}")
    else:
        print(f"   ❌ Ошибка API: {resp.status_code}")
        print(f"   Ответ: {resp.text}")
        
except Exception as e:
    print(f"   ❌ Ошибка запроса: {e}")

# 6. Проверяем БД напрямую
print("\n6. 🗄️ Проверяем БД напрямую...")
try:
    import psycopg2
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="atv_db",
        user="atv_user",
        password="atv_password"
    )
    cursor = conn.cursor()
    
    # Всего писем
    cursor.execute("SELECT COUNT(*) FROM email_messages")
    total = cursor.fetchone()[0]
    print(f"   Всего писем в БД: {total}")
    
    # Наши письма
    cursor.execute(
        "SELECT COUNT(*) FROM email_messages WHERE recipient = %s",
        (test_email,)
    )
    our = cursor.fetchone()[0]
    print(f"   Писем для {test_email}: {our}")
    
    if our > 0:
        cursor.execute(
            "SELECT subject, sender, received_at FROM email_messages WHERE recipient = %s ORDER BY received_at DESC",
            (test_email,)
        )
        for subject, sender, received_at in cursor.fetchall():
            print(f"   📧 '{subject}'")
            print(f"      От: {sender}")
            print(f"      Время: {received_at}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"   ❌ Ошибка БД: {e}")

print("\n" + "=" * 60)
print("ТЕСТ ЗАВЕРШЁН")
print("=" * 60)
