#!/bin/bash
# Скрипт для запуска Docker контейнеров

cd "$(dirname "$0")/docker"

echo "Запускаю PostgreSQL в Docker..."
docker-compose up -d

echo ""
echo "Проверяю статус контейнеров..."
docker-compose ps

echo ""
echo "✅ PostgreSQL должен быть доступен на localhost:5432"
echo "Для просмотра логов: docker-compose logs -f postgres"
echo "Для остановки: docker-compose down"