from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.instruction import router as instruction_router
from app.routers.tasks import router as tasks_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Voice Command API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(tasks_router)
    app.include_router(instruction_router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app: FastAPI = create_app()
