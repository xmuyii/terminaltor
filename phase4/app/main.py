import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from phase4.app.api.v1.router import api_v1_router
from phase4.app.config import settings

app = FastAPI(
    title="Sovereign Academy LMS - Phase 4 API",
    description="Multi-timeframe Leaderboards (Daily, Weekly, Monthly, All-Time), Code Execution Engine, and Profile Services.",
    version="4.0.0",
)

# CORS Middleware (Railway, localhost, and external platform origins)
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Readiness checks for Railway
@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "phase": 4,
        "features": [
            "multi_timeframe_leaderboards",
            "redis_caching",
            "deterministic_pagination",
            "ast_anti_cheat",
            "sliding_window_rate_limiter",
        ],
    }

# Mount Phase 4 API Router
app.include_router(api_v1_router)

# Mount Frontend static build if present (for single-container Railway full-stack deploy)
root_dir = Path(__file__).resolve().parent.parent.parent
dist_dir = root_dir / "dist"
assets_dir = dist_dir / "assets"

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

@app.get("/", include_in_schema=False)
async def serve_frontend_root():
    index_file = dist_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "service": "Sovereign Academy LMS API",
        "version": "Phase 4",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "leaderboard": "/api/v1/leaderboard/{timeframe}",
            "challenges": "/api/v1/challenges",
            "execute": "/api/v1/execute",
            "profile": "/api/v1/profile/me",
        },
    }
