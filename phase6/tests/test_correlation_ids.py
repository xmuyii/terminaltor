import asyncio
import unittest
from phase6.app.observability.tracing import (
    generate_request_id,
    get_current_request_id,
    set_current_request_id,
)


class TestCorrelationIds(unittest.TestCase):
    """Verifies that correlation IDs propagate cleanly and generate fallback UUIDs."""

    def test_explicit_request_id_preservation(self):
        req_id = "test-req-correlation-12345"
        assigned = set_current_request_id(req_id)
        self.assertEqual(assigned, req_id)
        self.assertEqual(get_current_request_id(), req_id)

    def test_auto_generated_request_id(self):
        assigned = set_current_request_id(None)
        self.assertTrue(len(assigned) >= 16)
        self.assertEqual(get_current_request_id(), assigned)


if __name__ == "__main__":
    unittest.main()
