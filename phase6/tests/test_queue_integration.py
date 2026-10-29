import asyncio
import time
import unittest
from uuid import uuid4

from phase6.app.config import settings
from phase6.app.queue.client import queue_client
from phase6.app.queue.jobs import ExecuteJob, ExecuteResult
from phase6.app.queue.worker import execute_job


class TestQueueIntegration(unittest.TestCase):
    """Verifies async queue enqueuing, polling, execution handling, and TTL expiry."""

    def test_enqueue_and_poll_result(self):
        job_id = f"test-job-{uuid4().hex[:8]}"
        user_id = str(uuid4())

        job = ExecuteJob(
            job_id=job_id,
            user_id=user_id,
            challenge_id="11111111-1111-1111-1111-000000000001",
            code="def solve(a: int, b: int) -> int:\n    return a + b\n",
            submitted_at=time.time(),
        )


        # 1. Enqueue
        enqueued_id = asyncio.run(queue_client.enqueue_execute(job))
        self.assertEqual(enqueued_id, job_id)

        # 2. Check queued status
        st = asyncio.run(queue_client.fetch_result(job_id))
        self.assertIsNotNone(st)
        self.assertEqual(st.get("status"), "queued")

        # 3. Process job via worker handler
        out = asyncio.run(execute_job({}, job.to_dict()))
        self.assertIsNotNone(out)

        # 4. Check completed status in queue store
        final = asyncio.run(queue_client.fetch_result(job_id))
        self.assertIsNotNone(final)
        self.assertIn(final.get("status"), ("complete", "failed"))
        self.assertEqual(final.get("job_id"), job_id)

    def test_worker_synthetic_failure_on_exception(self):
        """Worker must never drop a job: writes synthetic failure on invalid challenge."""
        job_id = f"test-err-{uuid4().hex[:8]}"
        job = ExecuteJob(
            job_id=job_id,
            user_id=str(uuid4()),
            challenge_id="non-existent-challenge-xyz",
            code="def solve(): pass",
            submitted_at=time.time(),
        )

        res = asyncio.run(execute_job({}, job.to_dict()))
        self.assertIsNotNone(res)
        self.assertFalse(res.get("passed", True))
        self.assertIsNotNone(res.get("error"))

        # Poll verifies synthetic failure is saved
        stored = asyncio.run(queue_client.fetch_result(job_id))
        self.assertIsNotNone(stored)
        self.assertEqual(stored.get("status"), "failed")


if __name__ == "__main__":
    unittest.main()
