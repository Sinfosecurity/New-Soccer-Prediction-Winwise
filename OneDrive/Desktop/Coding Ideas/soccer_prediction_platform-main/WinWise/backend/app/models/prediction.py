from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel
from datetime import datetime

class PredictionStatus(str, enum.Enum):
    PENDING = "pending"
    CORRECT = "correct"
    INCORRECT = "incorrect"
    VOID = "void"
    PARTIALLY_CORRECT = "partially_correct"  # For multi-part predictions

class PredictionType(str, enum.Enum):
    MATCH_WINNER = "match_winner"
    OVER_UNDER = "over_under"
    BOTH_TEAMS_TO_SCORE = "both_teams_to_score"
    CORRECT_SCORE = "correct_score"
    HANDICAP = "handicap"

class Prediction(BaseModel):
    __tablename__ = "predictions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(String, ForeignKey("matches.match_id"), nullable=False)
    sport_id = Column(Integer, ForeignKey("sports.id"), nullable=False)
    
    # Flexible prediction fields to support different sports
    prediction_data = Column(JSON, nullable=False)  # Sport-specific prediction details
    confidence_score = Column(Float, nullable=False)
    stake_amount = Column(Float, default=0.0)
    potential_return = Column(Float, default=0.0)
    odds_data = Column(JSON)  # Store complete odds information
    status = Column(Enum(PredictionStatus), default=PredictionStatus.PENDING)
    
    # Analysis data
    analysis_factors = Column(JSON)  # Factors that influenced the prediction
    model_version = Column(String)  # Version of the ML model used
    features_used = Column(JSON)  # Features used in prediction
    
    # Performance tracking
    points_earned = Column(Integer, default=0)
    profit_loss = Column(Float, default=0.0)
    performance_metrics = Column(JSON)  # Sport-specific performance metrics
    
    # Timestamps
    prediction_time = Column(DateTime, nullable=False)
    settlement_time = Column(DateTime)
    
    # Metadata
    notes = Column(String)
    tags = Column(String)  # Comma-separated tags for categorization
    metadata = Column(JSON)  # Additional sport-specific metadata
    
    # Relationships
    user = relationship("User", back_populates="predictions")
    match = relationship("Match", back_populates="predictions")
    sport = relationship("Sport")

    def __repr__(self):
        return f"<Prediction {self.match_id} - {self.sport.name}>"

    @property
    def is_settled(self):
        return self.status != PredictionStatus.PENDING

    @property
    def roi(self):
        """Calculate Return on Investment"""
        if self.stake_amount == 0:
            return 0
        return (self.profit_loss / self.stake_amount) * 100

    def settle_prediction(self, actual_result: dict):
        """Settle the prediction based on the actual result"""
        if not self.prediction_data or not actual_result:
            raise ValueError("Missing prediction or result data")

        # Get sport-specific settlement logic
        settlement_result = self._get_sport_settlement_logic(actual_result)
        
        self.status = settlement_result["status"]
        self.profit_loss = settlement_result["profit_loss"]
        self.points_earned = settlement_result["points_earned"]
        self.performance_metrics = settlement_result["performance_metrics"]
        self.settlement_time = datetime.utcnow()

    def _get_sport_settlement_logic(self, actual_result: dict) -> dict:
        """Get sport-specific settlement logic"""
        # This would be implemented differently for each sport
        # Could be extended using a strategy pattern or similar
        return {
            "status": PredictionStatus.PENDING,
            "profit_loss": 0,
            "points_earned": 0,
            "performance_metrics": {}
        } 