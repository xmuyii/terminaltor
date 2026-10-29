from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.v1.challenges import router as challenges_router
from app.api.v1.execute import router as execute_router
from app.models.schemas import UserProfile

api_v1_router = APIRouter(prefix="/api/v1")


@api_v1_router.get("/me", response_model=UserProfile, tags=["auth"])
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return current_user


api_v1_router.include_router(challenges_router)
api_v1_router.include_router(execute_router)
