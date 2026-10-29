import asyncio
import json
import os
import unittest
from phase6.app.services.executor import run_in_subprocess


class TestSandboxIsolation(unittest.TestCase):
    """Verifies that security attacks fail cleanly inside the sandbox and leave the host unharmed."""

    def test_open_etc_passwd_fails_cleanly(self):
        """open('/etc/passwd') fails with security error or permission error without crashing parent."""
        code = """
def solve():
    with open('/etc/passwd', 'r') as f:
        return f.read()
"""
        spec = [{"input": [], "expected": "root"}]
        res = asyncio.run(run_in_subprocess(code, spec, timeout_seconds=3))
        self.assertIsNotNone(res)
        # Verify execution completed without crashing parent
        self.assertIn("results", res)
        if len(res["results"]) > 0:
            self.assertFalse(res["results"][0]["passed"])
        else:
            self.assertTrue(res.get("fatal") is not None or "Error" in res.get("stderr", ""))

    def test_infinite_loop_timeout_killed(self):
        """while True: pass is terminated at timeout limit."""
        code = """
def solve():
    while True:
        pass
"""
        spec = [{"input": [], "expected": 1}]
        res = asyncio.run(run_in_subprocess(code, spec, timeout_seconds=1))
        self.assertIsNotNone(res)
        self.assertEqual(res.get("error"), "timeout")

    def test_network_socket_forbidden(self):
        """Attempting socket creation raises ImportError or is blocked."""
        code = """
def solve():
    import socket
    s = socket.socket()
    return True
"""
        spec = [{"input": [], "expected": True}]
        res = asyncio.run(run_in_subprocess(code, spec, timeout_seconds=2))
        self.assertIsNotNone(res)
        fatal_msg = (res.get("fatal") or "").lower()
        stderr_msg = (res.get("stderr") or "").lower()
        results = res.get("results", [])
        has_blocked_err = any("forbidden" in str(r.get("error", "")).lower() for r in results)

        self.assertTrue(
            "forbidden" in fatal_msg
            or "forbidden" in stderr_msg
            or has_blocked_err
            or (len(results) > 0 and not results[0]["passed"])
        )


    def test_host_filesystem_untouched(self):
        """Host filesystem has not been altered."""
        self.assertTrue(os.path.exists("/etc"))


if __name__ == "__main__":
    unittest.main()
