from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from phase1.app.api.deps import get_current_user
from phase1.app.models.schemas import UserProfile
from phase6.app.observability.logging import get_logger
from phase6.app.services.submissions import get_submission_status, stream_submission_sse

logger = get_logger("phase6.api.submissions")
router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.get("/{job_id}")
async def get_submission(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    """Polls async submission status by job_id.
    Validates ownership of job before returning result.
    Returns:
    - {"status": "queued"}
    - {"status": "running", "started_at": ...}
    - {"status": "complete", "result": <ExecuteResult>}
    - {"status": "failed", "error": "..."}
    """
    res = await get_submission_status(job_id, str(current_user.id))
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Submission job '{job_id}' not found or expired.",
        )

    if res.get("status") == "forbidden":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view this submission.",
        )

    return res


@router.get("/{job_id}/stream")
async def stream_submission(
    job_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    """Server-Sent Events (SSE) stream for real-time submission progress.
    Emits events: status, progress, complete, error.
    """
    return StreamingResponse(
        stream_submission_sse(job_id, str(current_user.id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
