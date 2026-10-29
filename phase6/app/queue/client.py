import asyncio
import json
import time
from typing import Any, Dict, Optional

from phase6.app.config import settings
from phase6.app.observability.logging import get_logger
from phase6.app.observability.metrics import execute_queue_depth
from phase6.app.queue.jobs import ExecuteJob, ExecuteResult

logger = get_logger("phase6.queue.client")

# In-memory queues & result stores for local test runner and development fallback
_MEMORY_QUEUE: asyncio.Queue = asyncio.Queue()
_MEMORY_RESULTS: Dict[str, Dict[str, Any]] = {}
_MEMORY_EXPIRY: Dict[str, float] = {}
_MEMORY_PROGRESS: Dict[str, list] = {}

class QueueClient:
    def __init__(self, redis_url: str = settings.REDIS_QUEUE_URL):
        self.redis_url = redis_url
        self._redis = None
        self._pool = None

    async def get_redis(self):
        if self._redis is None:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
                await self._redis.ping()
            except Exception as e:
                logger.warning(f"Could not connect to Redis at {self.redis_url}: {e}. Using resilient in-memory broker.")
                self._redis = None
        return self._redis

    async def enqueue_execute(self, job: ExecuteJob) -> str:
        """Enqueues an execution job. Returns job_id immediately."""
        r = await self.get_redis()
        if r:
            try:
                # Store pending job info
                payload = json.dumps(job.to_dict())
                await r.lpush("lms:execute_queue", payload)
                # Set initial queued status
                status_payload = {
                    "status": "queued",
                    "user_id": job.user_id,
                    "submitted_at": job.submitted_at,
                    "job_id": job.job_id
                }
                await r.set(f"status:{job.job_id}", json.dumps(status_payload), ex=settings.QUEUE_RESULT_TTL_SECONDS)
                
                # Update queue depth metric
                depth = await r.llen("lms:execute_queue")
                try:
                    execute_queue_depth.set(depth)
                except Exception:
                    pass
                return job.job_id
            except Exception as exc:
                logger.error(f"Redis enqueue failed: {exc}")
                raise exc
        else:
            # In-memory fallback
            await _MEMORY_QUEUE.put(job)
            _MEMORY_RESULTS[f"status:{job.job_id}"] = {
                "status": "queued",
                "user_id": job.user_id,
                "submitted_at": job.submitted_at,
                "job_id": job.job_id
            }
            try:
                execute_queue_depth.set(_MEMORY_QUEUE.qsize())
            except Exception:
                pass
            return job.job_id

    async def fetch_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Reads result from result:{job_id} or status from status:{job_id}."""
        r = await self.get_redis()
        if r:
            res_raw = await r.get(f"result:{job_id}")
            if res_raw:
                return json.loads(res_raw)
            status_raw = await r.get(f"status:{job_id}")
            if status_raw:
                return json.loads(status_raw)
            return None
        else:
            # Memory fallback
            now = time.time()
            if f"result:{job_id}" in _MEMORY_RESULTS:
                exp = _MEMORY_EXPIRY.get(f"result:{job_id}", float("inf"))
                if now > exp:
                    _MEMORY_RESULTS.pop(f"result:{job_id}", None)
                    return None
                return _MEMORY_RESULTS[f"result:{job_id}"]
            return _MEMORY_RESULTS.get(f"status:{job_id}")

    async def save_result(self, result: ExecuteResult, user_id: str = ""):
        """Stores ExecuteResult with TTL and marks status complete."""
        payload = {
            "status": "complete" if not result.error else "failed",
            "job_id": result.job_id,
            "submission_id": result.submission_id,
            "user_id": user_id,
            "passed": result.passed,
            "xp_awarded": result.xp_awarded,
            "new_badges": result.new_badges,
            "result": result.result,
            "profile": result.profile,
            "anti_cheat": result.anti_cheat,
            "error": result.error,
            "completed_at": result.completed_at
        }
        r = await self.get_redis()
        if r:
            payload_json = json.dumps(payload)
            await r.set(f"result:{result.job_id}", payload_json, ex=settings.QUEUE_RESULT_TTL_SECONDS)
            await r.set(f"status:{result.job_id}", payload_json, ex=settings.QUEUE_RESULT_TTL_SECONDS)
            # Publish event to pub/sub
            await r.publish(f"progress:{result.job_id}", json.dumps({
                "event": "complete" if not result.error else "error",
                "data": payload
            }))
        else:
            _MEMORY_RESULTS[f"result:{result.job_id}"] = payload
            _MEMORY_RESULTS[f"status:{result.job_id}"] = payload
            _MEMORY_EXPIRY[f"result:{result.job_id}"] = time.time() + settings.QUEUE_RESULT_TTL_SECONDS

    async def publish_progress(self, job_id: str, event: str, data: Dict[str, Any]):
        """Publishes progress events (e.g. running, test progress)."""
        r = await self.get_redis()
        payload = json.dumps({"event": event, "data": data})
        if r:
            try:
                await r.publish(f"progress:{job_id}", payload)
            except Exception:
                pass
        else:
            if job_id not in _MEMORY_PROGRESS:
                _MEMORY_PROGRESS[job_id] = []
            _MEMORY_PROGRESS[job_id].append((event, data))

queue_client = QueueClient()
