import asyncio
import json
import os
import shutil
import tempfile
import time
from typing import Any, Dict, List, Optional, Tuple

from phase6.app.config import settings
from phase6.app.observability.logging import get_logger
from phase6.app.observability.metrics import (
    sandbox_container_start_seconds,
    sandbox_kills_total,
)

logger = get_logger("phase6.sandbox.executor")

async def run_in_subprocess(
    user_code: str,
    test_spec: List[Dict[str, Any]],
    timeout_seconds: int = settings.SANDBOX_TIMEOUT_SECONDS,
    request_id: str = "",
) -> Dict[str, Any]:
    """Development fallback: runs user code via Python subprocess with guarded imports and resource limits."""
    # Robust path resolution for runner.py
    candidate_paths = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "phase6", "sandbox", "runner.py"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sandbox", "runner.py"),
        os.path.abspath("phase6/sandbox/runner.py"),
        "/phase6/sandbox/runner.py",
        "/app/applet/phase6/sandbox/runner.py",
    ]
    runner_script = next((p for p in candidate_paths if os.path.exists(p)), candidate_paths[0])


    job_payload = json.dumps({
        "code": user_code,
        "test_spec": test_spec,
        "request_id": request_id,
        "timeout_ms": timeout_seconds * 1000,
    })

    cmd = [os.sys.executable, "-I", "-S", runner_script]

    t0 = time.perf_counter()
    proc = None
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            proc.communicate(input=job_payload.encode("utf-8")),
            timeout=float(timeout_seconds),
        )
        duration_ms = int((time.perf_counter() - t0) * 1000)
    except asyncio.TimeoutError:
        if proc:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
        try:
            sandbox_kills_total.labels(reason="timeout").inc()
        except Exception:
            pass
        return {
            "fatal": "Execution timed out.",
            "error": "timeout",
            "results": [],
            "execution_ms": timeout_seconds * 1000,
            "stdout": "",
            "stderr": "Error: execution exceeded sandbox time limit.",
        }
    except Exception as exc:
        if proc:
            try:
                proc.kill()
            except Exception:
                pass
        return {
            "fatal": f"Subprocess runner failed: {type(exc).__name__}: {str(exc)}",
            "error": "error",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": str(exc),
        }

    stdout_text = stdout_bytes.decode("utf-8", errors="replace")
    stderr_text = stderr_bytes.decode("utf-8", errors="replace")

    try:
        result_obj = json.loads(stdout_text)
        return result_obj
    except Exception as parse_err:
        return {
            "fatal": f"Malformed output from runner: {parse_err}",
            "error": "malformed_output",
            "results": [],
            "execution_ms": duration_ms,
            "stdout": stdout_text,
            "stderr": stderr_text,
        }


async def run_in_container(
    user_code: str,
    test_spec: List[Dict[str, Any]],
    timeout_seconds: int = settings.SANDBOX_TIMEOUT_SECONDS,
    request_id: str = "",
) -> Dict[str, Any]:
    """Spawns an isolated one-shot Docker container per submission enforcing:
    - --rm
    - --network=none
    - --read-only
    - --tmpfs /tmp:rw,noexec,nosuid,size=16m
    - --memory=128m --memory-swap=128m
    - --cpus=0.50
    - --pids-limit=64
    - --cap-drop=ALL
    - --security-opt=no-new-privileges
    - --security-opt=seccomp=phase6/sandbox/policies/seccomp.json
    - --user=65532:65532
    - --ulimit=nofile=32:32
    - --ulimit=nproc=32:32
    """
    docker_bin = shutil.which("docker")
    if not docker_bin:
        logger.warning("Docker binary not available in environment. Falling back to subprocess runner.")
        return await run_in_subprocess(user_code, test_spec, timeout_seconds, request_id)

    job_data = {
        "code": user_code,
        "test_spec": test_spec,
        "request_id": request_id,
        "timeout_ms": timeout_seconds * 1000,
    }
    input_bytes = json.dumps(job_data).encode("utf-8")

    seccomp_path = "/phase6/sandbox/policies/seccomp.json"
    if not os.path.exists(seccomp_path):
        seccomp_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sandbox", "policies", "seccomp.json")

    cmd = [
        "docker", "run",
        "--rm",
        "-i",
        "--network", "none",
        "--read-only",
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
        f"--memory={settings.SANDBOX_MEMORY_LIMIT_MB}m",
        f"--memory-swap={settings.SANDBOX_MEMORY_LIMIT_MB}m",
        f"--cpus={float(settings.SANDBOX_CPU_QUOTA) / 100000.0:.2f}",
        f"--pids-limit={settings.SANDBOX_PIDS_LIMIT}",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "--user=65532:65532",
        "--ulimit", "nofile=32:32",
        "--ulimit", "nproc=32:32",
    ]

    if os.path.exists(seccomp_path):
        cmd.extend(["--security-opt", f"seccomp={seccomp_path}"])

    cmd.append(settings.SANDBOX_IMAGE)

    t0 = time.perf_counter()
    proc = None
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            sandbox_container_start_seconds.observe(time.perf_counter() - t0)
        except Exception:
            pass

        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            proc.communicate(input=input_bytes),
            timeout=float(timeout_seconds),
        )
        return_code = proc.returncode
    except asyncio.TimeoutError:
        if proc:
            try:
                proc.kill()
            except Exception:
                pass
        try:
            sandbox_kills_total.labels(reason="timeout").inc()
        except Exception:
            pass
        return {
            "fatal": "Container execution timed out.",
            "error": "timeout",
            "results": [],
            "execution_ms": timeout_seconds * 1000,
            "stdout": "",
            "stderr": "Error: execution exceeded sandbox time limit.",
        }
    except Exception as exc:
        return {
            "fatal": f"Failed invoking container sandbox: {str(exc)}",
            "error": "container_invocation_failed",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": str(exc),
        }

    stdout_text = stdout_bytes.decode("utf-8", errors="replace")
    stderr_text = stderr_bytes.decode("utf-8", errors="replace")

    # Check for OOM exit code (137)
    if return_code == 137:
        try:
            sandbox_kills_total.labels(reason="oom").inc()
        except Exception:
            pass
        return {
            "fatal": "Container OOM-killed.",
            "error": "memory_limit",
            "results": [],
            "execution_ms": int((time.perf_counter() - t0) * 1000),
            "stdout": stdout_text,
            "stderr": "Error: Memory limit exceeded (OOM killed).",
        }

    try:
        return json.loads(stdout_text)
    except Exception:
        return {
            "fatal": "Invalid container output format.",
            "error": "container_crash",
            "results": [],
            "execution_ms": int((time.perf_counter() - t0) * 1000),
            "stdout": stdout_text,
            "stderr": stderr_text or f"Container exited with code {return_code}",
        }


async def run_sandbox(
    user_code: str,
    test_spec: List[Dict[str, Any]],
    timeout_seconds: int = settings.SANDBOX_TIMEOUT_SECONDS,
    request_id: str = "",
) -> Dict[str, Any]:
    """Unified entrypoint: selects Docker or Subprocess backend per settings."""
    if settings.SANDBOX_BACKEND.lower() == "docker":
        return await run_in_container(user_code, test_spec, timeout_seconds, request_id)
    else:
        return await run_in_subprocess(user_code, test_spec, timeout_seconds, request_id)
