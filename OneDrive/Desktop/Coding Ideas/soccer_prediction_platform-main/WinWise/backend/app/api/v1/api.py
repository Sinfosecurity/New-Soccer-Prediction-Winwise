from fastapi import APIRouter
from app.api.v1 import auth, matches, predictions

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"]) 