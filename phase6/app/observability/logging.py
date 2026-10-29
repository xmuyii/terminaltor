import json
import logging
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from phase6.app.observability.tracing import get_current_request_id

class JSONFormatter(logging.Formatter):
    """Structured JSON formatter with correlation request_id, timestamp, level, and caller metadata."""
    def format(self, record: logging.LogRecord) -> str:
        req_id = getattr(record, "request_id", None) or get_current_request_id()
        log_payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": req_id or "",
        }
        if hasattr(record, "user_id"):
            log_payload["user_id"] = record.user_id
        if hasattr(record, "route"):
            log_payload["route"] = record.route
        if hasattr(record, "latency_ms"):
            log_payload["latency_ms"] = record.latency_ms
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_payload)

class TextFormatter(logging.Formatter):
    """Human-readable dev formatter with request_id prefix."""
    def format(self, record: logging.LogRecord) -> str:
        req_id = getattr(record, "request_id", None) or get_current_request_id()
        prefix = f"[{req_id[:8]}] " if req_id else ""
        base = super().format(record)
        return f"{prefix}{base}"

def configure_logging(log_level: str = "INFO", log_format: str = "json"):
    root_logger = logging.getLogger()
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger.setLevel(numeric_level)

    # Clear existing handlers
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setLevel(numeric_level)

    if log_format.lower() == "json":
        stream_handler.setFormatter(JSONFormatter())
    else:
        fmt = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
        stream_handler.setFormatter(TextFormatter(fmt))

    root_logger.addHandler(stream_handler)

def get_logger(name: str):
    return logging.getLogger(name)
