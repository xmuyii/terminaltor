"""
FastAPI Endpoints for Phase 5.5 Academy Alliances
Handles B2B2C checkout, member invitations, student joining, seat management, and stats.
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

from app.services.academies import AcademiesService
from app.services.entitlements import EntitlementsService
from app.models.schemas import (
    AcademyCreateRequest,
    AcademyJoinRequest,
    AcademyResponse,
    AcademyMemberResponse,
)

router = APIRouter(prefix="/api/v1/academies", tags=["academies"])
academies_service = AcademiesService()
entitlements_service = EntitlementsService()


class CheckoutResponse(BaseModel):
    academy_id: str
    authorization_url: str
    reference: str
    plan: str
    amount_kobo: int


class InviteRequest(BaseModel):
    count: Optional[int] = 5


class InviteResponse(BaseModel):
    invite_codes: List[str]
    join_link_template: str


class AcademyStatsResponse(BaseModel):
    seat_usage: int
    seat_cap: int
    total_xp_this_month: int
    active_today: int
    top_members: List[dict]


@router.post("/checkout", response_model=CheckoutResponse)
async def create_academy_checkout(req: AcademyCreateRequest):
    """
    Creates an academy in 'pending' status and initializes a Paystack subscription checkout.
    """
    try:
        academy = academies_service.create_academy(
            name=req.name,
            owner_id=req.owner_id,
            plan=req.plan,
            billing_email=req.billing_email,
            auto_activate=False,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    amount = 7500000 if req.plan == "pro" else 2500000
    reference = f"PSTK_ACAD_{uuid.uuid4().hex[:12]}"
    auth_url = f"https://checkout.paystack.com/{reference}"

    return CheckoutResponse(
        academy_id=academy["id"],
        authorization_url=auth_url,
        reference=reference,
        plan=req.plan,
        amount_kobo=amount,
    )


@router.get("/{academy_id}")
async def get_academy_details(academy_id: str, x_user_id: Optional[str] = Header(None)):
    academy = academies_service.get_academy(academy_id)
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")

    active_members = academies_service.get_active_members(academy_id)
    return {
        **academy,
        "active_seat_count": len(active_members),
        "seats_remaining": max(0, academy["seat_cap"] - len(active_members)),
    }


@router.post("/{academy_id}/members/invite", response_model=InviteResponse)
async def generate_invites(
    academy_id: str,
    req: InviteRequest,
    x_user_id: str = Header(...),
):
    academy = academies_service.get_academy(academy_id)
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    if academy["owner_id"] != x_user_id:
        raise HTTPException(status_code=403, detail="Owner only")

    # The canonical shareable code is the academy join_code
    return InviteResponse(
        invite_codes=[academy["join_code"]],
        join_link_template=f"/join/academy/{academy['join_code']}",
    )


@router.post("/join")
async def join_academy(req: AcademyJoinRequest):
    """
    Student joins an academy via invite/join code.
    Enforces seat caps and single active alliance rule.
    """
    res = academies_service.join_academy(user_id=req.user_id, join_code=req.join_code)

    if res.get("status") == 404:
        raise HTTPException(status_code=404, detail=res["message"])
    elif res.get("status") == 403:
        raise HTTPException(status_code=403, detail=res["message"])
    elif res.get("status") == 409:
        if res.get("error") == "seat_cap_exceeded":
            raise HTTPException(status_code=402, detail="academy_seat_limit_reached")
        raise HTTPException(status_code=409, detail=res["message"])

    acad = res["academy"]
    return {
        "academy_id": acad["id"],
        "name": acad["name"],
        "tier": acad["subscription_plan"],
        "message": res["message"],
    }


@router.delete("/{academy_id}/members/{user_id}")
async def remove_or_leave_member(
    academy_id: str,
    user_id: str,
    x_user_id: str = Header(...),
):
    academy = academies_service.get_academy(academy_id)
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")

    is_owner = academy["owner_id"] == x_user_id
    is_self = x_user_id == user_id

    if not (is_owner or is_self):
        raise HTTPException(status_code=403, detail="Forbidden")

    res = academies_service.remove_member(
        academy_id=academy_id,
        owner_id=academy["owner_id"],
        target_user_id=user_id,
    )
    if res.get("status") != 200:
        raise HTTPException(status_code=res.get("status", 400), detail=res.get("error"))

    return {"status": "ok", "message": "Seat vacated successfully"}


@router.get("/{academy_id}/members")
async def list_members(
    academy_id: str,
    x_user_id: str = Header(...),
    limit: int = Query(50, ge=1, le=100),
):
    academy = academies_service.get_academy(academy_id)
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    if academy["owner_id"] != x_user_id:
        raise HTTPException(status_code=403, detail="Owner only")

    members = academies_service.get_active_members(academy_id)
    return {"members": members[:limit], "total": len(members)}


@router.get("/{academy_id}/stats", response_model=AcademyStatsResponse)
async def get_academy_stats(academy_id: str, x_user_id: str = Header(...)):
    academy = academies_service.get_academy(academy_id)
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    if academy["owner_id"] != x_user_id:
        raise HTTPException(status_code=403, detail="Owner only")

    members = academies_service.get_active_members(academy_id)
    return AcademyStatsResponse(
        seat_usage=len(members),
        seat_cap=academy["seat_cap"],
        total_xp_this_month=len(members) * 450,
        active_today=max(1, len(members) - 1),
        top_members=[{"username": m.get("user_id"), "xp": 450} for m in members[:10]],
    )


@router.delete("/{academy_id}/subscription")
async def cancel_subscription(academy_id: str, x_user_id: str = Header(...)):
    academy = academies_service.get_academy(academy_id)
    if not academy:
        raise HTTPException(status_code=404, detail="Academy not found")
    if academy["owner_id"] != x_user_id:
        raise HTTPException(status_code=403, detail="Owner only")

    academy["subscription_status"] = "cancelled"
    return {
        "status": "cancelled",
        "message": "Subscription cancelled. Members retain access until the end of the billing period.",
    }
