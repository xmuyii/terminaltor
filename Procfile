web: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
worker: python3 phase4/scripts/refresh_leaderboards.py --loop --interval 300
