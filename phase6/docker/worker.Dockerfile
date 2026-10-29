# ==============================================================================
# Sovereign Academy LMS — Queue Worker Service Dockerfile
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies & Docker CLI for running sandbox containers
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "arq", "phase6.app.queue.worker.WorkerSettings"]
