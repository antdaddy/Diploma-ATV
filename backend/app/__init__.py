# backend/app/__init__.py
# Этот файл может быть пустым или содержать:
from .core.config import settings
from .database import Base, engine, SessionLocal
from .models import EmailAccount, EmailMessage