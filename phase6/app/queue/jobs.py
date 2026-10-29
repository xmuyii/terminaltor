from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional


@dataclass
class ExecuteJob:
    job_id: str
    user_id: str
    challenge_id: str
    code: str
    submitted_at: float
    request_id: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecuteJob":
        return cls(
            job_id=data["job_id"],
            user_id=data["user_id"],
            challenge_id=data["challenge_id"],
            code=data["code"],
            submitted_at=data["submitted_at"],
            request_id=data.get("request_id", ""),
        )


@dataclass
class ExecuteResult:
    job_id: str
    submission_id: str
    passed: bool
    xp_awarded: int
    new_badges: List[str]
    result: Dict[str, Any]
    completed_at: float
    profile: Optional[Dict[str, Any]] = None
    anti_cheat: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecuteResult":
        return cls(
            job_id=data["job_id"],
            submission_id=data.get("submission_id", ""),
            passed=data.get("passed", False),
            xp_awarded=data.get("xp_awarded", 0),
            new_badges=data.get("new_badges", []),
            result=data.get("result", {}),
            completed_at=data.get("completed_at", 0.0),
            profile=data.get("profile"),
            anti_cheat=data.get("anti_cheat"),
            error=data.get("error"),
        )
