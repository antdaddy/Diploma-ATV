#!/usr/bin/env python3
# backend/init_db_alchemy.py
from sqlalchemy import create_engine, text
import sys

def init_database():
    print("🔧 Начинаем инициализацию базы данных через SQLAlchemy...")
    
    DATABASE_URL = "postgresql://atv_user:atv_password@localhost:5432/atv_db"
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Выполняем команды по одной
            commands = [
                text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'),
                text('''
                CREATE TABLE IF NOT EXISTS email_accounts (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                )
                '''),
                text('''
                CREATE TABLE IF NOT EXISTS email_messages (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email_account_id UUID REFERENCES email_accounts(id),
                    sender VARCHAR(255) NOT NULL,
                    recipient VARCHAR(255) NOT NULL,
                    subject TEXT,
                    body_text TEXT,
                    body_html TEXT,
                    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
                '''),
                text('CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email)'),
                text('CREATE INDEX IF NOT EXISTS idx_email_messages_account ON email_messages(email_account_id)'),
            ]
            
            for i, cmd in enumerate(commands, 1):
                print(f"Выполняем команду {i}/{len(commands)}...")
                connection.execute(cmd)
                connection.commit()  # Коммитим каждую команду
            
            print("✅ Все таблицы созданы!")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()