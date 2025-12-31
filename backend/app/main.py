from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.v1.endpoints import router as api_router

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