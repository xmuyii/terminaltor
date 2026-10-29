from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    id: UUID
    username: str
    avatar_url: Optional[str] = None
    created_at: datetime


class ChallengeListItem(BaseModel):
    id: UUID
    slug: str
    title: str
    tier: int
    topic: str
    starter_code: str


class ChallengeDetail(ChallengeListItem):
    description: str
    test_spec: List[dict]
    evaluation_spec: dict
    created_at: datetime


class ExecuteRequest(BaseModel):
    challenge_id: UUID
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


class SubmissionResponse(BaseModel):
    submission_id: UUID
    passed: bool
    result: ExecutionResultPayload
