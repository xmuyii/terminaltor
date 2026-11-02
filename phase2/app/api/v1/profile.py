from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from phase1.app.api.deps import get_current_user
from phase2.app.database import count_user_solves, get_profile
from phase2.app.models.schemas import BadgeItem, UserProfile
from phase2.app.services.badges import SEED_BADGES, get_user_badges_list

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user=Depends(get_current_user)):
    """Retrieves full student profile including XP, streaks, solved count, and unlocked badges."""
    p = await get_profile(current_user.id)
    badge_ids = get_user_badges_list(current_user.id)
    solves = await count_user_solves(current_user.id)

    badge_map = {b["id"]: b for b in SEED_BADGES}
    badges_items = []
    for bid in badge_ids:
        binfo = badge_map.get(bid)
        if binfo:
            badges_items.append(
                BadgeItem(
                    id=bid,
                    name=binfo["name"],
                    icon=binfo.get("icon", "🏅"),
                    unlocked_at=datetime.now(timezone.utc),
                )
            )

    return UserProfile(
        id=p["id"],
        username=p["username"],
        avatar_url=p.get("avatar_url"),
        total_xp=p.get("total_xp", 0),
        current_streak=p.get("current_streak", 0),
        longest_streak=p.get("longest_streak", 0),
        badges=badges_items,
        solved_count=solves,
        created_at=p.get("created_at", datetime.now(timezone.utc)),
    )
