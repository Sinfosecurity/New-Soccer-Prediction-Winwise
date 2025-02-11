from abc import ABC, abstractmethod
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.match import Match
from app.models.team import Team
from app.models.prediction import Prediction
from app.ml.model import MatchPredictionModel

class BaseSportService(ABC):
    """Abstract base class for sport-specific services"""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = self._get_prediction_model()
    
    @abstractmethod
    async def fetch_live_match_data(self, match_id: str) -> Dict:
        """Fetch live match data from external API"""
        pass
    
    @abstractmethod
    async def fetch_odds_data(self, match_id: str) -> Dict:
        """Fetch latest odds from betting API"""
        pass
    
    @abstractmethod
    def prepare_match_features(self, match: Match) -> Dict:
        """Prepare features for match prediction"""
        pass
    
    @abstractmethod
    def calculate_team_form(self, team: Team) -> Dict:
        """Calculate team's recent form"""
        pass
    
    @abstractmethod
    def calculate_head_to_head_stats(self, team1_id: int, team2_id: int) -> Dict:
        """Calculate head-to-head statistics between teams"""
        pass
    
    @abstractmethod
    def validate_prediction(self, prediction_data: Dict) -> bool:
        """Validate prediction data for the specific sport"""
        pass
    
    @abstractmethod
    def settle_prediction(self, prediction: Prediction, match: Match) -> Dict:
        """Settle prediction based on match result"""
        pass
    
    @abstractmethod
    def _get_sport_code(self) -> str:
        """Get the sport code (e.g., 'soccer', 'basketball')"""
        pass
    
    @abstractmethod
    def _get_prediction_model(self) -> MatchPredictionModel:
        """Get the appropriate prediction model for the sport"""
        pass
    
    def get_recent_matches(self, team_id: int, limit: int = 5) -> List[Match]:
        """Get recent matches for a team"""
        return (
            self.db.query(Match)
            .filter(
                (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
                Match.status == "completed"
            )
            .order_by(Match.start_time.desc())
            .limit(limit)
            .all()
        )
    
    def calculate_rest_days(self, team_id: int) -> int:
        """Calculate days since team's last match"""
        last_match = (
            self.db.query(Match)
            .filter(
                (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
                Match.status == "completed"
            )
            .order_by(Match.start_time.desc())
            .first()
        )
        
        if not last_match:
            return 0
            
        days_since_last_match = (datetime.utcnow() - last_match.start_time).days
        return max(0, days_since_last_match)
    
    def analyze_value_opportunities(self, prediction: Dict, odds_data: Dict) -> Dict:
        """Analyze betting value opportunities"""
        value_bets = {}
        for outcome, probability in prediction.items():
            if outcome in odds_data:
                implied_probability = 1 / odds_data[outcome]
                edge = probability - implied_probability
                if edge > 0:
                    value_bets[outcome] = {
                        "edge": edge,
                        "recommended_stake": self._calculate_recommended_stake(edge, probability),
                        "expected_value": edge * odds_data[outcome]
                    }
        return value_bets
    
    def _calculate_recommended_stake(self, edge: float, probability: float) -> float:
        """Calculate recommended stake using Kelly Criterion"""
        # Using a fractional Kelly (1/4) for more conservative betting
        kelly_fraction = 0.25
        kelly_stake = kelly_fraction * ((probability * (odds - 1)) - (1 - probability)) / (odds - 1)
        return max(0, min(0.1, kelly_stake))  # Cap at 10% of bankroll
    
    def calculate_prediction_confidence(self, features: Dict, historical_accuracy: float) -> float:
        """Calculate confidence score for prediction"""
        base_confidence = self.model.predict_proba(features).max()
        
        # Adjust confidence based on historical accuracy
        adjusted_confidence = base_confidence * historical_accuracy
        
        # Apply confidence modifiers based on feature reliability
        feature_weights = self._get_feature_weights()
        feature_confidence = sum(
            feature_weights.get(feature, 1.0) * value 
            for feature, value in features.items()
        ) / len(features)
        
        final_confidence = (adjusted_confidence + feature_confidence) / 2
        return min(1.0, max(0.0, final_confidence))
    
    def _get_feature_weights(self) -> Dict[str, float]:
        """Get feature importance weights"""
        return {
            "team_form": 1.2,
            "head_to_head": 1.1,
            "rest_days": 0.9,
            "home_advantage": 1.0,
            "recent_performance": 1.1,
            "weather_impact": 0.8
        } 