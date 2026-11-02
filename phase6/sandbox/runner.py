import sys
import json
import time
import io
import contextlib
import builtins
import resource

# Blocked high-risk modules
BLOCKED_MODULES = {
    'os', 'sys', 'subprocess', 'socket', 'shutil', 'ctypes',
    'importlib', 'pathlib', 'glob', 'tempfile', 'pickle',
    'multiprocessing', 'threading', 'signal'
}

orig_import = builtins.__import__

def guarded_import(name, *args, **kwargs):
    root_module = name.split('.')[0]
    if root_module in BLOCKED_MODULES:
        raise ImportError(f"Import of module '{name}' is forbidden for security.")
    return orig_import(name, *args, **kwargs)

def emit_result(payload):
    try:
        sys.stdout.write(json.dumps(payload))
        sys.stdout.flush()
    except Exception:
        pass
    sys.exit(0)

def main():
    start_time = time.perf_counter()
    raw_input = ""
    try:
        raw_input = sys.stdin.read()
    except BaseException as e:
        emit_result({
            "fatal": f"Failed reading input from stdin: {type(e).__name__}: {str(e)}",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": ""
        })

    if not raw_input or not raw_input.strip():
        emit_result({
            "fatal": "Empty job specification received on stdin.",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": ""
        })

    try:
        job = json.loads(raw_input)
    except BaseException as e:
        emit_result({
            "fatal": f"Malformed JSON job input: {type(e).__name__}: {str(e)}",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": ""
        })

    user_code = job.get("code", "")
    test_spec = job.get("test_spec", [])
    request_id = job.get("request_id", "")

    # Install guarded import hook
    builtins.__import__ = guarded_import

    captured_stdout = io.StringIO()
    namespace = {}

    # Compile & exec user code
    try:
        with contextlib.redirect_stdout(captured_stdout):
            exec(user_code, namespace)
    except BaseException as e:
        exec_duration = int((time.perf_counter() - start_time) * 1000)
        prefix = f"[{request_id}] " if request_id else ""
        sys.stderr.write(f"{prefix}User code compilation error: {type(e).__name__}: {str(e)}\n")
        sys.stderr.flush()
        emit_result({
            "fatal": f"Compilation/Execution Error: {type(e).__name__}: {str(e)}",
            "results": [],
            "execution_ms": exec_duration,
            "stdout": captured_stdout.getvalue(),
            "stderr": f"Error: {type(e).__name__}: {str(e)}"
        })

    # Restrict file descriptors after exec to prevent test cases from opening thousands of fds
    try:
        resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    except BaseException as e:
        pass

    solve_fn = namespace.get("solve")
    if not callable(solve_fn):
        exec_duration = int((time.perf_counter() - start_time) * 1000)
        emit_result({
            "fatal": "Missing required function 'solve' in submission.",
            "results": [],
            "execution_ms": exec_duration,
            "stdout": captured_stdout.getvalue(),
            "stderr": "Missing required function 'solve' in submission."
        })

    test_results = []
    for idx, test_case in enumerate(test_spec):
        t_start = time.perf_counter()
        tc_input = test_case.get("input", [])
        expected = test_case.get("expected")

        try:
            if isinstance(tc_input, list):
                actual = solve_fn(*tc_input)
            elif isinstance(tc_input, dict):
                actual = solve_fn(**tc_input)
            else:
                actual = solve_fn(tc_input)

            passed = (actual == expected)
            duration_ms = int((time.perf_counter() - t_start) * 1000)

            test_results.append({
                "index": idx,
                "passed": passed,
                "input": tc_input,
                "expected": expected,
                "actual": actual,
                "error": None,
                "duration_ms": duration_ms
            })
        except BaseException as err:
            duration_ms = int((time.perf_counter() - t_start) * 1000)
            prefix = f"[{request_id}] " if request_id else ""
            sys.stderr.write(f"{prefix}Test case #{idx} failed: {type(err).__name__}: {str(err)}\n")
            sys.stderr.flush()
            test_results.append({
                "index": idx,
                "passed": False,
                "input": tc_input,
                "expected": expected,
                "actual": None,
                "error": f"{type(err).__name__}: {str(err)}",
                "duration_ms": duration_ms
            })

    exec_duration = int((time.perf_counter() - start_time) * 1000)
    emit_result({
        "fatal": None,
        "results": test_results,
        "execution_ms": exec_duration,
        "stdout": captured_stdout.getvalue(),
        "stderr": ""
    })

if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        pass
    except BaseException as unhandled:
        # Guarantee a well-formed JSON result on every failure
        sys.stdout.write(json.dumps({
            "fatal": f"Unhandled Sandbox Exception: {type(unhandled).__name__}: {str(unhandled)}",
            "results": [],
            "execution_ms": 0,
            "stdout": "",
            "stderr": f"Fatal unhandled exception: {type(unhandled).__name__}: {str(unhandled)}"
        }))
        sys.stdout.flush()
        sys.exit(0)

