from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from phase1.app.api.deps import get_current_user
from phase2.app.models.schemas import UserProfile
from phase3.app.database import get_all_challenges, get_challenge_by_id
from phase3.app.models.schemas import ChallengeDetail, ChallengeListItem
from phase3.app.services.procedural import get_daily_challenge_for_user

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=List[ChallengeListItem])
async def list_challenges(
    current_user: UserProfile = Depends(get_current_user),
):
    """Lists all available hand-authored challenges (Tiers 1-8) and active procedural challenges (Tiers 9-10)."""
    challenges = await get_all_challenges(current_user.id)
    return [
        ChallengeListItem(
            id=str(c["id"]),
            slug=c["slug"],
            title=c["title"],
            tier=c["tier"],
            topic=c["topic"],
            starter_code=c["starter_code"],
            xp_reward=c.get("xp_reward", 10),
            is_generated=c.get("is_generated", False),
        )
        for c in challenges
    ]


@router.get("/daily/tier9", response_model=ChallengeDetail)
async def get_daily_tier9(
    current_user: UserProfile = Depends(get_current_user),
):
    """Retrieves today's deterministically generated procedural challenge for Tier 9."""
    c = get_daily_challenge_for_user(str(current_user.id), tier=9)
    return ChallengeDetail(
        id=str(c["id"]),
        slug=c["slug"],
        title=c["title"],
        tier=c["tier"],
        topic=c["topic"],
        starter_code=c["starter_code"],
        xp_reward=c.get("xp_reward", 100),
        is_generated=True,
        description=c["description"],
        test_spec=c["test_spec"],
        evaluation_spec=c["evaluation_spec"],
    )


@router.get("/daily/tier10", response_model=ChallengeDetail)
async def get_daily_tier10(
    current_user: UserProfile = Depends(get_current_user),
):
    """Retrieves today's deterministically generated procedural challenge for Tier 10."""
    c = get_daily_challenge_for_user(str(current_user.id), tier=10)
    return ChallengeDetail(
        id=str(c["id"]),
        slug=c["slug"],
        title=c["title"],
        tier=c["tier"],
        topic=c["topic"],
        starter_code=c["starter_code"],
        xp_reward=c.get("xp_reward", 125),
        is_generated=True,
        description=c["description"],
        test_spec=c["test_spec"],
        evaluation_spec=c["evaluation_spec"],
    )


@router.get("/{challenge_id}", response_model=ChallengeDetail)
async def get_challenge(
    challenge_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    """Retrieves single challenge details, scrubbing reference_solution and solution_hash."""
    c = await get_challenge_by_id(challenge_id, current_user.id)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge '{challenge_id}' not found.",
        )
    return ChallengeDetail(
        id=str(c["id"]),
        slug=c["slug"],
        title=c["title"],
        tier=c["tier"],
        topic=c["topic"],
        starter_code=c["starter_code"],
        xp_reward=c.get("xp_reward", 10),
        is_generated=c.get("is_generated", False),
        description=c["description"],
        test_spec=c["test_spec"],
        evaluation_spec=c.get("evaluation_spec", {}),
    )
