# backend/app/core/config.py
import os
from dotenv import load_dotenv

load_dotenv()  # Загружаем переменные из .env

class Settings:
    # База данных
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://atv_user:atv_password@localhost:5432/atv_db")
    
    # SMTP сервер
    SMTP_HOST = os.getenv("SMTP_HOST", "0.0.0.0")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 1025))
    
    # Веб-сервер
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 8000))
    
    # Время жизни временной почты (в часах)
    EMAIL_TTL_HOURS = int(os.getenv("EMAIL_TTL_HOURS", 24))

settings = Settings()