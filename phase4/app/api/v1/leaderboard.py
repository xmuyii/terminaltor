from typing import Any, Callable, Dict, List, Optional
from uuid import UUID

try:
    from fastapi import APIRouter, Header, HTTPException, Query, status
    from jose import jwt
except ImportError:
    class MockRouter:
        def __init__(self, prefix="", tags=None):
            self.prefix = prefix
            self.tags = tags or []
            self.routes = []

        def get(self, path, **kwargs):
            def decorator(f):
                self.routes.append(("GET", path, f))
                return f
            return decorator

    APIRouter = MockRouter  # type: ignore
    Header = lambda default=None: default  # type: ignore
    Query = lambda default=None, **kwargs: default  # type: ignore
    jwt = None  # type: ignore
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(detail)
    class status:  # type: ignore
        HTTP_400_BAD_REQUEST = 400
        HTTP_401_UNAUTHORIZED = 401
        HTTP_422_UNPROCESSABLE_ENTITY = 422

from phase4.app.config import settings
from phase4.app.models.schemas import LeaderboardResponse, UserRankResponse
from phase4.app.services.leaderboard import (
    TIMEFRAME_TTLS,
    get_leaderboard,
    get_user_timeframe_stats,
)

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

VALID_TIMEFRAMES = set(TIMEFRAME_TTLS.keys())


def parse_bearer_user_id(authorization: Optional[str]) -> Optional[UUID]:
    """Helper to extract user_id from optional Bearer JWT token."""
    if not authorization or jwt is None:
        return None
    try:
        token = authorization.replace("Bearer ", "").strip()
        claims = jwt.get_unverified_claims(token)
        sub = claims.get("sub")
        if sub:
            return UUID(str(sub))
    except Exception:
        pass
    return None


@router.get("", response_model=LeaderboardResponse)
@router.get("/", response_model=LeaderboardResponse)
async def get_default_leaderboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.LEADERBOARD_PAGE_SIZE_DEFAULT, ge=1, le=settings.LEADERBOARD_PAGE_SIZE_MAX),
    include_me: bool = Query(False),
    authorization: Optional[str] = Header(None),
):
    """Default endpoint: returns all-time leaderboard."""
    return await get_timeframe_leaderboard(
        timeframe="all_time",
        page=page,
        page_size=page_size,
        include_me=include_me,
        authorization=authorization,
    )


@router.get("/{timeframe}", response_model=LeaderboardResponse)
async def get_timeframe_leaderboard(
    timeframe: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(settings.LEADERBOARD_PAGE_SIZE_DEFAULT, ge=1, le=settings.LEADERBOARD_PAGE_SIZE_MAX),
    include_me: bool = Query(False),
    authorization: Optional[str] = Header(None),
):
    """Returns paginated multi-timeframe leaderboard for daily, weekly, monthly, or all_time.

    Submissions made within the window are aggregated with stable dense ranking.
    Switching tabs responds under 100ms via tiered Redis caching.
    """
    timeframe_normalized = timeframe.lower()
    if timeframe_normalized not in VALID_TIMEFRAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timeframe '{timeframe}'. Must be one of: {sorted(list(VALID_TIMEFRAMES))}",
        )

    if page_size > settings.LEADERBOARD_PAGE_SIZE_MAX:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Page size {page_size} exceeds maximum {settings.LEADERBOARD_PAGE_SIZE_MAX}",
        )

    user_id = parse_bearer_user_id(authorization) if include_me else None

    return await get_leaderboard(
        timeframe=timeframe_normalized,
        page=page,
        page_size=page_size,
        user_id=user_id,
    )


@router.get("/{timeframe}/me", response_model=UserRankResponse)
async def get_my_timeframe_rank(
    timeframe: str,
    authorization: Optional[str] = Header(None),
    user_id_override: Optional[UUID] = Query(None, alias="user_id"),
):
    """Returns the caller's specific rank and statistics in the given timeframe."""
    timeframe_normalized = timeframe.lower()
    if timeframe_normalized not in VALID_TIMEFRAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timeframe '{timeframe}'. Must be one of: {sorted(list(VALID_TIMEFRAMES))}",
        )

    target_user_id = user_id_override or parse_bearer_user_id(authorization)
    if not target_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token or user_id required to look up personal rank.",
        )

    return await get_user_timeframe_stats(
        user_id=target_user_id,
        timeframe=timeframe_normalized,
    )
