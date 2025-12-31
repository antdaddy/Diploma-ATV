#!/usr/bin/env python3
# backend/create_tables.py
from app.database import engine, Base
from app.models import EmailAccount, EmailMessage

print("Создание таблиц в базе данных...")

# Создаём все таблицы, определённые в Base
Base.metadata.create_all(bind=engine)

print("✅ Таблицы созданы успешно!")
print("Созданы таблицы:")
print("  - email_accounts")
print("  - email_messages")