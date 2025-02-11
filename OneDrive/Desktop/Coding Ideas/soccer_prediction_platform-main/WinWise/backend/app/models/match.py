from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import BaseModel

class MatchStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"
    SUSPENDED = "suspended"

class Team(BaseModel):
    __tablename__ = "teams"

    name = Column(String, unique=True, index=True, nullable=False)
    sport_id = Column(Integer, ForeignKey("sports.id"), nullable=False)
    country = Column(String)
    league = Column(String)
    rating = Column(Float, default=0.0)
    logo_url = Column(String)
    
    # Generic stats stored as JSON to support different sports
    stats = Column(JSON)
    form = Column(String)  # Recent form in a sport-agnostic format
    metadata = Column(JSON)  # Additional sport-specific metadata

    # Relationships
    sport = relationship("Sport", back_populates="teams")
    home_matches = relationship("Match", back_populates="home_team", foreign_keys="Match.home_team_id")
    away_matches = relationship("Match", back_populates="away_team", foreign_keys="Match.away_team_id")

    def __repr__(self):
        return f"<Team {self.name} ({self.sport.name})>"

class Match(BaseModel):
    __tablename__ = "matches"
    
    match_id = Column(String, unique=True, index=True)
    sport_id = Column(Integer, ForeignKey("sports.id"), nullable=False)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    start_time = Column(DateTime, index=True)
    competition = Column(String)
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)
    
    # Score and result information (stored as JSON to support different scoring systems)
    score_data = Column(JSON)  # Flexible scoring data structure
    result_data = Column(JSON)  # Final result in sport-specific format
    
    # Prediction related fields
    prediction_data = Column(JSON)  # Flexible prediction data structure
    probabilities = Column(JSON)  # Various outcome probabilities
    
    # Additional data
    odds_data = Column(JSON)  # Betting odds from various bookmakers
    stats_data = Column(JSON)  # Match statistics in sport-specific format
    weather_data = Column(JSON)  # Weather conditions if applicable
    venue = Column(String)
    officials = Column(JSON)  # Referees, umpires, etc.
    attendance = Column(Integer)
    
    # Relationships
    sport = relationship("Sport", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    predictions = relationship("Prediction", back_populates="match")

    def __repr__(self):
        return f"<Match {self.sport.name}: {self.home_team.name} vs {self.away_team.name}>"

    @property
    def is_finished(self):
        return self.status == MatchStatus.COMPLETED

    @property
    def result(self):
        if not self.is_finished or not self.result_data:
            return None
        return self.result_data.get("outcome") 