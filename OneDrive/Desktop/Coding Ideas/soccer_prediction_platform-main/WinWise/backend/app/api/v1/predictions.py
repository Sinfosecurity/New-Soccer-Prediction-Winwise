from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.prediction import (
    Prediction,
    PredictionCreate,
    PredictionUpdate,
    PredictionStats
)
from app.models.prediction import Prediction as PredictionModel
from app.models.match import Match as MatchModel
from app.models.user import User

router = APIRouter()

@router.post("", response_model=Prediction)
async def create_prediction(
    prediction_in: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new prediction.
    """
    # Check if match exists and is upcoming
    match = db.query(MatchModel).filter(MatchModel.match_id == prediction_in.match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    if match.start_time <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot predict on matches that have already started"
        )
    
    # Check if user already has a prediction for this match
    existing_prediction = db.query(PredictionModel).filter(
        PredictionModel.match_id == prediction_in.match_id,
        PredictionModel.user_id == current_user.id
    ).first()
    if existing_prediction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a prediction for this match"
        )
    
    # Create prediction
    db_prediction = PredictionModel(
        **prediction_in.dict(),
        user_id=current_user.id,
        prediction_time=datetime.utcnow()
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    return db_prediction

@router.get("/me", response_model=List[Prediction])
async def get_user_predictions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's predictions.
    """
    predictions = db.query(PredictionModel).filter(
        PredictionModel.user_id == current_user.id
    ).order_by(
        PredictionModel.prediction_time.desc()
    ).offset(skip).limit(limit).all()
    return predictions

@router.get("/stats", response_model=PredictionStats)
async def get_prediction_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get prediction statistics for current user.
    """
    # Get all user predictions
    predictions = db.query(PredictionModel).filter(
        PredictionModel.user_id == current_user.id
    ).all()
    
    # Calculate statistics
    total_predictions = len(predictions)
    correct_predictions = sum(1 for p in predictions if p.status == "correct")
    incorrect_predictions = sum(1 for p in predictions if p.status == "incorrect")
    pending_predictions = sum(1 for p in predictions if p.status == "pending")
    
    total_points = sum(p.points_earned for p in predictions)
    total_profit_loss = sum(p.profit_loss for p in predictions)
    
    # Calculate streaks and averages
    current_streak = 0
    best_streak = 0
    streak_count = 0
    total_odds = 0
    total_confidence = 0
    
    for p in sorted(predictions, key=lambda x: x.prediction_time):
        if p.status == "correct":
            streak_count += 1
            current_streak = streak_count
            best_streak = max(best_streak, streak_count)
        elif p.status == "incorrect":
            streak_count = 0
            current_streak = 0
        
        if p.odds:
            total_odds += p.odds
        total_confidence += p.confidence_score
    
    return PredictionStats(
        total_predictions=total_predictions,
        correct_predictions=correct_predictions,
        incorrect_predictions=incorrect_predictions,
        pending_predictions=pending_predictions,
        total_points=total_points,
        total_profit_loss=total_profit_loss,
        accuracy_rate=correct_predictions / total_predictions * 100 if total_predictions > 0 else 0,
        roi=total_profit_loss / total_predictions if total_predictions > 0 else 0,
        best_streak=best_streak,
        current_streak=current_streak,
        average_odds=total_odds / total_predictions if total_predictions > 0 else 0,
        average_confidence=total_confidence / total_predictions if total_predictions > 0 else 0
    )

@router.put("/{prediction_id}", response_model=Prediction)
async def update_prediction(
    prediction_id: int,
    prediction_in: PredictionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update prediction.
    """
    prediction = db.query(PredictionModel).filter(
        PredictionModel.id == prediction_id,
        PredictionModel.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    # Check if match has started
    if prediction.match.start_time <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update prediction after match has started"
        )
    
    # Update prediction
    for field, value in prediction_in.dict(exclude_unset=True).items():
        setattr(prediction, field, value)
    
    db.commit()
    db.refresh(prediction)
    return prediction 