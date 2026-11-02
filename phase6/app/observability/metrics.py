"""Prometheus metrics registry and telemetry collectors."""
from typing import Dict, Any

try:
    from prometheus_client import (
        Counter,
        Gauge,
        Histogram,
        REGISTRY,
        generate_latest,
        CONTENT_TYPE_LATEST,
    )
    HAS_PROMETHEUS = True
except ImportError:
    HAS_PROMETHEUS = False
    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4; charset=utf-8"

    _FALLBACK_REGISTRY: Dict[str, Any] = {}

    class DummyMetric:
        def __init__(self, name, documentation, labelnames=None, buckets=None):
            self.name = name
            self.documentation = documentation
            self.labelnames = labelnames or []
            self.buckets = buckets
            self._value = 0
            self._samples = {}
            _FALLBACK_REGISTRY[name] = self

        def labels(self, *args, **kwargs):
            key = str(args) + str(kwargs)
            if key not in self._samples:
                self._samples[key] = 0
            child = DummyMetric(self.name, self.documentation)
            child._samples = self._samples
            child._current_key = key
            return child

        def inc(self, amount=1):
            self._value += amount
            if hasattr(self, "_current_key"):
                self._samples[self._current_key] = self._samples.get(self._current_key, 0) + amount

        def dec(self, amount=1):
            self._value -= amount

        def set(self, val):
            self._value = val

        def observe(self, val):
            self._value += val

    def Counter(name, doc, labelnames=None):
        return DummyMetric(name, doc, labelnames=labelnames)

    def Gauge(name, doc, labelnames=None):
        return DummyMetric(name, doc, labelnames=labelnames)

    def Histogram(name, doc, labelnames=None, buckets=None):
        return DummyMetric(name, doc, labelnames=labelnames, buckets=buckets)

    REGISTRY = None

    def generate_latest(registry=None) -> bytes:
        lines = []
        for name, metric in _FALLBACK_REGISTRY.items():
            lines.append(f"# HELP {name} {metric.documentation}")
            lines.append(f"# TYPE {name} gauge")
            lines.append(f"{name} {metric._value}")
            for k, v in metric._samples.items():
                lines.append(f"{name}_sample {v}")
        if not lines:
            lines.append("# HELP simulated_metrics Simulated Prometheus registry")
            lines.append("simulated_metrics 1")
        return ("\n".join(lines) + "\n").encode("utf-8")

# Standard Prometheus metrics (using default registry)
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests received",
    ["method", "route", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "route", "status"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
)

execute_queue_depth = Gauge(
    "execute_queue_depth",
    "Current number of pending execution jobs in arq Redis queue"
)

execute_job_duration_seconds = Histogram(
    "execute_job_duration_seconds",
    "End-to-end sandbox execution duration in seconds",
    ["outcome"],
    buckets=(0.1, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 15.0)
)

sandbox_container_start_seconds = Histogram(
    "sandbox_container_start_seconds",
    "Container creation and startup latency in seconds",
    buckets=(0.05, 0.1, 0.2, 0.5, 1.0, 2.0)
)

sandbox_kills_total = Counter(
    "sandbox_kills_total",
    "Number of sandbox containers terminated by host guardrails",
    ["reason"]  # timeout | oom | error
)

redis_cache_hits_total = Counter(
    "redis_cache_hits_total",
    "Leaderboard Redis cache hits"
)

redis_cache_misses_total = Counter(
    "redis_cache_misses_total",
    "Leaderboard Redis cache misses"
)

leaderboard_query_duration_seconds = Histogram(
    "leaderboard_query_duration_seconds",
    "Leaderboard SQL / cache retrieval latency in seconds",
    ["timeframe"]
)

webhook_processing_duration_seconds = Histogram(
    "webhook_processing_duration_seconds",
    "Paystack/Stripe webhook handling latency in seconds",
    ["provider", "event_type"]
)

webhook_signature_failures_total = Counter(
    "webhook_signature_failures_total",
    "Total rejected webhook calls due to cryptographic signature mismatch",
    ["provider"]
)
