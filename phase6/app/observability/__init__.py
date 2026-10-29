"""Observability package: Logging, Metrics, Tracing correlation, and FastAPI middleware."""
from phase6.app.observability.logging import configure_logging, get_logger
from phase6.app.observability.metrics import (
    http_requests_total,
    http_request_duration_seconds,
    execute_queue_depth,
    execute_job_duration_seconds,
    sandbox_container_start_seconds,
    sandbox_kills_total,
    redis_cache_hits_total,
    redis_cache_misses_total,
    leaderboard_query_duration_seconds,
    webhook_processing_duration_seconds,
    webhook_signature_failures_total,
)
from phase6.app.observability.tracing import get_current_request_id, set_current_request_id
from phase6.app.observability.middleware import ObservabilityMiddleware

__all__ = [
    "configure_logging",
    "get_logger",
    "http_requests_total",
    "http_request_duration_seconds",
    "execute_queue_depth",
    "execute_job_duration_seconds",
    "sandbox_container_start_seconds",
    "sandbox_kills_total",
    "redis_cache_hits_total",
    "redis_cache_misses_total",
    "leaderboard_query_duration_seconds",
    "webhook_processing_duration_seconds",
    "webhook_signature_failures_total",
    "get_current_request_id",
    "set_current_request_id",
    "ObservabilityMiddleware",
]
