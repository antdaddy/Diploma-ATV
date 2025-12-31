import secrets
import string
from datetime import datetime, timedelta
from ..core.config import settings

def generate_temp_email() -> str:
    """
    Генерация уникального временного email-адреса
    """
    # Генерируем случайную строку
    alphabet = string.ascii_lowercase + string.digits
    random_part = ''.join(secrets.choice(alphabet) for _ in range(10))
    
    # Используем домен приложения
    domain = "temp.atv.local"  # Временный домен
    
    return f"{random_part}@{domain}"

def calculate_expiry() -> datetime:
    """
    Рассчитать время истечения срока действия
    """
    return datetime.utcnow() + timedelta(hours=settings.EMAIL_TTL_HOURS)