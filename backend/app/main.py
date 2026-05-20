import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.database import Base, engine
from app.limiter import limiter
from app.routers import auth, etudiants, annonces, entreprises, club, validation, notifications
from app.routers.etudiants import cv_router

# Import all models so Alembic/SQLAlchemy sees them
import app.models  # noqa: F401

app = FastAPI(
    title="EnimConnect API",
    description="Plateforme de mise en relation étudiants-entreprises — ENSMR",
    version="1.0.0",
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — only allow configured frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve photos statically (not CVs — CVs are served via protected /api/cv/{id})
storage_path = settings.STORAGE_PATH
os.makedirs(os.path.join(storage_path, "cvs"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "photos"), exist_ok=True)
app.mount("/storage/photos", StaticFiles(directory=os.path.join(storage_path, "photos")), name="photos")

# Routers
app.include_router(auth.router)
app.include_router(etudiants.router)
app.include_router(cv_router)
app.include_router(annonces.router)
app.include_router(entreprises.router)
app.include_router(club.router)
app.include_router(validation.router)
app.include_router(validation.router, prefix="/api")  # JSON endpoints: /api/decision/{id}
app.include_router(notifications.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "EnimConnect API"}
