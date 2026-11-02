import time
from typing import Any, Callable

try:
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request
    from starlette.responses import Response
except ImportError:
    class BaseHTTPMiddleware:
        def __init__(self, app=None):
            self.app = app
    class Request:
        pass
    class Response:
        pass

from phase6.app.observability.logging import get_logger
from phase6.app.observability.metrics import (
    http_requests_total,
    http_request_duration_seconds,
)
from phase6.app.observability.tracing import set_current_request_id

logger = get_logger("phase6.middleware")

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware to:
    1. Extract or assign X-Request-ID correlation header.
    2. Set contextual request ID in logging context.
    3. Measure request duration and record Prometheus metrics.
    4. Attach X-Request-ID response header.
    """
    async def dispatch(self, request: Any, call_next: Callable) -> Any:
        start_time = time.perf_counter()
        incoming_req_id = getattr(request, "headers", {}).get("X-Request-ID")
        req_id = set_current_request_id(incoming_req_id)

        method = getattr(request, "method", "GET")
        route = getattr(getattr(request, "url", None), "path", "/")

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time
            status_code = str(getattr(response, "status_code", 200))

            # Observe prometheus metrics
            try:
                http_requests_total.labels(method=method, route=route, status=status_code).inc()
                http_request_duration_seconds.labels(method=method, route=route, status=status_code).observe(duration)
            except Exception:
                pass

            if hasattr(response, "headers"):
                response.headers["X-Request-ID"] = req_id
            return response
        except Exception as exc:
            duration = time.perf_counter() - start_time
            try:
                http_requests_total.labels(method=method, route=route, status="500").inc()
                http_request_duration_seconds.labels(method=method, route=route, status="500").observe(duration)
            except Exception:
                pass
            raise exc
