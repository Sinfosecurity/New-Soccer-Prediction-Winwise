from typing import Dict, Optional, List, Tuple, Union
import openai
import httpx
from datetime import datetime
import json
import logging
import numpy as np
from enum import Enum
from app.core.config import settings
from sklearn.metrics import mean_squared_error
from scipy import stats

logger = logging.getLogger(__name__)

class PredictionType(str, Enum):
    MATCH_OUTCOME = "match_outcome"
    EXACT_SCORE = "exact_score"
    OVER_UNDER = "over_under"
    BTTS = "both_teams_to_score"
    HANDICAP = "handicap"
    FIRST_HALF = "first_half"
    CORNERS = "corners"
    CARDS = "cards"
    POSSESSION = "possession"
    SHOTS_ON_TARGET = "shots_on_target"
    CLEAN_SHEET = "clean_sheet"
    WIN_TO_NIL = "win_to_nil"
    GOAL_TIMING = "goal_timing"
    PLAYER_GOALS = "player_goals"
    DOUBLE_CHANCE = "double_chance"
    DRAW_NO_BET = "draw_no_bet"
    ASIAN_HANDICAP = "asian_handicap"
    CORRECT_SCORE_GROUP = "correct_score_group"
    WINNING_MARGIN = "winning_margin"
    HALF_TIME_FULL_TIME = "half_time_full_time"
    TEAM_TOTAL_GOALS = "team_total_goals"
    FIRST_GOAL_SCORER = "first_goal_scorer"
    ANYTIME_GOAL_SCORER = "anytime_goal_scorer"
    SCORE_IN_BOTH_HALVES = "score_in_both_halves"
    HIGHEST_SCORING_HALF = "highest_scoring_half"
    EXACT_GOALS = "exact_goals"
    GOAL_LINE = "goal_line"
    TEAM_CLEAN_SHEET = "team_clean_sheet"
    TEAM_TO_SCORE = "team_to_score"
    GOALS_ODD_EVEN = "goals_odd_even"
    FIRST_HALF_GOALS = "first_half_goals"
    SECOND_HALF_GOALS = "second_half_goals"
    BOTH_TEAMS_SCORE_HALF = "both_teams_score_half"
    RACE_TO_GOALS = "race_to_goals"
    MINUTES_OF_FIRST_GOAL = "minutes_of_first_goal"
    GOAL_INTERVAL = "goal_interval"
    TEAM_CORNERS = "team_corners"
    CORNER_MATCH_BETTING = "corner_match_betting"
    CORNER_HANDICAP = "corner_handicap"
    CORNER_RACE = "corner_race"
    CARDS_OVER_UNDER = "cards_over_under"
    TEAM_CARDS = "team_cards"
    FIRST_CARD = "first_card"
    CARD_HANDICAP = "card_handicap"
    OFFSIDES = "offsides"
    TEAM_OFFSIDES = "team_offsides"
    FOULS = "fouls"
    TEAM_FOULS = "team_fouls"
    SHOTS = "shots"
    SHOTS_ON_TARGET_OVER_UNDER = "shots_on_target_over_under"
    TEAM_SHOTS = "team_shots"
    TEAM_SHOTS_ON_TARGET = "team_shots_on_target"
    WOODWORK_HITS = "woodwork_hits"
    TEAM_WOODWORK_HITS = "team_woodwork_hits"
    GOALKEEPER_SAVES = "goalkeeper_saves"
    TEAM_GOALKEEPER_SAVES = "team_goalkeeper_saves"
    THROW_INS = "throw_ins"
    TEAM_THROW_INS = "team_throw_ins"
    GOAL_KICKS = "goal_kicks"
    TEAM_GOAL_KICKS = "team_goal_kicks"
    FREE_KICKS = "free_kicks"
    TEAM_FREE_KICKS = "team_free_kicks"
    PENALTIES_AWARDED = "penalties_awarded"
    TEAM_PENALTIES_AWARDED = "team_penalties_awarded"
    VAR_DECISIONS = "var_decisions"
    SUBSTITUTIONS = "substitutions"
    TEAM_SUBSTITUTIONS = "team_substitutions"
    INJURIES = "injuries"
    TEAM_INJURIES = "team_injuries"
    BALL_POSSESSION_RANGE = "ball_possession_range"
    PASS_ACCURACY = "pass_accuracy"
    TEAM_PASS_ACCURACY = "team_pass_accuracy"
    DANGEROUS_ATTACKS = "dangerous_attacks"
    TEAM_DANGEROUS_ATTACKS = "team_dangerous_attacks"
    COUNTER_ATTACKS = "counter_attacks"
    TEAM_COUNTER_ATTACKS = "team_counter_attacks"
    ATTACK_ZONES = "attack_zones"
    TEAM_ATTACK_ZONES = "team_attack_zones"
    FORMATION_USED = "formation_used"
    TEAM_FORMATION_USED = "team_formation_used"
    TACTICAL_CHANGES = "tactical_changes"
    TEAM_TACTICAL_CHANGES = "team_tactical_changes"
    PLAYER_RATINGS = "player_ratings"
    TEAM_PLAYER_RATINGS = "team_player_ratings"
    MOMENTUM_SHIFTS = "momentum_shifts"
    GAME_MANAGEMENT = "game_management"
    TEAM_GAME_MANAGEMENT = "team_game_management"
    PRESSURE_INDEX = "pressure_index"
    TEAM_PRESSURE_INDEX = "team_pressure_index"
    FATIGUE_IMPACT = "fatigue_impact"
    TEAM_FATIGUE_IMPACT = "team_fatigue_impact"
    WEATHER_IMPACT = "weather_impact"
    CROWD_IMPACT = "crowd_impact"
    REFEREE_IMPACT = "referee_impact"
    PITCH_CONDITION_IMPACT = "pitch_condition_impact"

class RiskLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class ModelWeight(str, Enum):
    DYNAMIC = "dynamic"
    HISTORICAL = "historical"
    CONFIDENCE_BASED = "confidence_based"
    ENSEMBLE = "ensemble"

class AIPredictionService:
    """Enhanced service for handling AI-powered predictions using various models"""

    def __init__(self):
        self.openai_client = openai.Client(api_key=settings.OPENAI_API_KEY)
        self.deepseek_api_url = settings.DEEPSEEK_API_URL
        self.deepseek_api_key = settings.DEEPSEEK_API_KEY
        self.deepseek_headers = {
            "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        self.openai_headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
    async def get_comprehensive_prediction(self, match_data: Dict) -> Optional[Dict]:
        """Get comprehensive prediction including all prediction types"""
        predictions = []
        
        # Get predictions from each model
        if settings.OPENAI_API_KEY:
            gpt_prediction = await self.get_gpt4_prediction(match_data)
            if gpt_prediction:
                predictions.append(("gpt4", gpt_prediction))
        
        if settings.DEEPSEEK_API_KEY:
            deepseek_prediction = await self.get_deepseek_prediction(match_data)
            if deepseek_prediction:
                predictions.append(("deepseek", deepseek_prediction))
        
        if not predictions:
            logger.warning("No predictions available from AI models")
            return None
        
        # Combine predictions using sophisticated ensemble methods
        ensemble_prediction = self._advanced_ensemble(predictions)
        
        # Add additional prediction types
        additional_predictions = await self._get_additional_predictions(match_data, ensemble_prediction)
        ensemble_prediction.update(additional_predictions)
        
        # Calculate prediction quality metrics
        quality_metrics = self._calculate_prediction_quality(predictions, ensemble_prediction)
        ensemble_prediction["quality_metrics"] = quality_metrics
        
        return ensemble_prediction

    async def _get_additional_predictions(self, match_data: Dict, base_prediction: Dict) -> Dict:
        """Get additional prediction types"""
        total_goals = base_prediction["score_prediction"]["home"] + base_prediction["score_prediction"]["away"]
        btts = base_prediction["score_prediction"]["home"] > 0 and base_prediction["score_prediction"]["away"] > 0
        
        # Enhanced predictions
        predictions = {
            "over_under": {
                "total_goals": total_goals,
                "over_2_5": total_goals > 2.5,
                "over_3_5": total_goals > 3.5,
                "over_1_5": total_goals > 1.5,
                "under_1_5": total_goals < 1.5,
                "under_2_5": total_goals < 2.5,
                "confidence": base_prediction["confidence"] * 0.9
            },
            "btts": {
                "prediction": btts,
                "confidence": base_prediction["confidence"] * 0.85,
                "both_score_ht": self._predict_btts_halftime(match_data),
                "both_score_either_half": self._predict_btts_either_half(match_data)
            },
            "first_half": {
                "home_score": round(base_prediction["score_prediction"]["home"] * 0.4),
                "away_score": round(base_prediction["score_prediction"]["away"] * 0.4),
                "confidence": base_prediction["confidence"] * 0.7,
                "most_goals": self._predict_highest_scoring_half(match_data)
            },
            "corners": self._predict_detailed_corners(match_data),
            "cards": self._predict_detailed_cards(match_data),
            "possession": self._predict_possession(match_data),
            "shots": self._predict_shots(match_data),
            "clean_sheet": self._predict_clean_sheet(match_data),
            "win_to_nil": self._predict_win_to_nil(match_data),
            "goal_timing": self._predict_goal_timing(match_data),
            "player_goals": await self._predict_player_goals(match_data)
        }
        
        # Add confidence intervals and uncertainty metrics
        predictions["confidence_intervals"] = self._calculate_confidence_intervals(predictions)
        predictions["correlation_analysis"] = self._analyze_prediction_correlations(predictions)
        
        return predictions

    def _predict_detailed_corners(self, match_data: Dict) -> Dict:
        """Enhanced corner predictions"""
        base_corners = self._predict_corners(match_data)
        home_attacking_strength = self._calculate_team_attacking_strength(match_data["home_team"])
        away_attacking_strength = self._calculate_team_attacking_strength(match_data["away_team"])
        
        return {
            "total": base_corners,
            "home_team": round(base_corners * (home_attacking_strength / (home_attacking_strength + away_attacking_strength))),
            "away_team": round(base_corners * (away_attacking_strength / (home_attacking_strength + away_attacking_strength))),
            "over_8_5": base_corners > 8.5,
            "over_10_5": base_corners > 10.5,
            "first_half": round(base_corners * 0.45),
            "second_half": round(base_corners * 0.55),
            "confidence": 0.75
        }

    def _predict_detailed_cards(self, match_data: Dict) -> Dict:
        """Enhanced card predictions"""
        base_cards = self._predict_cards(match_data)
        derby_factor = 1.3 if match_data.get("is_derby", False) else 1.0
        importance_factor = 1.2 if match_data.get("match_importance") == "high" else 1.0
        
        return {
            "total": base_cards,
            "yellow_cards": round(base_cards * 0.85),
            "red_cards": round(base_cards * 0.15) if derby_factor * importance_factor > 1.4 else 0,
            "first_yellow_before": "30" if derby_factor > 1 else "45",
            "home_team": round(base_cards * 0.5),
            "away_team": round(base_cards * 0.5),
            "confidence": 0.7
        }

    def _predict_possession(self, match_data: Dict) -> Dict:
        """Predict possession statistics"""
        home_strength = self._calculate_team_strength(match_data["home_team"])
        away_strength = self._calculate_team_strength(match_data["away_team"])
        total_strength = home_strength + away_strength
        
        home_possession = round((home_strength / total_strength) * 100)
        return {
            "home_team": home_possession,
            "away_team": 100 - home_possession,
            "dominant_team": "home" if home_possession > 55 else "away" if home_possession < 45 else "balanced",
            "confidence": 0.65
        }

    def _predict_shots(self, match_data: Dict) -> Dict:
        """Predict shot statistics"""
        total_shots = round(12 + (match_data.get("attacking_factor", 0) * 2))
        return {
            "total_shots": total_shots,
            "on_target": round(total_shots * 0.4),
            "home_team": round(total_shots * 0.55),
            "away_team": round(total_shots * 0.45),
            "confidence": 0.6
        }

    def _calculate_confidence_intervals(self, predictions: Dict) -> Dict:
        """Calculate confidence intervals for numerical predictions"""
        intervals = {}
        for pred_type, values in predictions.items():
            if isinstance(values, dict) and "total" in values:
                mean = values["total"]
                confidence = values.get("confidence", 0.7)
                std_dev = (1 - confidence) * mean * 0.5
                ci = stats.norm.interval(0.95, loc=mean, scale=std_dev)
                intervals[pred_type] = {
                    "lower_bound": max(0, round(ci[0])),
                    "upper_bound": round(ci[1]),
                    "confidence_level": 0.95
                }
        return intervals

    def _analyze_prediction_correlations(self, predictions: Dict) -> Dict:
        """Analyze correlations between different prediction types"""
        correlations = {}
        numerical_predictions = {}
        
        # Extract numerical predictions
        for pred_type, values in predictions.items():
            if isinstance(values, dict) and "total" in values:
                numerical_predictions[pred_type] = values["total"]
        
        # Calculate correlations
        for pred1 in numerical_predictions:
            correlations[pred1] = {}
            for pred2 in numerical_predictions:
                if pred1 != pred2:
                    correlation = self._calculate_prediction_correlation(
                        numerical_predictions[pred1],
                        numerical_predictions[pred2]
                    )
                    correlations[pred1][pred2] = round(correlation, 2)
        
        return correlations

    def _calculate_prediction_correlation(self, val1: float, val2: float) -> float:
        """Calculate correlation between two prediction values"""
        # Simplified correlation calculation for demonstration
        # In production, this would use historical data
        return 0.5 * (val1 / (val1 + val2)) + 0.5 * (val2 / (val1 + val2))

    def _calculate_team_strength(self, team_data: Dict) -> float:
        """Calculate overall team strength"""
        return (
            team_data.get("rating", 75) * 0.4 +
            self._calculate_form_strength(team_data.get("form", "DDDDD")) * 0.3 +
            team_data.get("home_advantage", 1.1) * 0.3
        )

    def _calculate_form_strength(self, form: str) -> float:
        """Calculate strength based on recent form"""
        form_values = {"W": 2, "D": 1, "L": 0}
        return sum(form_values.get(result, 1) for result in form) / (len(form) * 2)

    def _predict_corners(self, match_data: Dict) -> int:
        """Predict total corners based on team playing styles"""
        base_corners = 10  # Average corners per game
        style_factor = 1.0
        
        # Adjust based on team attacking styles
        if "attacking_style" in match_data:
            if match_data["attacking_style"] == "wing_play":
                style_factor *= 1.2
            elif match_data["attacking_style"] == "central":
                style_factor *= 0.9
        
        return round(base_corners * style_factor)

    def _predict_cards(self, match_data: Dict) -> int:
        """Predict total cards based on team history and match importance"""
        base_cards = 4  # Average cards per game
        intensity_factor = 1.0
        
        # Adjust based on match importance and team rivalry
        if "is_derby" in match_data and match_data["is_derby"]:
            intensity_factor *= 1.3
        if "match_importance" in match_data:
            if match_data["match_importance"] == "high":
                intensity_factor *= 1.2
        
        return round(base_cards * intensity_factor)

    def _predict_btts_halftime(self, match_data: Dict) -> bool:
        """Predict BTTS at halftime"""
        # Implementation of the logic to predict BTTS at halftime
        # This is a placeholder and should be replaced with actual implementation
        return False

    def _predict_btts_either_half(self, match_data: Dict) -> bool:
        """Predict BTTS in either half"""
        # Implementation of the logic to predict BTTS in either half
        # This is a placeholder and should be replaced with actual implementation
        return False

    def _predict_highest_scoring_half(self, match_data: Dict) -> str:
        """Predict the highest scoring half"""
        # Implementation of the logic to predict the highest scoring half
        # This is a placeholder and should be replaced with actual implementation
        return "first_half"

    def _predict_clean_sheet(self, match_data: Dict) -> bool:
        """Predict a clean sheet"""
        # Implementation of the logic to predict a clean sheet
        # This is a placeholder and should be replaced with actual implementation
        return False

    def _predict_win_to_nil(self, match_data: Dict) -> bool:
        """Predict a win to nil"""
        # Implementation of the logic to predict a win to nil
        # This is a placeholder and should be replaced with actual implementation
        return False

    def _predict_goal_timing(self, match_data: Dict) -> str:
        """Predict the timing of the first goal"""
        # Implementation of the logic to predict the timing of the first goal
        # This is a placeholder and should be replaced with actual implementation
        return "early"

    async def _predict_player_goals(self, match_data: Dict) -> Dict:
        """Predict player goals"""
        # Implementation of the logic to predict player goals
        # This is a placeholder and should be replaced with actual implementation
        return {}

    def _advanced_ensemble(self, predictions: List[Tuple[str, Dict]]) -> Dict:
        """Advanced ensemble method using dynamic weighting and confidence calibration"""
        # Initialize weights based on historical performance
        base_weights = settings.AI_ENSEMBLE_WEIGHTS
        
        # Dynamic weight adjustment based on prediction confidence and consistency
        adjusted_weights = self._calculate_dynamic_weights(predictions, base_weights)
        
        # Combine predictions using weighted averaging and sophisticated aggregation
        combined_prediction = self._weighted_aggregate(predictions, adjusted_weights)
        
        # Add uncertainty estimation
        combined_prediction["uncertainty"] = self._estimate_uncertainty(predictions)
        
        return combined_prediction

    def _calculate_dynamic_weights(self, predictions: List[Tuple[str, Dict]], base_weights: Dict[str, float]) -> Dict[str, float]:
        """Calculate dynamic weights based on prediction characteristics"""
        weights = base_weights.copy()
        
        # Adjust weights based on prediction confidence
        for model, pred in predictions:
            confidence_factor = min(max(pred["confidence"], 0.5), 1.0)
            weights[model] = weights.get(model, 0.5) * confidence_factor
        
        # Normalize weights
        total_weight = sum(weights.values())
        return {k: v/total_weight for k, v in weights.items()}

    def _weighted_aggregate(self, predictions: List[Tuple[str, Dict]], weights: Dict[str, float]) -> Dict:
        """Aggregate predictions using weighted averaging and sophisticated combination methods"""
        combined_scores = {"home": 0, "away": 0}
        combined_confidence = 0
        outcome_probabilities = {"home_win": 0, "draw": 0, "away_win": 0}
        all_reasoning = []
        all_factors = []
        
        # Combine predictions with weighted averaging
        for model, pred in predictions:
            weight = weights[model]
            
            # Combine scores
            combined_scores["home"] += pred["score_prediction"]["home"] * weight
            combined_scores["away"] += pred["score_prediction"]["away"] * weight
            
            # Combine confidence scores
            combined_confidence += pred["confidence"] * weight
            
            # Accumulate outcome probabilities
            outcome_probabilities[pred["predicted_outcome"]] += weight
            
            # Collect reasoning and factors
            all_reasoning.extend(pred["reasoning"])
            all_factors.extend(pred.get("key_factors", []))
        
        # Round scores
        combined_scores = {k: round(v) for k, v in combined_scores.items()}
        
        # Determine final outcome based on probability distribution
        predicted_outcome = max(outcome_probabilities.items(), key=lambda x: x[1])[0]
        
        # Calculate model agreement and consistency metrics
        model_agreement = len(set(p[1]["predicted_outcome"] for p in predictions)) == 1
        prediction_consistency = self._calculate_consistency(predictions)
        
        return {
            "predicted_outcome": predicted_outcome,
            "score_prediction": combined_scores,
            "confidence": combined_confidence,
            "reasoning": list(set(all_reasoning)),
            "key_factors": list(set(all_factors)),
            "risk_assessment": self._assess_risk(predictions, prediction_consistency),
            "model_agreement": model_agreement,
            "consistency_score": prediction_consistency,
            "outcome_probabilities": outcome_probabilities
        }

    def _calculate_consistency(self, predictions: List[Tuple[str, Dict]]) -> float:
        """Calculate consistency score across different model predictions"""
        if len(predictions) < 2:
            return 1.0
            
        # Calculate variance in predicted scores
        home_scores = [p[1]["score_prediction"]["home"] for p in predictions]
        away_scores = [p[1]["score_prediction"]["away"] for p in predictions]
        
        score_variance = (np.var(home_scores) + np.var(away_scores)) / 2
        
        # Calculate outcome agreement
        unique_outcomes = len(set(p[1]["predicted_outcome"] for p in predictions))
        outcome_agreement = 1 / unique_outcomes
        
        # Combine metrics
        consistency = (1 / (1 + score_variance)) * outcome_agreement
        return round(consistency, 2)

    def _assess_risk(self, predictions: List[Tuple[str, Dict]], consistency: float) -> RiskLevel:
        """Assess risk level based on predictions and consistency"""
        # Calculate average confidence
        avg_confidence = np.mean([p[1]["confidence"] for p in predictions])
        
        # Define risk thresholds
        if consistency > 0.8 and avg_confidence > 0.75:
            return RiskLevel.LOW
        elif consistency < 0.5 or avg_confidence < 0.5:
            return RiskLevel.HIGH
        else:
            return RiskLevel.MEDIUM

    def _estimate_uncertainty(self, predictions: List[Tuple[str, Dict]]) -> Dict:
        """Estimate prediction uncertainty using statistical methods"""
        confidences = [p[1]["confidence"] for p in predictions]
        scores_home = [p[1]["score_prediction"]["home"] for p in predictions]
        scores_away = [p[1]["score_prediction"]["away"] for p in predictions]
        
        return {
            "confidence_std": float(np.std(confidences)),
            "score_variance": {
                "home": float(np.var(scores_home)),
                "away": float(np.var(scores_away))
            },
            "prediction_spread": len(set(p[1]["predicted_outcome"] for p in predictions))
        }

    def _calculate_prediction_quality(self, predictions: List[Tuple[str, Dict]], ensemble: Dict) -> Dict:
        """Calculate various metrics for prediction quality"""
        return {
            "model_diversity": len(set(p[0] for p in predictions)),
            "confidence_range": max(p[1]["confidence"] for p in predictions) - min(p[1]["confidence"] for p in predictions),
            "ensemble_strength": ensemble["consistency_score"] * ensemble["confidence"],
            "uncertainty_level": 1 - ensemble["consistency_score"]
        }

    async def get_gpt4_prediction(self, match_data: Dict) -> Dict:
        """Get prediction using GPT-4"""
        try:
            async with httpx.AsyncClient() as client:
                prompt = self._prepare_gpt_prompt(match_data)
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=self.openai_headers,
                    json={
                        "model": settings.OPENAI_MODEL,
                        "messages": [{"role": "system", "content": "You are a soccer prediction expert."},
                                   {"role": "user", "content": prompt}],
                        "temperature": settings.OPENAI_TEMPERATURE,
                        "max_tokens": settings.OPENAI_MAX_TOKENS
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                prediction = self._parse_gpt_response(response.json())
                return self._validate_and_format_prediction(prediction)
        except Exception as e:
            logger.error(f"Error getting GPT-4 prediction: {str(e)}")
            return None

    async def get_deepseek_prediction(self, match_data: Dict) -> Dict:
        """Get prediction using Deepseek API"""
        try:
            async with httpx.AsyncClient() as client:
                prompt = self._prepare_deepseek_prompt(match_data)
                response = await client.post(
                    f"{settings.DEEPSEEK_API_URL}/chat/completions",
                    headers=self.deepseek_headers,
                    json={
                        "model": settings.DEEPSEEK_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an expert soccer analyst specializing in match predictions."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": settings.DEEPSEEK_TEMPERATURE,
                        "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                prediction = self._parse_deepseek_response(response.json())
                return self._validate_and_format_prediction(prediction)
        except Exception as e:
            logger.error(f"Error getting Deepseek prediction: {str(e)}")
            return None

    async def get_ensemble_prediction(self, match_data: Dict) -> Optional[Dict]:
        """Get ensemble prediction combining multiple AI models"""
        predictions = []
        
        # Collect predictions from different models
        if settings.OPENAI_API_KEY:
            gpt_prediction = await self.get_gpt4_prediction(match_data)
            if gpt_prediction:
                predictions.append(("gpt4", gpt_prediction))
            
        if settings.DEEPSEEK_API_KEY:
            deepseek_prediction = await self.get_deepseek_prediction(match_data)
            if deepseek_prediction:
                predictions.append(("deepseek", deepseek_prediction))
            
        if not predictions:
            logger.warning("No predictions available from AI models")
            return None
            
        # Combine predictions with weighted averaging
        return self._combine_predictions(predictions)

    def _prepare_gpt_prompt(self, match_data: Dict) -> str:
        """Prepare detailed prompt for GPT models"""
        return f"""
        Analyze the following soccer match and provide a detailed prediction:

        Match: {match_data['home_team']} vs {match_data['away_team']}
        Competition: {match_data['competition']}
        
        Home Team Stats:
        - Recent Form: {match_data['home_form']}
        - Goals Scored (avg): {match_data['home_goals_scored_avg']}
        - Goals Conceded (avg): {match_data['home_goals_conceded_avg']}
        - Team Rating: {match_data['home_team_rating']}
        
        Away Team Stats:
        - Recent Form: {match_data['away_form']}
        - Goals Scored (avg): {match_data['away_goals_scored_avg']}
        - Goals Conceded (avg): {match_data['away_goals_conceded_avg']}
        - Team Rating: {match_data['away_team_rating']}
        
        Head-to-Head:
        {match_data['head_to_head_stats']}
        
        Additional Factors:
        - Weather: {match_data.get('weather_data', 'No weather data')}
        - Rest Days: Home({match_data['home_rest_days']}) vs Away({match_data['away_rest_days']})
        
        Provide prediction in JSON format with the following structure:
        {
            "predicted_outcome": "home_win|draw|away_win",
            "score_prediction": {"home": X, "away": Y},
            "confidence": 0.XX,
            "reasoning": ["reason1", "reason2", ...],
            "key_factors": ["factor1", "factor2", ...],
            "risk_assessment": "low|medium|high"
        }
        """

    def _prepare_deepseek_prompt(self, match_data: Dict) -> str:
        """Prepare prompt for Deepseek model"""
        # Similar to GPT prompt but formatted specifically for Deepseek
        return self._prepare_gpt_prompt(match_data)  # Can be customized if needed

    def _parse_gpt_response(self, response: Dict) -> Dict:
        """Parse GPT-4 response"""
        try:
            content = response['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error parsing GPT response: {str(e)}")
            raise

    def _parse_deepseek_response(self, response: Dict) -> Dict:
        """Parse Deepseek response"""
        try:
            content = response['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            logger.error(f"Error parsing Deepseek response: {str(e)}")
            raise

    def _validate_and_format_prediction(self, prediction: Dict) -> Dict:
        """Validate and format the AI prediction"""
        required_fields = [
            "predicted_outcome", 
            "score_prediction", 
            "confidence", 
            "reasoning"
        ]
        
        if not all(field in prediction for field in required_fields):
            raise ValueError("Missing required fields in prediction")
            
        if prediction["confidence"] < 0 or prediction["confidence"] > 1:
            raise ValueError("Confidence score must be between 0 and 1")
            
        return {
            "predicted_outcome": prediction["predicted_outcome"],
            "score_prediction": prediction["score_prediction"],
            "confidence": prediction["confidence"],
            "reasoning": prediction["reasoning"],
            "key_factors": prediction.get("key_factors", []),
            "risk_assessment": prediction.get("risk_assessment", "medium")
        }

    def _combine_predictions(self, predictions: List[Tuple[str, Dict]]) -> Dict:
        """Combine multiple predictions into a single ensemble prediction"""
        # Define model weights (can be adjusted based on historical performance)
        model_weights = {
            "gpt4": 0.6,
            "deepseek": 0.4
        }
        
        combined_confidence = 0
        combined_scores = {"home": 0, "away": 0}
        all_reasoning = []
        all_factors = []
        outcome_votes = {"home_win": 0, "draw": 0, "away_win": 0}
        
        total_weight = 0
        for model, pred in predictions:
            weight = model_weights.get(model, 0.5)
            total_weight += weight
            
            # Combine confidences
            combined_confidence += pred["confidence"] * weight
            
            # Combine score predictions
            combined_scores["home"] += pred["score_prediction"]["home"] * weight
            combined_scores["away"] += pred["score_prediction"]["away"] * weight
            
            # Collect reasoning and factors
            all_reasoning.extend(pred["reasoning"])
            all_factors.extend(pred.get("key_factors", []))
            
            # Vote for outcome
            outcome_votes[pred["predicted_outcome"]] += weight
        
        # Normalize combined values
        combined_confidence /= total_weight
        combined_scores["home"] = round(combined_scores["home"] / total_weight)
        combined_scores["away"] = round(combined_scores["away"] / total_weight)
        
        # Get most voted outcome
        predicted_outcome = max(outcome_votes.items(), key=lambda x: x[1])[0]
        
        return {
            "predicted_outcome": predicted_outcome,
            "score_prediction": combined_scores,
            "confidence": combined_confidence,
            "reasoning": list(set(all_reasoning)),  # Remove duplicates
            "key_factors": list(set(all_factors)),  # Remove duplicates
            "risk_assessment": "medium",  # Could be calculated based on variance between predictions
            "model_agreement": len(set(p[1]["predicted_outcome"] for p in predictions)) == 1
        } 