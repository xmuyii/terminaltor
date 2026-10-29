import asyncio
import json
import time
from typing import Any, AsyncGenerator, Dict, Optional

from phase6.app.config import settings
from phase6.app.observability.logging import get_logger
from phase6.app.queue.client import queue_client

logger = get_logger("phase6.services.submissions")

async def get_submission_status(job_id: str, requesting_user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves current job status/result, enforcing owner verification."""
    data = await queue_client.fetch_result(job_id)
    if not data:
        return None

    # Owner verification check
    owner_id = str(data.get("user_id", ""))
    if owner_id and owner_id != str(requesting_user_id):
        return {"error": "forbidden", "status": "forbidden"}

    return data


async def stream_submission_sse(job_id: str, requesting_user_id: str) -> AsyncGenerator[str, None]:
    """Generates Server-Sent Events (SSE) for job lifecycle:
    - event: status data: {"status": "running"}
    - event: progress data: {"tests_done": 3, "tests_total": 5}
    - event: complete data: <ExecuteResult>
    - event: error data: {"error": "..."}
    Closes after 60s timeout if no terminal event arrives.
    """
    start_time = time.time()
    stream_timeout = 60.0

    # Initial status event
    initial = await queue_client.fetch_result(job_id)
    if initial:
        if str(initial.get("user_id", "")) not in ("", str(requesting_user_id)):
            yield f"event: error\ndata: {json.dumps({'error': 'Unauthorized access to job'})}\n\n"
            return

        current_status = initial.get("status", "queued")
        if current_status in ("complete", "failed"):
            event_name = "complete" if current_status == "complete" else "error"
            yield f"event: {event_name}\ndata: {json.dumps(initial)}\n\n"
            return
        else:
            yield f"event: status\ndata: {json.dumps({'status': current_status})}\n\n"

    # Poll status with sub-second interval
    while time.time() - start_time < stream_timeout:
        await asyncio.sleep(0.5)
        current = await queue_client.fetch_result(job_id)
        if not current:
            continue

        status = current.get("status")
        if status == "running":
            yield f"event: status\ndata: {json.dumps({'status': 'running'})}\n\n"
        elif status == "complete":
            yield f"event: complete\ndata: {json.dumps(current)}\n\n"
            return
        elif status == "failed":
            yield f"event: error\ndata: {json.dumps({'error': current.get('error', 'Execution failed')})}\n\n"
            return

    # Timeout safety net
    yield f"event: error\ndata: {json.dumps({'error': 'Execution timeout: no result arrived within 60s'})}\n\n"
