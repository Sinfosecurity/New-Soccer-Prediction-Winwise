from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
from app.models.prediction import Prediction
from app.models.match import Match
from app.ml.model import MatchPredictionModel

class MonitoringService:
    def __init__(self, db: Session):
        self.db = db
        self.model = MatchPredictionModel()

    async def get_monitoring_data(self, start_date: datetime) -> Dict:
        """Get comprehensive monitoring data"""
        metrics = await self.get_model_metrics(start_date)
        alerts = await self.get_alerts(start_date)
        league_performance = await self.get_league_performance(start_date)
        roi_analysis = await self.get_roi_analysis(start_date)
        feature_importance = await self.get_feature_importance()
        
        return {
            "model_metrics": metrics,
            "alerts": alerts,
            "accuracy_report": {
                "overall_accuracy": metrics["accuracy"],
                "total_predictions": metrics["total_predictions"],
                "league_metrics": league_performance
            },
            "model_insights": {
                "confidence_correlation": await self._calculate_confidence_correlation(start_date),
                "home_bias": await self._calculate_home_bias(start_date),
                "value_betting_accuracy": await self._calculate_value_betting_accuracy(start_date),
                "high_confidence_threshold": await self._calculate_high_confidence_threshold()
            },
            "roi_analysis": roi_analysis,
            "betting_edge": await self._calculate_betting_edge(start_date)
        }

    async def get_model_metrics(self, start_date: datetime, metric_type: Optional[str] = None) -> Dict:
        """Calculate model performance metrics"""
        predictions = self.db.query(Prediction).filter(
            Prediction.prediction_time >= start_date
        ).all()
        
        if not predictions:
            return {
                "accuracy": 0,
                "precision": 0,
                "recall": 0,
                "f1_score": 0,
                "total_predictions": 0,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        correct = sum(1 for p in predictions if p.status == "correct")
        total = len(predictions)
        
        metrics = {
            "accuracy": correct / total if total > 0 else 0,
            "precision": await self._calculate_precision(predictions),
            "recall": await self._calculate_recall(predictions),
            "f1_score": 0,  # Will be calculated below
            "total_predictions": total,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Calculate F1 score
        if metrics["precision"] + metrics["recall"] > 0:
            metrics["f1_score"] = 2 * (metrics["precision"] * metrics["recall"]) / (metrics["precision"] + metrics["recall"])
        
        return metrics

    async def get_alerts(self, start_date: datetime, severity: Optional[str] = None) -> List[Dict]:
        """Generate model monitoring alerts"""
        alerts = []
        metrics = await self.get_model_metrics(start_date)
        
        # Check accuracy drop
        if metrics["accuracy"] < 0.5:
            alerts.append({
                "type": "error",
                "message": "Model accuracy has dropped below 50%",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Check ROI
        roi_analysis = await self.get_roi_analysis(start_date)
        if roi_analysis["overall_roi"] < -0.1:
            alerts.append({
                "type": "warning",
                "message": "Overall ROI has dropped below -10%",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Filter by severity if specified
        if severity and severity != "all":
            alerts = [alert for alert in alerts if alert["type"] == severity]
        
        return alerts

    async def get_league_performance(self, start_date: datetime, league: Optional[str] = None) -> Dict:
        """Get performance metrics by league"""
        query = self.db.query(
            Match.competition,
            func.count(Prediction.id).label("total"),
            func.sum(case([(Prediction.status == "correct", 1)], else_=0)).label("correct")
        ).join(Prediction).filter(
            Prediction.prediction_time >= start_date
        ).group_by(Match.competition)
        
        if league:
            query = query.filter(Match.competition == league)
        
        results = query.all()
        
        return {
            row.competition: {
                "correct": row.correct,
                "total": row.total,
                "accuracy": row.correct / row.total if row.total > 0 else 0
            }
            for row in results
        }

    async def get_feature_importance(self) -> Dict:
        """Get feature importance scores from the model"""
        return self.model.get_feature_importance()

    async def get_roi_analysis(self, start_date: datetime, breakdown_by: Optional[str] = None) -> Dict:
        """Calculate ROI analysis with optional breakdown"""
        predictions = self.db.query(Prediction).filter(
            Prediction.prediction_time >= start_date
        ).all()
        
        overall_roi = sum(p.profit_loss for p in predictions) / len(predictions) if predictions else 0
        
        result = {
            "overall_roi": overall_roi,
            "monthly_roi": await self._calculate_monthly_roi(predictions),
            "by_league_roi": await self._calculate_league_roi(predictions),
            "by_bet_type_roi": await self._calculate_bet_type_roi(predictions)
        }
        
        if breakdown_by and breakdown_by != "all":
            return {"overall_roi": overall_roi, breakdown_by: result[f"by_{breakdown_by}_roi"]}
        
        return result

    async def _calculate_confidence_correlation(self, start_date: datetime) -> float:
        """Calculate correlation between prediction confidence and accuracy"""
        predictions = self.db.query(Prediction).filter(
            Prediction.prediction_time >= start_date
        ).all()
        
        if not predictions:
            return 0.0
            
        confidences = [p.confidence_score for p in predictions]
        accuracies = [1 if p.status == "correct" else 0 for p in predictions]
        
        return float(np.corrcoef(confidences, accuracies)[0, 1])

    async def _calculate_betting_edge(self, start_date: datetime) -> Dict:
        """Calculate betting edge metrics"""
        predictions = self.db.query(Prediction).filter(
            Prediction.prediction_time >= start_date
        ).all()
        
        if not predictions:
            return {
                "average_edge": 0,
                "total_value_bets": 0,
                "successful_value_bets": 0,
                "edge_distribution": {}
            }
        
        value_bets = [p for p in predictions if p.analysis_factors.get("is_value_bet", False)]
        successful_value_bets = [p for p in value_bets if p.status == "correct"]
        
        return {
            "average_edge": sum(p.analysis_factors.get("edge", 0) for p in predictions) / len(predictions),
            "total_value_bets": len(value_bets),
            "successful_value_bets": len(successful_value_bets),
            "edge_distribution": await self._calculate_edge_distribution(predictions)
        }

    # Helper methods for ROI analysis
    async def _calculate_monthly_roi(self, predictions: List[Prediction]) -> Dict[str, float]:
        monthly_profits = {}
        for pred in predictions:
            month = pred.prediction_time.strftime("%Y-%m")
            monthly_profits[month] = monthly_profits.get(month, 0) + pred.profit_loss
        return monthly_profits

    async def _calculate_league_roi(self, predictions: List[Prediction]) -> Dict[str, float]:
        league_profits = {}
        for pred in predictions:
            match = self.db.query(Match).filter(Match.id == pred.match_id).first()
            if match:
                league_profits[match.competition] = league_profits.get(match.competition, 0) + pred.profit_loss
        return league_profits

    async def _calculate_bet_type_roi(self, predictions: List[Prediction]) -> Dict[str, float]:
        type_profits = {}
        for pred in predictions:
            bet_type = pred.prediction_data.get("type", "unknown")
            type_profits[bet_type] = type_profits.get(bet_type, 0) + pred.profit_loss
        return type_profits 