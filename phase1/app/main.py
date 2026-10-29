from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_v1_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Sovereign Academy LMS - Phase 1 API",
    description="Core code execution loop with isolated subprocess evaluation for kids and young developers.",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


# API v1 routes
app.include_router(api_v1_router)

# Mount static frontend
static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir), html=True), name="static")
