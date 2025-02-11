from sqlalchemy import Column, String, Boolean, JSON
from app.models.base import BaseModel

class Sport(BaseModel):
    """Base model for different sports"""
    __tablename__ = "sports"

    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Sport-specific configuration
    scoring_system = Column(JSON)  # How points/scores are counted
    prediction_types = Column(JSON)  # Available prediction types for this sport
    statistics_schema = Column(JSON)  # Schema for sport-specific statistics
    team_stats_schema = Column(JSON)  # Schema for team statistics
    player_stats_schema = Column(JSON)  # Schema for player statistics
    
    def __repr__(self):
        return f"<Sport {self.name}>" 