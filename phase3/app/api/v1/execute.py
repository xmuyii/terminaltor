import logging
from fastapi import APIRouter, Depends, HTTPException, status

from phase1.app.api.deps import get_current_user
from phase1.app.config import Settings, get_settings
from phase1.app.services.executor import run_python
from phase2.app.services.badges import evaluate_badges
from phase2.app.services.xp import compute_xp
from phase3.app.database import (
    count_user_solves,
    get_challenge_by_id,
    has_first_passed,
    record_submission_transaction,
)
from phase3.app.models.schemas import (
    AntiCheatAuditInfo,
    ExecuteRequest,
    ExecutionResultPayload,
    ProfileProgressSummary,
    SubmissionResponse,
    TestCaseResult,
    UserProfile,
)
from phase3.app.services.evaluator_depth import evaluate_logic_depth
from phase3.app.services.rate_limiter import execution_rate_limiter

logger = logging.getLogger("phase3.execute")
router = APIRouter(prefix="/execute", tags=["execute"])


@router.post("", response_model=SubmissionResponse)
async def execute_code(
    payload: ExecuteRequest,
    current_user: UserProfile = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Phase 3 Execution Pipeline:
    1. Enforces rate limiter (429 if quota exceeded).
    2. Retrieves challenge (Tiers 1-8 or Tier 9-10 procedural).
    3. Runs deep AST static evaluation (forbid/require/complexity/recursion).
    4. Executes code inside isolated sandbox subprocess.
    5. Anti-cheat AST normalization and plagiarism check (flags submissions 2-5 for review without blocking scoring).
    6. First-pass XP calculation and calendar streak advancement.
    7. Badges milestone unlocks.
    """
    # 1. Rate Limiting Check
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

    # 2. Challenge Lookup
    challenge = await get_challenge_by_id(payload.challenge_id, current_user.id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge with ID '{payload.challenge_id}' not found.",
        )

    test_spec = challenge["test_spec"]
    eval_spec = challenge.get("evaluation_spec", {})
    challenge_xp = challenge.get("xp_reward", 10)

    # 3. Deep AST Static Evaluation
    ast_ok, logic_notes = evaluate_logic_depth(user_code, eval_spec)

    # 4. Isolated Subprocess Execution
    exec_res = await run_python(
        user_code=user_code,
        test_spec=test_spec,
        timeout_seconds=settings.EXECUTION_TIMEOUT_SECONDS,
        max_code_size_bytes=settings.MAX_CODE_SIZE_BYTES,
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

    # 5. Determine first pass and calculate XP
    already_passed = await has_first_passed(current_user.id, payload.challenge_id)
    xp_to_award = 0

    if overall_passed and not already_passed:
        xp_to_award = compute_xp(challenge_xp, total_tests, passed_tests)

    # 6. Transaction: record submission with Anti-Cheat & Plagiarism audit
    # Submissions 2-5 of duplicate code are flagged for review in DB but still scored normally!
    submission_id, is_first_pass, awarded_xp, updated_profile, anti_cheat_result = await record_submission_transaction(
        user_id=current_user.id,
        challenge_id=payload.challenge_id,
        code=user_code,
        passed=overall_passed,
        execution_ms=exec_ms,
        stdout=stdout,
        stderr=stderr,
        results=[t.model_dump() for t in test_case_results],
        xp_to_award=xp_to_award,
    )

    # 7. Evaluate and unlock badges
    solves_count = await count_user_solves(current_user.id)
    new_badges = await evaluate_badges(
        user_id=current_user.id,
        total_xp=updated_profile.get("total_xp", 0),
        current_streak=updated_profile.get("current_streak", 0),
        solves_count=solves_count,
    )

    return SubmissionResponse(
        submission_id=submission_id,
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
