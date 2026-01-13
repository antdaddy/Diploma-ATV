#!/bin/bash
# Скрипт для запуска бэкенда на macOS

cd "$(dirname "$0")/backend"

# Проверка виртуального окружения
if [ ! -d "venv" ]; then
    echo "Создаю виртуальное окружение..."
    python3 -m venv venv
fi

# Активация виртуального окружения
source venv/bin/activate

# Установка зависимостей (если нужно)
if [ ! -f "venv/.installed" ]; then
    echo "Устанавливаю зависимости..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Запуск сервера
echo "Запускаю сервер на http://localhost:8000"
echo "Документация API: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000