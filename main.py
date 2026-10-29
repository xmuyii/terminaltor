"""Root entrypoint for production deployments (Railway / Docker / Uvicorn)."""
from phase6.app.main import app

__all__ = ["app"]

