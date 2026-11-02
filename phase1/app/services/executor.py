import asyncio
import base64
import json
import sys
import time
from typing import Any, Dict, List, Optional

# Static harness executed in subprocess
HARNESS_SCRIPT = """
import sys
import json
import time
import io
import contextlib
import base64
import builtins

# Decode inputs from CLI args
raw_code = base64.b64decode(sys.argv[1].encode('utf-8')).decode('utf-8')
test_spec = json.loads(base64.b64decode(sys.argv[2].encode('utf-8')).decode('utf-8'))

BLOCKED_MODULES = {
    'os', 'sys', 'subprocess', 'socket', 'shutil', 'ctypes',
    'importlib', 'pathlib', 'glob', 'tempfile', 'pickle',
    'multiprocessing', 'threading', 'signal', 'resource'
}

orig_import = builtins.__import__

def guarded_import(name, *args, **kwargs):
    root_module = name.split('.')[0]
    if root_module in BLOCKED_MODULES:
        raise ImportError(f"Import of module '{name}' is forbidden for security.")
    return orig_import(name, *args, **kwargs)

builtins.__import__ = guarded_import

namespace = {}
captured_overall_stdout = io.StringIO()

try:
    with contextlib.redirect_stdout(captured_overall_stdout):
        exec(raw_code, namespace)
except Exception as e:
    err_payload = {
        'fatal': f"Failed to compile/execute code: {type(e).__name__}: {str(e)}",
        'results': []
    }
    sys.stdout.write(captured_overall_stdout.getvalue())
    sys.stdout.write("\\n__RESULT__" + json.dumps(err_payload) + "\\n")
    sys.exit(0)

solve_fn = namespace.get('solve')
if not callable(solve_fn):
    err_payload = {
        'fatal': "Missing required function 'solve' in submission.",
        'results': []
    }
    sys.stdout.write(captured_overall_stdout.getvalue())
    sys.stdout.write("\\n__RESULT__" + json.dumps(err_payload) + "\\n")
    sys.exit(0)

results = []
for idx, tc in enumerate(test_spec):
    tc_input = tc.get('input')
    expected = tc.get('expected')
    case_out_buffer = io.StringIO()

    start_t = time.perf_counter()
    actual = None
    err_str = None
    passed = False

    try:
        with contextlib.redirect_stdout(case_out_buffer):
            if isinstance(tc_input, dict):
                actual = solve_fn(**tc_input)
            elif isinstance(tc_input, list):
                actual = solve_fn(*tc_input)
            else:
                actual = solve_fn(tc_input)

        passed = (actual == expected)
    except Exception as exc:
        err_str = f"{type(exc).__name__}: {str(exc)}"
        passed = False

    dur_ms = int(round((time.perf_counter() - start_t) * 1000))
    captured_overall_stdout.write(case_out_buffer.getvalue())

    results.append({
        'index': idx,
        'passed': passed,
        'input': tc_input,
        'expected': expected,
        'actual': actual,
        'error': err_str,
        'duration_ms': dur_ms
    })

payload = {
    'fatal': None,
    'results': results
}

sys.stdout.write(captured_overall_stdout.getvalue())
sys.stdout.write("\\n__RESULT__" + json.dumps(payload) + "\\n")
"""


async def run_python(
    user_code: str,
    test_spec: List[Dict[str, Any]],
    timeout_seconds: int = 5,
    max_code_size_bytes: int = 65536,
) -> Dict[str, Any]:
    """Runs user code against test_spec in an isolated subprocess with timeout."""
    # Enforce code size bounds before spawning
    code_bytes = user_code.encode("utf-8")
    if len(code_bytes) == 0:
        return {
            "fatal": "Code cannot be empty.",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": "Code cannot be empty.",
        }

    if len(code_bytes) > max_code_size_bytes:
        return {
            "fatal": f"Code size {len(code_bytes)} bytes exceeds limit of {max_code_size_bytes} bytes.",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": "Code payload too large.",
        }

    encoded_code = base64.b64encode(code_bytes).decode("utf-8")
    encoded_spec = base64.b64encode(
        json.dumps(test_spec).encode("utf-8")
    ).decode("utf-8")

    start_time = time.perf_counter()
    proc: Optional[asyncio.subprocess.Process] = None

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable,
            "-I",
            "-S",
            "-c",
            HARNESS_SCRIPT,
            encoded_code,
            encoded_spec,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            proc.communicate(),
            timeout=float(timeout_seconds),
        )
    except asyncio.TimeoutError:
        if proc:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            try:
                await proc.wait()
            except Exception:
                pass

        total_ms = int(round((time.perf_counter() - start_time) * 1000))
        return {
            "fatal": f"Timeout after {timeout_seconds}s",
            "results": [],
            "execution_ms": total_ms,
            "stdout": "",
            "stderr": "Your code took too long — check for infinite loops!",
        }

    total_ms = int(round((time.perf_counter() - start_time) * 1000))
    raw_stdout = stdout_bytes.decode("utf-8", errors="replace")
    raw_stderr = stderr_bytes.decode("utf-8", errors="replace")

    # Locate and parse __RESULT__
    clean_stdout = []
    result_data = None

    for line in raw_stdout.splitlines():
        if line.startswith("__RESULT__"):
            json_part = line[len("__RESULT__") :]
            try:
                result_data = json.loads(json_part)
            except Exception as e:
                raw_stderr += f"\nFailed to parse test result: {e}"
        else:
            clean_stdout.append(line)

    final_stdout = "\n".join(clean_stdout).strip()

    if result_data is None:
        return {
            "fatal": "Harness terminated abnormally without emitting result payload.",
            "results": [],
            "execution_ms": total_ms,
            "stdout": final_stdout,
            "stderr": raw_stderr.strip(),
        }

    return {
        "fatal": result_data.get("fatal"),
        "results": result_data.get("results", []),
        "execution_ms": total_ms,
        "stdout": final_stdout,
        "stderr": raw_stderr.strip(),
    }
