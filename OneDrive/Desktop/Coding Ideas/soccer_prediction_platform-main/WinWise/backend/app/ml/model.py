import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Optional
import joblib
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MatchPredictionModel:
    def __init__(self):
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.feature_columns = [
            'home_team_rating', 'away_team_rating',
            'home_form_points', 'away_form_points',
            'home_goals_scored_avg', 'home_goals_conceded_avg',
            'away_goals_scored_avg', 'away_goals_conceded_avg',
            'head_to_head_home_wins', 'head_to_head_away_wins',
            'home_win_streak', 'away_win_streak',
            'home_rest_days', 'away_rest_days',
            'is_derby', 'is_neutral_venue',
            'weather_temperature', 'weather_precipitation'
        ]

    def prepare_features(self, match_data: Dict) -> np.ndarray:
        """Prepare features for prediction"""
        features = []
        for column in self.feature_columns:
            features.append(match_data.get(column, 0))
        return np.array(features).reshape(1, -1)

    def train(self, training_data: pd.DataFrame) -> None:
        """Train the model with historical match data"""
        try:
            X = training_data[self.feature_columns]
            y = training_data['result']  # 1: home win, 0: draw, -1: away win

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Train model
            self.model.fit(X_scaled, y)
            logger.info("Model training completed successfully")

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def predict(self, match_data: Dict) -> Dict[str, float]:
        """Make prediction for a match"""
        try:
            # Prepare features
            features = self.prepare_features(match_data)
            features_scaled = self.scaler.transform(features)

            # Get predicted probabilities
            probabilities = self.model.predict_proba(features_scaled)[0]

            # Calculate confidence score
            confidence = np.max(probabilities)

            # Get feature importances for this prediction
            importances = dict(zip(
                self.feature_columns,
                self.model.feature_importances_
            ))

            return {
                'home_win_probability': float(probabilities[0]),
                'draw_probability': float(probabilities[1]),
                'away_win_probability': float(probabilities[2]),
                'confidence': float(confidence),
                'feature_importance': importances,
                'prediction': ['HOME_WIN', 'DRAW', 'AWAY_WIN'][np.argmax(probabilities)]
            }

        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise

    def evaluate_prediction_quality(self, prediction: Dict[str, float], odds: Dict[str, float]) -> Dict[str, float]:
        """Evaluate prediction quality and potential value"""
        try:
            # Calculate implied probabilities from odds
            total_implied_prob = sum(1/odd for odd in odds.values())
            market_probabilities = {
                k: (1/v)/total_implied_prob 
                for k, v in odds.items()
            }

            # Calculate edge (difference between our prob and market prob)
            edges = {
                k: prediction[f"{k.lower()}_probability"] - market_probabilities[k]
                for k in ['HOME_WIN', 'DRAW', 'AWAY_WIN']
            }

            # Calculate Kelly criterion for optimal stake
            max_edge_outcome = max(edges.items(), key=lambda x: x[1])
            if max_edge_outcome[1] > 0:
                kelly_fraction = (
                    odds[max_edge_outcome[0]] * prediction[f"{max_edge_outcome[0].lower()}_probability"] - 1
                ) / (odds[max_edge_outcome[0]] - 1)
            else:
                kelly_fraction = 0

            return {
                'best_bet': max_edge_outcome[0],
                'edge': max_edge_outcome[1],
                'kelly_fraction': max(0, min(kelly_fraction, 0.1)),  # Cap at 10%
                'value_rating': max_edge_outcome[1] * prediction['confidence'],
                'market_efficiency': 1 - abs(1 - total_implied_prob)
            }

        except Exception as e:
            logger.error(f"Error evaluating prediction quality: {str(e)}")
            raise

    def save_model(self, path: str) -> None:
        """Save model to disk"""
        try:
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler,
                'feature_columns': self.feature_columns
            }, path)
            logger.info(f"Model saved successfully to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path: str) -> None:
        """Load model from disk"""
        try:
            model_data = joblib.load(path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['feature_columns']
            logger.info(f"Model loaded successfully from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise 