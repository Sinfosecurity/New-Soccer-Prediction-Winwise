from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.prediction import Prediction
from app.services.monitoring_service import MonitoringService

router = APIRouter()

@router.get("/model-monitoring")
async def get_model_monitoring_data(
    timeframe: str = Query("7d", regex="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get comprehensive model monitoring data including metrics, insights, and alerts.
    Timeframe options: 7d (7 days), 30d (30 days), 90d (90 days)
    """
    monitoring_service = MonitoringService(db)
    
    # Convert timeframe to datetime
    days = int(timeframe.replace("d", ""))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get monitoring data
    monitoring_data = await monitoring_service.get_monitoring_data(start_date)
    
    return monitoring_data

@router.get("/model-monitoring/metrics")
async def get_model_metrics(
    metric_type: Optional[str] = Query(None, regex="^(accuracy|roi|edge|all)$"),
    timeframe: str = Query("7d", regex="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get specific model metrics based on the metric type.
    """
    monitoring_service = MonitoringService(db)
    days = int(timeframe.replace("d", ""))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    return await monitoring_service.get_model_metrics(start_date, metric_type)

@router.get("/model-monitoring/alerts")
async def get_model_alerts(
    severity: Optional[str] = Query(None, regex="^(info|warning|error|all)$"),
    timeframe: str = Query("7d", regex="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict]:
    """
    Get model monitoring alerts filtered by severity and timeframe.
    """
    monitoring_service = MonitoringService(db)
    days = int(timeframe.replace("d", ""))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    return await monitoring_service.get_alerts(start_date, severity)

@router.get("/model-monitoring/league-performance")
async def get_league_performance(
    league: Optional[str] = None,
    timeframe: str = Query("7d", regex="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get performance metrics broken down by league.
    """
    monitoring_service = MonitoringService(db)
    days = int(timeframe.replace("d", ""))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    return await monitoring_service.get_league_performance(start_date, league)

@router.get("/model-monitoring/feature-importance")
async def get_feature_importance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get current feature importance scores from the model.
    """
    monitoring_service = MonitoringService(db)
    return await monitoring_service.get_feature_importance()

@router.get("/model-monitoring/roi-analysis")
async def get_roi_analysis(
    timeframe: str = Query("7d", regex="^(7d|30d|90d)$"),
    breakdown_by: Optional[str] = Query(None, regex="^(league|bet_type|month|all)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get detailed ROI analysis with optional breakdown by different dimensions.
    """
    monitoring_service = MonitoringService(db)
    days = int(timeframe.replace("d", ""))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    return await monitoring_service.get_roi_analysis(start_date, breakdown_by) 