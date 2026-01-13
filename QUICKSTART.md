# Быстрый старт ПМ АТВ

## Шаг 1: Настройка базы данных

### Вариант А: Использование Docker (рекомендуется)
```bash
cd docker
docker-compose up -d
```

### Вариант Б: Локальная установка PostgreSQL
```bash
createdb atv_db
# Или через psql:
# psql -U postgres
# CREATE DATABASE atv_db;
# CREATE USER atv_user WITH PASSWORD 'atv_password';
# GRANT ALL PRIVILEGES ON DATABASE atv_db TO atv_user;
```

## Шаг 2: Настройка бэкенда

```bash
cd backend

# Создайте виртуальное окружение
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл (опционально, используются значения по умолчанию)
# DATABASE_URL=postgresql://atv_user:atv_password@localhost:5432/atv_db
# SMTP_HOST=0.0.0.0
# SMTP_PORT=1025
# API_HOST=0.0.0.0
# API_PORT=8000
# EMAIL_TTL_HOURS=24

# Запустите сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Сервер будет доступен по адресу: http://localhost:8000
API документация: http://localhost:8000/docs

## Шаг 3: Установка браузерного расширения

1. Откройте Chrome/Edge
2. Перейдите на `chrome://extensions/` или `edge://extensions/`
3. Включите "Режим разработчика" (Developer mode)
4. Нажмите "Загрузить распакованное расширение" (Load unpacked)
5. Выберите папку `extension/` из проекта

## Шаг 4: Тестирование

### Тест 1: Создание временного email через API
```bash
curl -X POST http://localhost:8000/api/v1/email
```

### Тест 2: Отправка тестового письма
```bash
cd backend
python test_email.py <email-address>
# Пример: python test_email.py abc123@temp.atv.local
```

### Тест 3: Использование расширения
1. Откройте любую страницу с формой
2. Нажмите на иконку расширения
3. Нажмите "Сгенерировать данные"
4. Нажмите "Создать email"
5. Нажмите "Заполнить форму на странице"

## Проверка работы

- ✅ Бэкенд запущен: http://localhost:8000/health
- ✅ SMTP сервер работает: порт 1025
- ✅ Расширение установлено и видно в браузере
- ✅ WebSocket подключение работает (статус в popup)

## Устранение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в .env

### SMTP сервер не запускается
- Проверьте, что порт 1025 свободен
- Попробуйте изменить SMTP_PORT в .env

### Расширение не работает
- Проверьте консоль браузера (F12)
- Убедитесь, что расширение имеет разрешения для localhost:8000
- Проверьте, что бэкенд запущен

### WebSocket не подключается
- Проверьте, что сервер доступен по ws://localhost:8000
- Проверьте консоль браузера на ошибки