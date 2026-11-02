from fastapi import APIRouter

from phase2.app.api.v1.leaderboard import router as leaderboard_router
from phase2.app.api.v1.profile import router as profile_router
from phase3.app.api.v1.challenges import router as challenges_router
from phase3.app.api.v1.execute import router as execute_router

api_v1_router = APIRouter(prefix="/api/v1")

# Include profile routes (GET /me)
api_v1_router.include_router(profile_router)

# Include challenges routes (GET /challenges, GET /challenges/{id}, GET /challenges/daily/tier9)
api_v1_router.include_router(challenges_router)

# Include execute route with rate limiter, evaluator depth & anti-cheat (POST /execute)
api_v1_router.include_router(execute_router)

# Include leaderboard routes (GET /leaderboard/all_time)
api_v1_router.include_router(leaderboard_router)
