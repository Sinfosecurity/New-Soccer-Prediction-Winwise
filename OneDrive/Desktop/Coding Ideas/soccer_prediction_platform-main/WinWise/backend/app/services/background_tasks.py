from typing import List
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.match import Match, MatchStatus
from app.services.match_service import MatchService
from app.core.config import settings

logger = logging.getLogger(__name__)

class BackgroundTaskService:
    def __init__(self, db: Session):
        self.db = db
        self.match_service = MatchService(db)
        self.update_intervals = {
            'live_match': 60,  # Update every 60 seconds for live matches
            'upcoming_match': 300,  # Update every 5 minutes for upcoming matches
            'odds': 180,  # Update odds every 3 minutes
            'model_training': 86400  # Retrain model daily
        }

    async def start_background_tasks(self):
        """Start all background tasks"""
        tasks = [
            self.update_live_matches(),
            self.update_upcoming_matches(),
            self.update_odds(),
            self.periodic_model_training()
        ]
        await asyncio.gather(*tasks)

    async def update_live_matches(self):
        """Update live match data periodically"""
        while True:
            try:
                live_matches = (
                    self.db.query(Match)
                    .filter(Match.status == MatchStatus.IN_PROGRESS)
                    .all()
                )

                for match in live_matches:
                    try:
                        await self.match_service.update_match_status(match.match_id)
                        logger.info(f"Updated live match data for match {match.match_id}")
                    except Exception as e:
                        logger.error(f"Error updating live match {match.match_id}: {str(e)}")

            except Exception as e:
                logger.error(f"Error in live match update loop: {str(e)}")

            await asyncio.sleep(self.update_intervals['live_match'])

    async def update_upcoming_matches(self):
        """Update upcoming match data periodically"""
        while True:
            try:
                upcoming_matches = (
                    self.db.query(Match)
                    .filter(
                        Match.status == MatchStatus.SCHEDULED,
                        Match.start_time <= datetime.utcnow() + timedelta(hours=24)
                    )
                    .all()
                )

                for match in upcoming_matches:
                    try:
                        # Check if match should start
                        if match.start_time <= datetime.utcnow():
                            match.status = MatchStatus.IN_PROGRESS
                            self.db.commit()
                            logger.info(f"Match {match.match_id} started")
                            continue

                        # Update pre-match data
                        await self.match_service.update_match_status(match.match_id)
                        logger.info(f"Updated upcoming match data for match {match.match_id}")
                    except Exception as e:
                        logger.error(f"Error updating upcoming match {match.match_id}: {str(e)}")

            except Exception as e:
                logger.error(f"Error in upcoming match update loop: {str(e)}")

            await asyncio.sleep(self.update_intervals['upcoming_match'])

    async def update_odds(self):
        """Update odds data periodically"""
        while True:
            try:
                active_matches = (
                    self.db.query(Match)
                    .filter(
                        Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.IN_PROGRESS]),
                        Match.start_time <= datetime.utcnow() + timedelta(hours=48)
                    )
                    .all()
                )

                for match in active_matches:
                    try:
                        odds_update = await self.match_service.update_odds(match.match_id)
                        
                        # Check for significant odds movements
                        if self._detect_significant_odds_movement(odds_update):
                            logger.warning(
                                f"Significant odds movement detected for match {match.match_id}"
                            )
                            # TODO: Implement notification system for significant odds movements
                        
                        logger.info(f"Updated odds for match {match.match_id}")
                    except Exception as e:
                        logger.error(f"Error updating odds for match {match.match_id}: {str(e)}")

            except Exception as e:
                logger.error(f"Error in odds update loop: {str(e)}")

            await asyncio.sleep(self.update_intervals['odds'])

    async def periodic_model_training(self):
        """Retrain the prediction model periodically"""
        while True:
            try:
                # Get completed matches since last training
                completed_matches = (
                    self.db.query(Match)
                    .filter(
                        Match.status == MatchStatus.COMPLETED,
                        Match.start_time >= datetime.utcnow() - timedelta(days=7)
                    )
                    .all()
                )

                if completed_matches:
                    # Prepare training data
                    features = []
                    labels = []
                    for match in completed_matches:
                        try:
                            match_features = self.match_service._prepare_match_features(match)
                            features.append(match_features)
                            
                            # Determine actual result (1 for home win, 0 for draw, -1 for away win)
                            if match.home_score > match.away_score:
                                result = 1
                            elif match.home_score < match.away_score:
                                result = -1
                            else:
                                result = 0
                                
                            labels.append(result)
                        except Exception as e:
                            logger.error(f"Error preparing training data for match {match.match_id}: {str(e)}")
                            continue

                    # Retrain model if enough new data
                    if len(features) >= settings.MIN_MATCHES_FOR_TRAINING:
                        self.match_service.prediction_model.train(features, labels)
                        self.match_service.prediction_model.save_model(settings.MODEL_PATH)
                        logger.info(f"Retrained model with {len(features)} new matches")

            except Exception as e:
                logger.error(f"Error in model training loop: {str(e)}")

            await asyncio.sleep(self.update_intervals['model_training'])

    def _detect_significant_odds_movement(self, odds_update: dict) -> bool:
        """Detect significant movements in betting odds"""
        try:
            # Get previous odds from database
            previous_odds = odds_update['odds'].get('previous', {})
            current_odds = odds_update['odds'].get('current', {})

            if not previous_odds or not current_odds:
                return False

            # Calculate percentage changes
            changes = {
                market: abs((current_odds[market] - previous_odds[market]) / previous_odds[market])
                for market in current_odds
                if market in previous_odds and previous_odds[market] != 0
            }

            # Check if any market has moved more than threshold
            return any(change > settings.SIGNIFICANT_ODDS_MOVEMENT_THRESHOLD 
                      for change in changes.values())

        except Exception as e:
            logger.error(f"Error detecting odds movement: {str(e)}")
            return False 