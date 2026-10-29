from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.database import get_challenge_by_id, record_submission
from app.models.schemas import (
    ExecuteRequest,
    ExecutionResultPayload,
    SubmissionResponse,
    TestCaseResult,
    UserProfile,
)
from app.services.evaluator import evaluate_logic
from app.services.executor import run_python

router = APIRouter(prefix="/execute", tags=["execute"])


@router.post("", response_model=SubmissionResponse)
async def execute_code(
    payload: ExecuteRequest,
    current_user: UserProfile = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Executes user Python code against challenge test specification in isolated subprocess."""
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

    challenge = await get_challenge_by_id(payload.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge with ID '{payload.challenge_id}' not found.",
        )

    test_spec = challenge["test_spec"]
    eval_spec = challenge.get("evaluation_spec", {})

    # 1. AST static evaluation
    ast_ok, logic_notes = evaluate_logic(user_code, eval_spec)

    # 2. Subprocess test runner
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

    # 3. Persist submission row
    submission_id = await record_submission(
        user_id=current_user.id,
        challenge_id=payload.challenge_id,
        code=user_code,
        passed=overall_passed,
        execution_ms=exec_ms,
        stdout=stdout,
        stderr=stderr,
        results=[t.model_dump() for t in test_case_results],
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
    )
