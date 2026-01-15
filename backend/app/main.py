import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.v1.endpoints import router as api_router
from .api.v1.websocket import router as ws_router

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="ПМ АТВ API",
    description="Программный модуль для автоматизированного тестирования веб-форм",
    version="1.0.0"
)

# Настройка CORS для работы с расширением
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Пока для разработки, потом замени на домен расширения
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(ws_router)

@app.get("/")
def read_root():
    return {"message": "ПМ АТВ API работает! 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
def startup_event():
    from .database import Base, engine
    print("Создание таблиц при запуске...")
    Base.metadata.create_all(bind=engine)
    print("✅ Таблицы готовы")
    
    # Запускаем SMTP сервер ---- РАСКОММЕНТИТЬ
    #from .services.smtp_server import get_smtp_server
    #smtp = get_smtp_server()
    #smtp.start()
    #print(f"✅ SMTP сервер запущен на {settings.SMTP_HOST}:{settings.SMTP_PORT}")

@app.on_event("shutdown")
def shutdown_event():
    from .services.smtp_server import get_smtp_server
    smtp = get_smtp_server()
    smtp.stop()
    print("✅ SMTP сервер остановлен")