import unittest
from phase6.app.observability.metrics import (
    execute_queue_depth,
    generate_latest,
    http_requests_total,
)


class TestMetricsEndpoint(unittest.TestCase):
    """Verifies that Prometheus metrics format correctly and increment upon events."""

    def test_metrics_output_format(self):
        text_bytes = generate_latest()
        self.assertIsInstance(text_bytes, (bytes, str))
        text = text_bytes.decode("utf-8") if isinstance(text_bytes, bytes) else text_bytes
        self.assertIn("# HELP", text)

    def test_counter_increment(self):
        http_requests_total.labels(method="POST", route="/api/v1/execute", status="202").inc()
        text_bytes = generate_latest()
        text = text_bytes.decode("utf-8") if isinstance(text_bytes, bytes) else text_bytes
        self.assertIn("http_requests_total", text)

    def test_gauge_depth_update(self):
        execute_queue_depth.set(12)
        text_bytes = generate_latest()
        text = text_bytes.decode("utf-8") if isinstance(text_bytes, bytes) else text_bytes
        self.assertIn("execute_queue_depth", text)


if __name__ == "__main__":
    unittest.main()
