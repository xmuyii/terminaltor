import time
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status

from phase1.app.api.deps import get_current_user
from phase1.app.models.schemas import (
    ExecuteRequest,
    ExecutionResultPayload,
    ProfileProgressSummary,
    SubmissionResponse,
    TestCaseResult,
    UserProfile,
)
from phase2.app.services.badges import evaluate_badges
from phase2.app.services.xp import compute_xp
from phase3.app.database import (
    count_user_solves,
    get_challenge_by_id,
    has_first_passed,
    record_submission_transaction,
)
from phase3.app.models.schemas import AntiCheatAuditInfo
from phase3.app.services.evaluator_depth import evaluate_logic_depth
from phase3.app.services.rate_limiter import execution_rate_limiter
from phase6.app.config import Settings, get_settings
from phase6.app.observability.logging import get_logger
from phase6.app.observability.tracing import get_current_request_id
from phase6.app.queue.client import queue_client
from phase6.app.queue.jobs import ExecuteJob
from phase6.app.services.executor import run_sandbox
from pydantic import BaseModel

logger = get_logger("phase6.api.execute")
router = APIRouter(prefix="/execute", tags=["execute"])


class AsyncExecuteResponse(BaseModel):
    job_id: str
    status: str
    poll_url: str
    sse_url: str
    estimated_wait_ms: int


@router.post(
    "",
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        202: {"model": AsyncExecuteResponse, "description": "Submission accepted into async queue"},
        200: {"model": SubmissionResponse, "description": "Synchronous execution (deprecated header)"},
        429: {"description": "Rate limit exceeded"},
        402: {"description": "Tier gated (upgrade required)"},
        503: {"description": "Queue unavailable"},
    },
)
async def execute_code(
    payload: ExecuteRequest,
    current_user: UserProfile = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    x_execute_mode: Optional[str] = Header(None, alias="X-Execute-Mode"),
):
    """Phase 6 Async Execution Endpoint:
    1. Enforces Phase 3/5 Rate Limiter (returns 429 before queue).
    2. Enforces Tier Gating (Tier > 4 without Pro returns 402 before queue).
    3. Handles deprecated 'X-Execute-Mode: sync' header for Phase 1 backwards compatibility.
    4. Enqueues job into Arq/Redis queue and returns HTTP 202 Accepted.
    """
    # 1. Enforce Rate Limiting
    execution_rate_limiter.enforce(str(current_user.id))

    user_code = payload.code
    code_bytes = user_code.encode("utf-8")
    if len(code_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code cannot be empty.",
        )
    if len(code_bytes) > settings.MAX_CODE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Code payload exceeds maximum size of {settings.MAX_CODE_SIZE_BYTES} bytes.",
        )

    # 2. Challenge Lookup & Tier Gating
    challenge = await get_challenge_by_id(payload.challenge_id, current_user.id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge with ID '{payload.challenge_id}' not found.",
        )

    # Tier gating check: challenges above Tier 4 require Pro Pass / active subscription
    challenge_tier = challenge.get("tier", 1)
    if challenge_tier > 4 and not getattr(current_user, "has_pro_pass", False):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="This tier requires a Pro subscription. Upgrade at /pricing.",
        )

    # 3. Synchronous deprecation fallback
    if x_execute_mode and x_execute_mode.strip().lower() == "sync":
        logger.warning(
            f"DEPRECATION WARNING: User {current_user.id} requested X-Execute-Mode: sync. "
            "Synchronous execution is deprecated and will be removed in Phase 7."
        )
        return await _execute_sync_fallback(payload, current_user, challenge, settings)

    # 4. Async queue path (202 Accepted)
    job_id = f"01HN{uuid.uuid4().hex[:20]}"
    req_id = get_current_request_id()

    job = ExecuteJob(
        job_id=job_id,
        user_id=str(current_user.id),
        challenge_id=str(payload.challenge_id),
        code=user_code,
        submitted_at=time.time(),
        request_id=req_id,
    )

    try:
        await queue_client.enqueue_execute(job)
    except Exception as exc:
        logger.error(f"Execution queue unreachable: {exc}")
        return Response(
            content='{"detail": "Execution queue unavailable. Please retry shortly."}',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            media_type="application/json",
            headers={"Retry-After": "5"},
        )

    return AsyncExecuteResponse(
        job_id=job_id,
        status="queued",
        poll_url=f"/api/v1/submissions/{job_id}",
        sse_url=f"/api/v1/submissions/{job_id}/stream",
        estimated_wait_ms=800,
    )


async def _execute_sync_fallback(payload, current_user, challenge, settings):
    """Phase 1 sync compatibility handler."""
    test_spec = challenge.get("test_spec", [])
    eval_spec = challenge.get("evaluation_spec", {})
    challenge_xp = challenge.get("xp_reward", 10)

    ast_ok, logic_notes = evaluate_logic_depth(payload.code, eval_spec)
    exec_res = await run_sandbox(
        user_code=payload.code,
        test_spec=test_spec,
        timeout_seconds=settings.SANDBOX_TIMEOUT_SECONDS,
        request_id=get_current_request_id(),
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

    if fatal_err:
        stderr = (stderr + f"\n{fatal_err}").strip()

    already_passed = await has_first_passed(current_user.id, payload.challenge_id)
    xp_to_award = 0
    if overall_passed and not already_passed:
        xp_to_award = compute_xp(challenge_xp, total_tests, passed_tests)

    sub_id, is_first_pass, awarded_xp, updated_profile, anti_cheat_result = await record_submission_transaction(
        user_id=current_user.id,
        challenge_id=payload.challenge_id,
        code=payload.code,
        passed=overall_passed,
        execution_ms=exec_ms,
        stdout=stdout,
        stderr=stderr,
        results=[t.model_dump() for t in test_case_results],
        xp_to_award=xp_to_award,
    )

    solves_count = await count_user_solves(current_user.id)
    new_badges = await evaluate_badges(
        user_id=current_user.id,
        total_xp=updated_profile.get("total_xp", 0),
        current_streak=updated_profile.get("current_streak", 0),
        solves_count=solves_count,
    )

    return SubmissionResponse(
        submission_id=sub_id,
        passed=overall_passed,
        result=ExecutionResultPayload(
            passed=overall_passed,
            total_tests=total_tests,
            passed_tests=passed_tests,
            execution_ms=exec_ms,
            stdout=stdout,
            stderr=stderr,
            logic_notes=logic_notes,
            results=test_case_results,
        ),
        xp_awarded=awarded_xp,
        new_badges=new_badges,
        profile=ProfileProgressSummary(
            total_xp=updated_profile.get("total_xp", 0),
            current_streak=updated_profile.get("current_streak", 0),
            longest_streak=updated_profile.get("longest_streak", 0),
        ),
        anti_cheat=AntiCheatAuditInfo(
            is_flagged=anti_cheat_result["is_flagged"],
            flag_type=anti_cheat_result["flag_type"],
            reason=anti_cheat_result["reason"],
            similarity_score=anti_cheat_result["similarity_score"],
            ast_hash=anti_cheat_result["ast_hash"],
        ),
    )
