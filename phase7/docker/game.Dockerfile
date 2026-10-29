# ==============================================================================
# Sovereign Academy Arcade Game Server Dockerfile (Phase 7)
# High-concurrency WebSocket & State Machine Engine for Word Forge & Debugs Hunting
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python runtime packages
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt || true
RUN pip install --no-cache-dir fastapi uvicorn[standard] websockets redis asyncpg pyjwt

# Copy codebase
COPY . /app

# Compile word lists
RUN python3 -m phase7.game.wordlists.build || python3 phase7/game/wordlists/build.py

# Non-root unprivileged execution
RUN useradd -u 10001 -m gameuser
USER gameuser

EXPOSE 8001

CMD ["python3", "-m", "uvicorn", "phase7.game.main:app", "--host", "0.0.0.0", "--port", "8001"]
