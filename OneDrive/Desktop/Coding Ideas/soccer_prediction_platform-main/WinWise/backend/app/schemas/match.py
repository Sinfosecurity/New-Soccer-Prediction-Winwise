from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.match import MatchStatus

class TeamBase(BaseModel):
    name: str
    country: Optional[str] = None
    league: Optional[str] = None
    rating: float = Field(default=0.0, ge=0.0, le=100.0)
    logo_url: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(TeamBase):
    name: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0.0, le=100.0)

class TeamInDBBase(TeamBase):
    id: int
    total_matches: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0
    goals_scored: int = 0
    goals_conceded: int = 0
    form: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Team(TeamInDBBase):
    """Return model for team data"""
    pass

class MatchBase(BaseModel):
    match_id: str
    home_team_id: int
    away_team_id: int
    start_time: datetime
    competition: str
    status: MatchStatus = MatchStatus.SCHEDULED

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: Optional[MatchStatus] = None
    prediction: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    odds_data: Optional[Dict[str, Any]] = None
    stats_data: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None
    venue: Optional[str] = None
    referee: Optional[str] = None
    attendance: Optional[int] = Field(None, ge=0)

class MatchInDBBase(MatchBase):
    id: int
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    home_win_probability: Optional[float] = None
    draw_probability: Optional[float] = None
    away_win_probability: Optional[float] = None
    odds_data: Optional[Dict[str, Any]] = None
    stats_data: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None
    venue: Optional[str] = None
    referee: Optional[str] = None
    attendance: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Match(MatchInDBBase):
    """Return model for match data"""
    home_team: Team
    away_team: Team 