from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.db.database import Base, engine
from app.api.routes import auth, tasks, users
from app import models  # noqa: F401 — import agar tabel terbentuk

# Buat tabel otomatis (untuk assessment; di produksi gunakan Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Secure Task & Report Portal",
    description="Internal portal PT Mitsubishi Logistics Indonesia",
    version="1.0.0",
)

# Rate limiter
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Terlalu banyak percobaan. Coba lagi dalam 15 menit."},
    )

app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(users.router)

@app.get("/")
def health():
    return {"status": "ok", "service": "Secure Task & Report Portal"}