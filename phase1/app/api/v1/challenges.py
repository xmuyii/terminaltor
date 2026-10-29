from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from app.database import get_all_challenges, get_challenge_by_id
from app.models.schemas import ChallengeDetail, ChallengeListItem

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=List[ChallengeListItem])
async def list_challenges():
    """Returns all 20 hand-authored challenges grouped by tier."""
    items = await get_all_challenges()
    return [
        ChallengeListItem(
            id=c["id"],
            slug=c["slug"],
            title=c["title"],
            tier=c["tier"],
            topic=c["topic"],
            starter_code=c["starter_code"],
        )
        for c in items
    ]


@router.get("/{challenge_id}", response_model=ChallengeDetail)
async def get_challenge(challenge_id: UUID):
    """Retrieves full challenge details including test_spec."""
    item = await get_challenge_by_id(challenge_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challenge with ID '{challenge_id}' not found.",
        )
    return ChallengeDetail(**item)
