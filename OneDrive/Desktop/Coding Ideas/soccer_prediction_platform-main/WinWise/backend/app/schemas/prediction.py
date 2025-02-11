from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from app.models.prediction import PredictionStatus, PredictionType
from app.schemas.match import Match
from app.schemas.user import User

class PredictionBase(BaseModel):
    match_id: str
    prediction_type: PredictionType = PredictionType.MATCH_WINNER
    predicted_outcome: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    stake_amount: float = Field(default=0.0, ge=0.0)
    odds: Optional[float] = None

class PredictionCreate(PredictionBase):
    pass

class PredictionUpdate(BaseModel):
    prediction_type: Optional[PredictionType] = None
    predicted_outcome: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    stake_amount: Optional[float] = Field(None, ge=0.0)
    odds: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

class PredictionInDBBase(PredictionBase):
    id: int
    user_id: int
    status: PredictionStatus
    potential_return: float = 0.0
    analysis_factors: Optional[Dict[str, Any]] = None
    model_version: Optional[str] = None
    features_used: Optional[Dict[str, Any]] = None
    points_earned: int = 0
    profit_loss: float = 0.0
    prediction_time: datetime
    settlement_time: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Prediction(PredictionInDBBase):
    """Return model for prediction data"""
    user: User
    match: Match

class PredictionStats(BaseModel):
    """Statistics for predictions"""
    total_predictions: int
    correct_predictions: int
    incorrect_predictions: int
    pending_predictions: int
    total_points: int
    total_profit_loss: float
    accuracy_rate: float
    roi: float
    best_streak: int
    current_streak: int
    average_odds: float
    average_confidence: float

class DoubleChancePrediction(BaseModel):
    probability: float = Field(ge=0.0, le=1.0)
    prediction: bool
    confidence: float = Field(ge=0.0, le=1.0)

class DoubleChanceOutcome(BaseModel):
    home_or_draw: DoubleChancePrediction
    draw_or_away: DoubleChancePrediction
    home_or_away: DoubleChancePrediction

class AsianHandicapPrediction(BaseModel):
    probability: float = Field(ge=0.0, le=1.0)
    prediction: bool
    confidence: float = Field(ge=0.0, le=1.0)

class AsianHandicapOutcome(BaseModel):
    line: float
    prediction: AsianHandicapPrediction

    @validator('line')
    def validate_line(cls, v):
        valid_lines = [-2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0]
        if v not in valid_lines:
            raise ValueError(f"Invalid Asian handicap line. Must be one of {valid_lines}")
        return v

class HalftimeFulltimePrediction(BaseModel):
    probability: float = Field(ge=0.0, le=1.0)
    prediction: bool
    confidence: float = Field(ge=0.0, le=1.0)

class HalftimeFulltimeOutcome(BaseModel):
    combinations: Dict[str, HalftimeFulltimePrediction]
    most_likely: Dict[str, Union[str, float]]

    @validator('combinations')
    def validate_combinations(cls, v):
        valid_outcomes = ['HH', 'HD', 'HA', 'DH', 'DD', 'DA', 'AH', 'AD', 'AA']
        if not all(k in valid_outcomes for k in v.keys()):
            raise ValueError(f"Invalid HT/FT combination. Must be one of {valid_outcomes}")
        return v

class EnhancedPredictionResponse(BaseModel):
    """Enhanced prediction response including new prediction types"""
    match_id: str
    prediction_type: PredictionType
    base_prediction: Dict[str, Any]
    double_chance: Optional[DoubleChanceOutcome]
    asian_handicap: Optional[Dict[str, AsianHandicapOutcome]]
    halftime_fulltime: Optional[HalftimeFulltimeOutcome]
    confidence_score: float = Field(ge=0.0, le=1.0)
    created_at: datetime
    model_version: Optional[str]
    
    class Config:
        from_attributes = True 