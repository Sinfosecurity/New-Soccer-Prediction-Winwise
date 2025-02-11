from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import httpx
import asyncio
import logging
from app.models.match import Match, Team, MatchStatus
from app.ml.model import MatchPredictionModel
from app.core.config import settings

logger = logging.getLogger(__name__)

class MatchService:
    def __init__(self, db: Session):
        self.db = db
        self.prediction_model = MatchPredictionModel()
        try:
            self.prediction_model.load_model(settings.MODEL_PATH)
        except Exception as e:
            logger.error(f"Error loading prediction model: {str(e)}")
            # Initialize new model if loading fails
            pass

    async def fetch_live_match_data(self, match_id: str) -> Dict:
        """Fetch live match data from external API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.FOOTBALL_API_URL}/matches/{match_id}/live",
                    headers={"X-API-Key": settings.FOOTBALL_API_KEY}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching live match data: {str(e)}")
            raise

    async def fetch_odds_data(self, match_id: str) -> Dict:
        """Fetch latest odds from betting API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.ODDS_API_URL}/matches/{match_id}/odds",
                    headers={"X-API-Key": settings.ODDS_API_KEY}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching odds data: {str(e)}")
            raise

    async def update_match_status(self, match_id: str) -> Match:
        """Update match status with live data"""
        try:
            match = self.db.query(Match).filter(Match.match_id == match_id).first()
            if not match:
                raise ValueError(f"Match {match_id} not found")

            # Fetch live data
            live_data = await self.fetch_live_match_data(match_id)
            
            # Update match data
            match.status = MatchStatus(live_data['status'])
            match.home_score = live_data['score']['home']
            match.away_score = live_data['score']['away']
            match.stats_data = live_data['stats']
            
            # Update weather data if available
            if 'weather' in live_data:
                match.weather_data = live_data['weather']

            self.db.commit()
            return match

        except Exception as e:
            logger.error(f"Error updating match status: {str(e)}")
            raise

    async def update_odds(self, match_id: str) -> Dict:
        """Update match odds and check for value bets"""
        try:
            match = self.db.query(Match).filter(Match.match_id == match_id).first()
            if not match:
                raise ValueError(f"Match {match_id} not found")

            # Fetch latest odds
            odds_data = await self.fetch_odds_data(match_id)
            
            # Get current prediction
            prediction = self.prediction_model.predict(self._prepare_match_features(match))
            
            # Evaluate prediction quality with new odds
            value_analysis = self.prediction_model.evaluate_prediction_quality(
                prediction,
                odds_data['odds']
            )

            # Update match data
            match.odds_data = odds_data
            self.db.commit()

            return {
                'odds': odds_data,
                'prediction': prediction,
                'value_analysis': value_analysis
            }

        except Exception as e:
            logger.error(f"Error updating odds: {str(e)}")
            raise

    def _prepare_match_features(self, match: Match) -> Dict:
        """Prepare match features for prediction"""
        try:
            home_team = match.home_team
            away_team = match.away_team

            # Calculate form points (last 5 matches)
            home_form = self._calculate_form_points(home_team)
            away_form = self._calculate_form_points(away_team)

            # Calculate head-to-head stats
            h2h_stats = self._calculate_head_to_head_stats(home_team.id, away_team.id)

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
                'home_rest_days': self._calculate_rest_days(home_team.id),
                'away_rest_days': self._calculate_rest_days(away_team.id),
                'is_derby': home_team.league == away_team.league,
                'is_neutral_venue': False,  # TODO: Implement logic for neutral venues
                'weather_temperature': match.weather_data.get('temperature', 20),
                'weather_precipitation': match.weather_data.get('precipitation', 0)
            }

        except Exception as e:
            logger.error(f"Error preparing match features: {str(e)}")
            raise

    def _calculate_form_points(self, team: Team) -> Dict:
        """Calculate team's form based on last 5 matches"""
        try:
            recent_matches = (
                self.db.query(Match)
                .filter(
                    (Match.home_team_id == team.id) | (Match.away_team_id == team.id),
                    Match.status == MatchStatus.COMPLETED
                )
                .order_by(Match.start_time.desc())
                .limit(5)
                .all()
            )

            points = 0
            goals_scored = 0
            goals_conceded = 0
            win_streak = 0
            current_streak = 0

            for match in recent_matches:
                is_home = match.home_team_id == team.id
                team_score = match.home_score if is_home else match.away_score
                opponent_score = match.away_score if is_home else match.home_score

                goals_scored += team_score
                goals_conceded += opponent_score

                if team_score > opponent_score:
                    points += 3
                    current_streak += 1
                    win_streak = max(win_streak, current_streak)
                elif team_score == opponent_score:
                    points += 1
                    current_streak = 0
                else:
                    current_streak = 0

            num_matches = len(recent_matches) or 1
            return {
                'points': points,
                'goals_scored_avg': goals_scored / num_matches,
                'goals_conceded_avg': goals_conceded / num_matches,
                'win_streak': win_streak
            }

        except Exception as e:
            logger.error(f"Error calculating form points: {str(e)}")
            raise

    def _calculate_head_to_head_stats(self, home_team_id: int, away_team_id: int) -> Dict:
        """Calculate head-to-head statistics"""
        try:
            h2h_matches = (
                self.db.query(Match)
                .filter(
                    ((Match.home_team_id == home_team_id) & 
                     (Match.away_team_id == away_team_id)) |
                    ((Match.home_team_id == away_team_id) & 
                     (Match.away_team_id == home_team_id)),
                    Match.status == MatchStatus.COMPLETED
                )
                .order_by(Match.start_time.desc())
                .limit(10)
                .all()
            )

            home_wins = 0
            away_wins = 0

            for match in h2h_matches:
                if match.home_score > match.away_score:
                    if match.home_team_id == home_team_id:
                        home_wins += 1
                    else:
                        away_wins += 1
                elif match.home_score < match.away_score:
                    if match.home_team_id == home_team_id:
                        away_wins += 1
                    else:
                        home_wins += 1

            return {
                'home_wins': home_wins,
                'away_wins': away_wins,
                'draws': len(h2h_matches) - home_wins - away_wins
            }

        except Exception as e:
            logger.error(f"Error calculating head-to-head stats: {str(e)}")
            raise

    def _calculate_rest_days(self, team_id: int) -> int:
        """Calculate days since team's last match"""
        try:
            last_match = (
                self.db.query(Match)
                .filter(
                    (Match.home_team_id == team_id) | (Match.away_team_id == team_id),
                    Match.status == MatchStatus.COMPLETED
                )
                .order_by(Match.start_time.desc())
                .first()
            )

            if not last_match:
                return 7  # Default to 7 days if no previous match found

            days_since_last_match = (datetime.utcnow() - last_match.start_time).days
            return min(days_since_last_match, 14)  # Cap at 14 days

        except Exception as e:
            logger.error(f"Error calculating rest days: {str(e)}")
            raise 