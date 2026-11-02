import asyncio
import json
import time
from typing import Any, Dict
from uuid import UUID

from phase2.app.services.badges import evaluate_badges
from phase2.app.services.xp import compute_xp
from phase3.app.database import (
    count_user_solves,
    get_challenge_by_id,
    has_first_passed,
    record_submission_transaction,
)
from phase3.app.models.schemas import TestCaseResult
from phase3.app.services.evaluator_depth import evaluate_logic_depth
from phase6.app.config import settings
from phase6.app.observability.logging import get_logger
from phase6.app.observability.metrics import (
    execute_job_duration_seconds,
    execute_queue_depth,
)
from phase6.app.observability.tracing import set_current_request_id
from phase6.app.queue.client import queue_client
from phase6.app.queue.jobs import ExecuteJob, ExecuteResult
from phase6.app.services.executor import run_sandbox

logger = get_logger("phase6.queue.worker")


async def execute_job(ctx: Dict[str, Any], job_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Core Worker Execution Handler:
    1. Binds request_id to worker logging context.
    2. Runs container sandbox (or fallback).
    3. Runs static AST evaluator.
    4. Reuses Phase 2 exact transactional code path:
       - determines is_first_pass
       - computes XP
       - inserts submission
       - updates streak
       - unlocks badges
    5. Inserts plagiarism flags non-blocking (Phase 3).
    6. Writes ExecuteResult to Redis with TTL.
    7. Emits pub/sub progress event.
    8. Writes synthetic failure on any crash.
    """
    t_start = time.perf_counter()
    job = ExecuteJob.from_dict(job_dict)

    # Bind correlation ID
    if job.request_id:
        set_current_request_id(job.request_id)

    logger.info(f"Worker started job {job.job_id} for user {job.user_id}")
    await queue_client.publish_progress(job.job_id, "status", {"status": "running"})

    user_uuid = UUID(job.user_id) if isinstance(job.user_id, str) and len(job.user_id) == 36 else job.user_id

    try:
        # 1. Fetch challenge
        challenge = await get_challenge_by_id(job.challenge_id, user_uuid)
        if not challenge:
            raise ValueError(f"Challenge '{job.challenge_id}' not found.")

        test_spec = challenge.get("test_spec", [])
        eval_spec = challenge.get("evaluation_spec", {})
        challenge_xp = challenge.get("xp_reward", 10)

        # 2. Deep AST Static Evaluation
        ast_ok, logic_notes = evaluate_logic_depth(job.code, eval_spec)

        # 3. Run container sandbox
        exec_res = await run_sandbox(
            user_code=job.code,
            test_spec=test_spec,
            timeout_seconds=settings.SANDBOX_TIMEOUT_SECONDS,
            request_id=job.request_id,
        )

        fatal_err = exec_res.get("fatal")
        raw_results = exec_res.get("results", [])
        exec_ms = exec_res.get("execution_ms", 0)
        stdout = exec_res.get("stdout", "")
        stderr = exec_res.get("stderr", "")

        test_case_results = []
        for r in raw_results:
            test_case_results.append(
                TestCaseResult(
                    index=r["index"],
                    passed=r["passed"],
                    input=r["input"],
                    expected=r["expected"],
                    actual=r.get("actual"),
                    error=r.get("error"),
                    duration_ms=r.get("duration_ms", 0),
                )
            )

        passed_tests = sum(1 for t in test_case_results if t.passed)
        total_tests = len(test_spec)
        all_tests_passed = (total_tests > 0) and (passed_tests == total_tests)
        overall_passed = all_tests_passed and ast_ok and (fatal_err is None)

        if fatal_err and fatal_err not in stderr:
            stderr = (stderr + f"\n{fatal_err}").strip()

        # 4. Check first pass & XP logic
        already_passed = await has_first_passed(user_uuid, job.challenge_id)
        xp_to_award = 0
        if overall_passed and not already_passed:
            xp_to_award = compute_xp(challenge_xp, total_tests, passed_tests)

        # 5. Database transaction (with 3-attempt exponential retry)
        retries = 3
        sub_id = None
        is_first_pass = False
        awarded_xp = 0
        updated_profile = {}
        anti_cheat_result = {}

        for attempt in range(1, retries + 1):
            try:
                (
                    sub_id,
                    is_first_pass,
                    awarded_xp,
                    updated_profile,
                    anti_cheat_result,
                ) = await record_submission_transaction(
                    user_id=user_uuid,
                    challenge_id=job.challenge_id,
                    code=job.code,
                    passed=overall_passed,
                    execution_ms=exec_ms,
                    stdout=stdout,
                    stderr=stderr,
                    results=[t.model_dump() for t in test_case_results],
                    xp_to_award=xp_to_award,
                )
                break
            except Exception as db_err:
                logger.warning(f"DB transaction retry {attempt}/{retries} failed: {db_err}")
                if attempt == retries:
                    logger.critical(f"Database permanently unreachable after {retries} retries: {db_err}")
                    raise db_err
                await asyncio.sleep(0.2 * (2 ** (attempt - 1)))

        # 6. Evaluate badges (Phase 2 exact logic)
        solves_count = await count_user_solves(user_uuid)
        new_badges = await evaluate_badges(
            user_id=user_uuid,
            total_xp=updated_profile.get("total_xp", 0),
            current_streak=updated_profile.get("current_streak", 0),
            solves_count=solves_count,
        )

        outcome_result = ExecuteResult(
            job_id=job.job_id,
            submission_id=str(sub_id),
            passed=overall_passed,
            xp_awarded=awarded_xp,
            new_badges=new_badges,
            result={
                "passed": overall_passed,
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "execution_ms": exec_ms,
                "stdout": stdout,
                "stderr": stderr,
                "logic_notes": logic_notes,
                "results": [t.model_dump() for t in test_case_results],
            },
            completed_at=time.time(),
            profile={
                "total_xp": updated_profile.get("total_xp", 0),
                "current_streak": updated_profile.get("current_streak", 0),
                "longest_streak": updated_profile.get("longest_streak", 0),
            },
            anti_cheat=anti_cheat_result,
            error=None if fatal_err is None else fatal_err,
        )

        # Save result to Redis
        await queue_client.save_result(outcome_result, user_id=str(job.user_id))
        total_time = time.perf_counter() - t_start
        try:
            execute_job_duration_seconds.labels(outcome="success" if overall_passed else "failed").observe(total_time)
        except Exception:
            pass

        logger.info(f"Worker completed job {job.job_id} in {total_time:.3f}s")
        return outcome_result.to_dict()

    except Exception as exc:
        logger.critical(f"Worker encountered fatal job error: {type(exc).__name__}: {exc}", exc_info=True)
        # Synthetic failure guarantee: never leave a job hanging
        synthetic = ExecuteResult(
            job_id=job.job_id,
            submission_id="",
            passed=False,
            xp_awarded=0,
            new_badges=[],
            result={
                "passed": False,
                "total_tests": 0,
                "passed_tests": 0,
                "execution_ms": int((time.perf_counter() - t_start) * 1000),
                "stdout": "",
                "stderr": f"System error: {str(exc)}",
                "results": [],
            },
            completed_at=time.time(),
            error=str(exc),
        )
        await queue_client.save_result(synthetic, user_id=str(job.user_id))
        try:
            execute_job_duration_seconds.labels(outcome="error").observe(time.perf_counter() - t_start)
        except Exception:
            pass
        return synthetic.to_dict()


class WorkerSettings:
    """Arq Worker Configuration."""
    functions = [execute_job]
    redis_settings = None
    max_jobs = settings.WORKER_CONCURRENCY
    job_timeout = settings.QUEUE_JOB_TIMEOUT_SECONDS

    @classmethod
    def get_redis_settings(cls):
        try:
            from arq.connections import RedisSettings
            return RedisSettings.from_dsn(settings.REDIS_QUEUE_URL)
        except Exception:
            return None


async def start_worker_loop():
    """Background runner for in-memory / local worker process execution."""
    from phase6.app.queue.client import _MEMORY_QUEUE
    logger.info(f"Starting in-process background worker with concurrency={settings.WORKER_CONCURRENCY}")
    while True:
        try:
            job: ExecuteJob = await _MEMORY_QUEUE.get()
            try:
                execute_queue_depth.set(_MEMORY_QUEUE.qsize())
            except Exception:
                pass
            asyncio.create_task(execute_job({}, job.to_dict()))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker queue pump error: {e}")
            await asyncio.sleep(0.5)
