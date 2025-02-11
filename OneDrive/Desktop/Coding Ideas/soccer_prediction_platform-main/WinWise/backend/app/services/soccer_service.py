from typing import Dict, List, Optional
import httpx
from datetime import datetime, timedelta
from sqlalchemy import or_, and_
from app.services.base_sport_service import BaseSportService
from app.models.match import Match, Team, MatchStatus
from app.models.prediction import Prediction, PredictionStatus
from app.core.config import settings
from app.ml.soccer_model import SoccerPredictionModel
from app.services.ai_prediction_service import AIPredictionService

class SoccerService(BaseSportService):
    """Service for handling soccer-specific logic"""

    def __init__(self, db):
        super().__init__(db)
        self.prediction_model = SoccerPredictionModel()
        self.ai_prediction_service = AIPredictionService()
        try:
            self.prediction_model.load_model(settings.SOCCER_MODEL_PATH)
        except Exception as e:
            self.logger.warning(f"Failed to load soccer model: {e}")
            # Initialize new model if loading fails
            pass

    async def fetch_live_match_data(self, match_id: str) -> Dict:
        """Fetch live soccer match data"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.FOOTBALL_API_URL}/matches/{match_id}/live",
                headers={"X-API-Key": settings.FOOTBALL_API_KEY}
            )
            response.raise_for_status()
            return response.json()

    async def fetch_odds_data(self, match_id: str) -> Dict:
        """Fetch soccer betting odds"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ODDS_API_URL}/matches/{match_id}/odds",
                headers={"X-API-Key": settings.ODDS_API_KEY}
            )
            response.raise_for_status()
            return response.json()

    def prepare_match_features(self, match: Match) -> Dict:
        """Prepare soccer-specific match features"""
        home_team = match.home_team
        away_team = match.away_team

        # Calculate form and stats
        home_form = self.calculate_team_form(home_team)
        away_form = self.calculate_team_form(away_team)
        h2h_stats = self.calculate_head_to_head_stats(home_team.id, away_team.id)
        
        # Calculate rest days using base class method
        home_rest_days = self.calculate_rest_days(home_team.id)
        away_rest_days = self.calculate_rest_days(away_team.id)

        return {
            'home_team_rating': home_team.rating,
            'away_team_rating': away_team.rating,
            'home_form_points': home_form['points'],
            'away_form_points': away_form['points'],
            'home_goals_scored_avg': home_form['goals_scored_avg'],
            'home_goals_conceded_avg': home_form['goals_conceded_avg'],
            'away_goals_scored_avg': away_form['goals_scored_avg'],
            'away_goals_conceded_avg': away_form['goals_conceded_avg'],
            'head_to_head_home_wins': h2h_stats['home_wins'],
            'head_to_head_away_wins': h2h_stats['away_wins'],
            'home_win_streak': home_form['win_streak'],
            'away_win_streak': away_form['win_streak'],
            'home_rest_days': home_rest_days,
            'away_rest_days': away_rest_days,
            'is_derby': home_team.league == away_team.league,
            'weather_impact': self._calculate_weather_impact(match.weather_data)
        }

    def calculate_team_form(self, team: Team) -> Dict:
        """Calculate soccer team's recent form"""
        recent_matches = self.get_recent_matches(team.id, limit=5)

        stats = {
            'points': 0,
            'goals_scored': 0,
            'goals_conceded': 0,
            'win_streak': 0,
            'current_streak': 0
        }

        for match in recent_matches:
            is_home = match.home_team_id == team.id
            team_score = match.score_data['home' if is_home else 'away']
            opponent_score = match.score_data['away' if is_home else 'home']

            stats['goals_scored'] += team_score
            stats['goals_conceded'] += opponent_score

            if team_score > opponent_score:
                stats['points'] += 3
                stats['current_streak'] += 1
                stats['win_streak'] = max(stats['win_streak'], stats['current_streak'])
            elif team_score == opponent_score:
                stats['points'] += 1
                stats['current_streak'] = 0
            else:
                stats['current_streak'] = 0

        num_matches = len(recent_matches) or 1
        return {
            'points': stats['points'],
            'goals_scored_avg': stats['goals_scored'] / num_matches,
            'goals_conceded_avg': stats['goals_conceded'] / num_matches,
            'win_streak': stats['win_streak']
        }

    def calculate_head_to_head_stats(self, team1_id: int, team2_id: int) -> Dict:
        """Calculate head-to-head soccer statistics"""
        h2h_matches = (
            self.db.query(Match)
            .filter(
                and_(
                    or_(
                        and_(Match.home_team_id == team1_id, Match.away_team_id == team2_id),
                        and_(Match.home_team_id == team2_id, Match.away_team_id == team1_id)
                    ),
                    Match.status == MatchStatus.COMPLETED
                )
            )
            .order_by(Match.start_time.desc())
            .limit(10)
            .all()
        )

        stats = {'home_wins': 0, 'away_wins': 0, 'draws': 0}
        for match in h2h_matches:
            if match.score_data['home'] > match.score_data['away']:
                if match.home_team_id == team1_id:
                    stats['home_wins'] += 1
                else:
                    stats['away_wins'] += 1
            elif match.score_data['home'] < match.score_data['away']:
                if match.home_team_id == team1_id:
                    stats['away_wins'] += 1
                else:
                    stats['home_wins'] += 1
            else:
                stats['draws'] += 1

        return stats

    def validate_prediction(self, prediction_data: Dict) -> bool:
        """Validate soccer prediction data"""
        required_fields = ['outcome', 'score_prediction']
        if not all(field in prediction_data for field in required_fields):
            return False

        valid_outcomes = ['home_win', 'away_win', 'draw']
        if prediction_data['outcome'] not in valid_outcomes:
            return False

        score_prediction = prediction_data['score_prediction']
        if not isinstance(score_prediction, dict) or 'home' not in score_prediction or 'away' not in score_prediction:
            return False

        return True

    def settle_prediction(self, prediction: Prediction, match: Match) -> Dict:
        """Settle soccer prediction"""
        if not match.is_finished:
            return {
                'status': PredictionStatus.PENDING,
                'profit_loss': 0,
                'points_earned': 0,
                'performance_metrics': {}
            }

        actual_score = match.score_data
        predicted_outcome = prediction.prediction_data['outcome']
        actual_outcome = self._get_match_outcome(actual_score)

        # Calculate basic settlement
        if predicted_outcome == actual_outcome:
            status = PredictionStatus.CORRECT
            profit_loss = prediction.potential_return - prediction.stake_amount
            points_earned = 10
        else:
            status = PredictionStatus.INCORRECT
            profit_loss = -prediction.stake_amount
            points_earned = 0

        # Calculate additional performance metrics
        performance_metrics = {
            'score_accuracy': self._calculate_score_accuracy(
                prediction.prediction_data['score_prediction'],
                actual_score
            ),
            'goal_difference_accuracy': self._calculate_goal_difference_accuracy(
                prediction.prediction_data['score_prediction'],
                actual_score
            )
        }

        return {
            'status': status,
            'profit_loss': profit_loss,
            'points_earned': points_earned,
            'performance_metrics': performance_metrics
        }

    def _get_sport_code(self) -> str:
        """Get the sport code"""
        return "soccer"

    def _get_prediction_model(self):
        """Get the soccer prediction model"""
        return self.prediction_model

    def _calculate_weather_impact(self, weather_data: Optional[Dict]) -> float:
        """Calculate weather impact on soccer match"""
        if not weather_data:
            return 0.0

        impact = 0.0
        if 'precipitation' in weather_data:
            impact -= weather_data['precipitation'] * 0.1  # Rain reduces scoring
        if 'wind_speed' in weather_data:
            impact -= weather_data['wind_speed'] * 0.05  # Wind affects play
        return max(-1.0, min(1.0, impact))  # Normalize between -1 and 1

    def _get_match_outcome(self, score_data: Dict) -> str:
        """Get match outcome from score"""
        if score_data['home'] > score_data['away']:
            return 'home_win'
        elif score_data['home'] < score_data['away']:
            return 'away_win'
        return 'draw'

    def _calculate_score_accuracy(self, predicted_score: Dict, actual_score: Dict) -> float:
        """Calculate accuracy of score prediction"""
        max_diff = 5  # Maximum reasonable goal difference
        home_diff = abs(predicted_score['home'] - actual_score['home'])
        away_diff = abs(predicted_score['away'] - actual_score['away'])
        return 1 - ((home_diff + away_diff) / (2 * max_diff))

    def _calculate_goal_difference_accuracy(self, predicted_score: Dict, actual_score: Dict) -> float:
        """Calculate accuracy of predicted goal difference"""
        predicted_diff = predicted_score['home'] - predicted_score['away']
        actual_diff = actual_score['home'] - actual_score['away']
        max_diff = 5  # Maximum reasonable goal difference
        return 1 - (abs(predicted_diff - actual_diff) / (2 * max_diff))

    async def get_match_prediction(self, match: Match) -> Dict:
        """Get comprehensive match prediction combining statistical and AI models"""
        # Get statistical model prediction
        features = self.prepare_match_features(match)
        statistical_prediction = self.prediction_model.predict(features)
        
        if not settings.AI_PREDICTION_ENABLED:
            return statistical_prediction
            
        try:
            # Get AI ensemble prediction
            match_data = self._prepare_match_data_for_ai(match)
            ai_prediction = await self.ai_prediction_service.get_ensemble_prediction(match_data)
            
            if ai_prediction and ai_prediction["confidence"] >= settings.AI_CONFIDENCE_THRESHOLD:
                # Combine predictions if AI confidence is high enough
                return self._combine_predictions(statistical_prediction, ai_prediction)
        except Exception as e:
            self.logger.error(f"Error getting AI prediction: {str(e)}")
            
        return statistical_prediction

    def _prepare_match_data_for_ai(self, match: Match) -> Dict:
        """Prepare match data for AI prediction"""
        home_form = self.calculate_team_form(match.home_team)
        away_form = self.calculate_team_form(match.away_team)
        h2h_stats = self.calculate_head_to_head_stats(match.home_team_id, match.away_team_id)
        
        return {
            "home_team": match.home_team.name,
            "away_team": match.away_team.name,
            "competition": match.competition,
            "home_form": self._format_form_for_ai(home_form),
            "away_form": self._format_form_for_ai(away_form),
            "home_goals_scored_avg": home_form["goals_scored_avg"],
            "home_goals_conceded_avg": home_form["goals_conceded_avg"],
            "away_goals_scored_avg": away_form["goals_scored_avg"],
            "away_goals_conceded_avg": away_form["goals_conceded_avg"],
            "home_team_rating": match.home_team.rating,
            "away_team_rating": match.away_team.rating,
            "head_to_head_stats": self._format_h2h_for_ai(h2h_stats),
            "weather_data": match.weather_data,
            "home_rest_days": self.calculate_rest_days(match.home_team_id),
            "away_rest_days": self.calculate_rest_days(match.away_team_id)
        }

    def _format_form_for_ai(self, form_data: Dict) -> str:
        """Format team form data for AI consumption"""
        return (
            f"Points: {form_data['points']}, "
            f"Goals Scored (avg): {form_data['goals_scored_avg']:.2f}, "
            f"Goals Conceded (avg): {form_data['goals_conceded_avg']:.2f}, "
            f"Win Streak: {form_data['win_streak']}"
        )

    def _format_h2h_for_ai(self, h2h_stats: Dict) -> str:
        """Format head-to-head stats for AI consumption"""
        total_matches = h2h_stats['home_wins'] + h2h_stats['away_wins'] + h2h_stats.get('draws', 0)
        return (
            f"Total Matches: {total_matches}, "
            f"Home Team Wins: {h2h_stats['home_wins']}, "
            f"Away Team Wins: {h2h_stats['away_wins']}, "
            f"Draws: {h2h_stats.get('draws', 0)}"
        )

    def _combine_predictions(self, statistical_pred: Dict, ai_pred: Dict) -> Dict:
        """Combine statistical and AI predictions"""
        # Weight the predictions based on configuration
        stat_weight = settings.STATISTICAL_MODEL_WEIGHT
        ai_weight = settings.AI_MODEL_WEIGHT
        
        # Combine confidence scores
        combined_confidence = (
            statistical_pred["confidence"] * stat_weight +
            ai_pred["confidence"] * ai_weight
        )
        
        # Combine score predictions
        combined_scores = {
            "home": round(
                statistical_pred["score_prediction"]["home"] * stat_weight +
                ai_pred["score_prediction"]["home"] * ai_weight
            ),
            "away": round(
                statistical_pred["score_prediction"]["away"] * stat_weight +
                ai_pred["score_prediction"]["away"] * ai_weight
            )
        }
        
        # Check prediction agreement
        models_agree = statistical_pred["predicted_outcome"] == ai_pred["predicted_outcome"]
        
        # Use statistical prediction if models disagree and agreement threshold not met
        if not models_agree and combined_confidence < settings.MIN_MODEL_AGREEMENT:
            return {
                **statistical_pred,
                "ai_disagreement": True,
                "ai_prediction": ai_pred["predicted_outcome"],
                "confidence": combined_confidence * 0.8  # Reduce confidence when models disagree
            }
        
        return {
            "predicted_outcome": ai_pred["predicted_outcome"] if combined_confidence >= settings.MIN_MODEL_AGREEMENT else statistical_pred["predicted_outcome"],
            "score_prediction": combined_scores,
            "confidence": combined_confidence,
            "reasoning": ai_pred["reasoning"],
            "key_factors": ai_pred["key_factors"],
            "risk_assessment": ai_pred["risk_assessment"],
            "model_agreement": models_agree,
            "statistical_prediction": statistical_pred["predicted_outcome"],
            "ai_prediction": ai_pred["predicted_outcome"]
        } 