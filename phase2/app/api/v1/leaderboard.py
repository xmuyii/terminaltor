from typing import Optional
from fastapi import APIRouter, Header, Query
from jose import jwt

from phase2.app.database import get_leaderboard_all_time, get_user_rank
from phase2.app.models.schemas import LeaderboardEntry, LeaderboardResponse

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/all_time", response_model=LeaderboardResponse)
async def get_all_time_leaderboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    include_me: bool = Query(False),
    authorization: Optional[str] = Header(None),
):
    """Returns the all-time student leaderboard ranked by XP and solves count."""
    total, raw_entries = await get_leaderboard_all_time(page=page, page_size=page_size)

    my_rank = None
    if include_me and authorization:
        try:
            token = authorization.replace("Bearer ", "").strip()
            claims = jwt.get_unverified_claims(token)
            user_id_str = claims.get("sub")
            if user_id_str:
                from uuid import UUID
                my_rank = await get_user_rank(UUID(user_id_str))
        except Exception:
            pass

    entries = [
        LeaderboardEntry(
            rank=e["rank"],
            user_id=e["user_id"],
            username=e["username"],
            avatar_url=e["avatar_url"],
            points=e["points"],
            challenges_solved=e["challenges_solved"],
            last_submission_at=e["last_submission_at"],
        )
        for e in raw_entries
    ]

    return LeaderboardResponse(
        timeframe="all_time",
        page=page,
        page_size=page_size,
        total=total,
        my_rank=my_rank,
        entries=entries,
    )
