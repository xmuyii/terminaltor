# Phase 6: Containerized Sandbox Isolation Notes & Failure Modes

## 1. Architecture Overview
In Phase 6, student code evaluation transitions from in-process subprocess execution to ephemeral, single-shot Docker containers enforcing kernel-level sandboxing:
- **Image**: Built from `python:3.11-slim` with all package managers (`apt`, `pip`), compilers, and interactive shells removed.
- **User**: Runs strictly as unprivileged non-root user `sandbox` (`UID:GID 65532:65532`).
- **Filesystem**: `--read-only` root filesystem. The only writable path is `--tmpfs /tmp:rw,noexec,nosuid,size=16m`.
- **Network**: `--network=none`. Containers cannot bind ports, initiate TCP/UDP connections, or communicate with local or remote addresses.
- **Capabilities & Privileges**: `--cap-drop=ALL` and `--security-opt=no-new-privileges`.
- **Seccomp Filtering**: Enforces `sandbox/policies/seccomp.json`, blocking unauthorized system calls (e.g. ptrace, mount, bpf, raw sockets).
- **Resource Limits**:
  - Memory: `--memory=128m --memory-swap=128m` (prevents swap thrashing on host).
  - CPU Quota: `--cpus=0.50` (50% of 1 CPU core).
  - PID Limit: `--pids-limit=64` (prevents fork bombs).
  - Open File Descriptors: `--ulimit nofile=32:32` and `resource.setrlimit(RLIMIT_NOFILE, (32, 32))`.

---

## 2. Failure Mode Specifications

| Failure Mode | Detection Mechanism | System Action & Metrics | Response to Client |
| :--- | :--- | :--- | :--- |
| **Container OOM** | Docker exits with code `137` | Worker detects exit code 137, increments `sandbox_kills_total{reason="oom"}` | `{"status": "failed", "error": "memory_limit"}` |
| **Container Timeout** | Process duration > `SANDBOX_TIMEOUT_SECONDS` (8s) | Parent sends `SIGKILL` (`docker stop --time=1`), increments `sandbox_kills_total{reason="timeout"}` | `{"status": "failed", "error": "timeout"}` |
| **Redis Queue Unreachable** | Connection error on `enqueue_execute` | FastAPI logs error, returns HTTP 503 with `Retry-After: 5` header | HTTP 503 "Execution queue unavailable. Please retry shortly." |
| **Worker Crash Mid-Job** | Arq unhandled process death | Arq dead letter / re-enqueue logic re-delivers the job. Database transaction is protected by `uq_submissions_first_pass` | Eventual consistent `complete` or synthetic `failed` |
| **Postgres Unreachable** | DB connection pool timeout | Exponential backoff (3 attempts). If DB is permanently unreachable, writes synthetic failure to Redis and logs `CRITICAL` | `{"status": "failed", "error": "Database temporarily unavailable"}` |
| **Sandbox Image Missing** | Healthcheck at startup | Fast-fail on boot; startup checks if image exists or pulls it | Prevents runtime requests from failing |
| **File Access Attempt (`/etc/passwd`)** | AppArmor & Read-only container root | Python raises `PermissionError` or returns empty, test case fails cleanly | `{"status": "complete", "result": {"passed": false, ...}}` |
| **Network Socket Attempt** | `--network=none` & syscall filter | `socket.socket()` raises `OSError` / `ImportError` | Standard test case failure (no host impact) |

---

## 3. Why Docker + Seccomp over Firecracker / gVisor
- **Operational Complexity**: Docker Compose supports standard Linux cgroups and seccomp profiles without requiring KVM hardware virtualization support on cloud developer instances (such as standard CI/CD runners or container-in-container platforms).
- **Sub-Second Overhead**: Pre-warmed container pools and read-only Alpine/Debian slim scratch layers achieve cold-starts under 200ms.
- **Phase 7 Roadmap**: MicroVM virtualization (Firecracker/gVisor) is reserved for Phase 7 multi-tenant cloud deployments.
