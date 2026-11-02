from datetime import datetime
from typing import Any, List, Literal, Optional
from uuid import UUID

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
        def __getitem__(self, item):
            return getattr(self, item)
    def Field(*args, default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            try:
                return default_factory()
            except Exception:
                return None
        return default

# Supported leaderboard timeframes
LeaderboardTimeframe = Literal["daily", "weekly", "monthly", "all_time"]


class BadgeItem(BaseModel):
    id: str
    name: str
    icon: str
    unlocked_at: datetime


class UserProfile(BaseModel):
    id: UUID
    username: str
    avatar_url: Optional[str] = None
    total_xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    badges: List[BadgeItem] = Field(default_factory=list)
    solved_count: int = 0
    created_at: datetime


class ChallengeListItem(BaseModel):
    id: Any
    slug: str
    title: str
    tier: int
    topic: str
    starter_code: str
    xp_reward: int = 10
    is_generated: bool = False


class ChallengeDetail(ChallengeListItem):
    description: str
    test_spec: List[dict]
    evaluation_spec: dict
    created_at: datetime


class ExecuteRequest(BaseModel):
    challenge_id: Any
    code: str = Field(..., max_length=65536)


class TestCaseResult(BaseModel):
    index: int
    passed: bool
    input: Any
    expected: Any
    actual: Any = None
    error: Optional[str] = None
    duration_ms: int = 0


class ExecutionResultPayload(BaseModel):
    passed: bool
    total_tests: int
    passed_tests: int
    execution_ms: int
    stdout: str
    stderr: str
    logic_notes: List[str] = Field(default_factory=list)
    results: List[TestCaseResult] = Field(default_factory=list)


class ProfileProgressSummary(BaseModel):
    total_xp: int
    current_streak: int
    longest_streak: int


class SubmissionResponse(BaseModel):
    submission_id: UUID
    passed: bool
    result: ExecutionResultPayload
    xp_awarded: int = 0
    new_badges: List[str] = Field(default_factory=list)
    profile: ProfileProgressSummary
    is_flagged_for_review: bool = False


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    username: str
    avatar_url: Optional[str] = None
    points: int
    challenges_solved: int
    last_submission_at: Optional[datetime] = None


class LeaderboardResponse(BaseModel):
    timeframe: str
    page: int
    page_size: int
    total: int
    total_pages: int
    cached: bool = False
    my_rank: Optional[int] = None
    entries: List[LeaderboardEntry]


class UserRankResponse(BaseModel):
    user_id: UUID
    timeframe: str
    rank: Optional[int] = None
    points: int = 0
    challenges_solved: int = 0
    total_participants: int = 0
