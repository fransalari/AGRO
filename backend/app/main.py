from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.services.catalog import catalog


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings.sessions_dir.mkdir(parents=True, exist_ok=True)
    settings.index_dir.mkdir(parents=True, exist_ok=True)
    # Load existing index if present; full build is triggered via /api/index/rebuild
    try:
        catalog.ensure_ready(force=False)
    except Exception as exc:  # noqa: BLE001
        print(f"[AGRO] Index not ready: {exc}")
    yield


app = FastAPI(title="AGRO Muestreo Dirigido", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "AGRO — Muestreo Dirigido",
        "docs": "/docs",
        "health": "/api/health",
    }
