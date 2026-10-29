from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
        def dict(self):
            return self.model_dump()
        def __getitem__(self, item):
            return getattr(self, item)
    def Field(*args, default=None, default_factory=None, **kwargs):
        if default_factory is not None:
            try:
                return default_factory()
            except Exception:
                return None
        return default


from phase2.app.models.schemas import (
    BadgeItem,
    UserProfile,
    TestCaseResult,
    ExecutionResultPayload,
    ProfileProgressSummary,
    LeaderboardEntry,
    LeaderboardResponse,
)


class ChallengeListItem(BaseModel):
    id: str
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
    created_at: Optional[datetime] = None


class ExecuteRequest(BaseModel):
    challenge_id: str
    code: str = Field(..., max_length=65536)


class AntiCheatAuditInfo(BaseModel):
    is_flagged: bool = False
    flag_type: str = "clean"
    reason: Optional[str] = None
    similarity_score: float = 0.0
    ast_hash: Optional[str] = None


class SubmissionResponse(BaseModel):
    submission_id: UUID
    passed: bool
    result: ExecutionResultPayload
    xp_awarded: int = 0
    new_badges: List[str] = Field(default_factory=list)
    profile: ProfileProgressSummary
    anti_cheat: Optional[AntiCheatAuditInfo] = None
