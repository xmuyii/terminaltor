import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from phase2.app.api.v1.profile import router as profile_router
from phase3.app.api.v1.challenges import router as challenges_router
from phase4.app.api.v1.leaderboard import router as leaderboard_router
from phase6.app.api.v1.execute import router as execute_router
from phase6.app.api.v1.submissions import router as submissions_router
from phase6.app.config import settings
from phase6.app.observability.logging import configure_logging, get_logger
from phase6.app.observability.metrics import generate_latest, CONTENT_TYPE_LATEST
from phase6.app.observability.middleware import ObservabilityMiddleware
from phase6.app.queue.worker import start_worker_loop

# Configure structured logging
configure_logging(log_level=settings.LOG_LEVEL, log_format=settings.LOG_FORMAT)
logger = get_logger("phase6.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: start metrics, workers, and pre-warm sandbox checks."""
    logger.info("Initializing Sovereign Academy LMS (Phase 6 - Hardening & Scale)...")

    # Start local background worker loop if not using separate container
    worker_task = None
    try:
        worker_task = asyncio.create_task(start_worker_loop())
    except Exception as e:
        logger.warning(f"Could not start in-process background worker task: {e}")

    yield

    logger.info("Shutting down Sovereign Academy LMS Phase 6...")
    if worker_task:
        worker_task.cancel()


app = FastAPI(
    title="Sovereign Academy LMS",
    description="Automated Coding LMS API — Phase 6 Hardened & Scaled Architecture",
    version="6.0.0",
    lifespan=lifespan,
)

# 1. Observability Correlation & Metrics Middleware
app.add_middleware(ObservabilityMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# 3. Prometheus Metrics Endpoint
@app.get(settings.METRICS_PATH, tags=["observability"])
async def metrics_endpoint():
    """Exposes Prometheus text formatted metrics at configured path."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# 4. Include API v1 Routers
app.include_router(profile_router, prefix="/api/v1")
app.include_router(challenges_router, prefix="/api/v1")
app.include_router(execute_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(leaderboard_router, prefix="/api/v1")


# 5. Serve React frontend SPA in production if dist/ exists
dist_dir = Path(__file__).resolve().parent.parent.parent / "dist"
if not dist_dir.exists():
    dist_dir = Path("/dist")

if dist_dir.exists() and (dist_dir / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "name": "Sovereign Academy LMS",
            "phase": "Phase 6: Hardening & Scale",
            "status": "online",
            "metrics": settings.METRICS_PATH,
            "docs": "/docs",
        }
