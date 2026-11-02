"""
Phase 5.5: Entitlements Service
Resolves student tier through dual-track hierarchy:
effective_tier = max(individual_tier, academy_tier)
Ensures student never drops below their individual tier if academy lapses.
"""

from typing import Dict, Any, Optional

TIER_RANKS = {
    "free": 0,
    "premium": 1,
    "pro": 2,
}


def rank_to_tier(rank: int) -> str:
    for tier, r in TIER_RANKS.items():
        if r == rank:
            return tier
    return "free"


class EntitlementsService:
    def resolve_effective_tier(
        self,
        individual_tier: str,
        academy_tier: Optional[str] = None,
        academy_active: bool = False,
    ) -> str:
        ind_clean = (individual_tier or "free").lower().strip()
        ind_rank = TIER_RANKS.get(ind_clean, 0)

        acad_rank = 0
        if academy_active and academy_tier:
            acad_clean = academy_tier.lower().strip()
            acad_rank = TIER_RANKS.get(acad_clean, 0)

        # Max resolution
        effective_rank = max(ind_rank, acad_rank)
        return rank_to_tier(effective_rank)

    def get_entitlements(
        self,
        user_id: str,
        individual_tier: str,
        academy_tier: Optional[str] = None,
        academy_active: bool = False,
    ) -> Dict[str, Any]:
        effective = self.resolve_effective_tier(
            individual_tier, academy_tier, academy_active
        )

        unlocked_tiers = list(range(1, 11)) if effective in ("premium", "pro") else list(range(1, 6))
        hints_per_day = 5 if effective == "pro" else (3 if effective == "premium" else 1)
        freezes_per_month = 3 if effective == "pro" else (1 if effective == "premium" else 0)
        has_all_leaderboards = effective in ("premium", "pro")

        return {
            "user_id": user_id,
            "individual_tier": individual_tier,
            "academy_tier": academy_tier if academy_active else None,
            "effective_tier": effective,
            "unlocked_tiers": unlocked_tiers,
            "hints_per_day": hints_per_day,
            "freezes_per_month": freezes_per_month,
            "has_all_leaderboards": has_all_leaderboards,
        }
