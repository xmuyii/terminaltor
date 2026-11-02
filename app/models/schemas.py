"""
Pydantic Schemas for Phase 5.5 Academy Alliances
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class AcademyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    owner_id: str
    plan: str = Field(..., regex="^(premium|pro)$")
    billing_email: Optional[str] = None


class AcademyJoinRequest(BaseModel):
    user_id: str
    join_code: str


class AcademyMemberResponse(BaseModel):
    id: str
    academy_id: str
    user_id: str
    username: Optional[str] = None
    joined_at: str
    removed_at: Optional[str] = None


class AcademyResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    join_code: str
    subscription_plan: str
    subscription_status: str
    seat_cap: int
    active_seat_count: int
    created_at: str


class EntitlementResponse(BaseModel):
    user_id: str
    individual_tier: str
    academy_tier: Optional[str]
    effective_tier: str
    seat_active: bool
    unlocked_tiers: List[int]
    hints_per_day: int
    freezes_per_month: int
