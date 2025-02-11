from sqlalchemy import Column, String, Boolean, Enum, Integer
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    ANALYST = "analyst"

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Stats and preferences
    prediction_points = Column(Integer, default=0)
    correct_predictions = Column(Integer, default=0)
    total_predictions = Column(Integer, default=0)
    preferred_leagues = Column(String)  # Comma-separated list or could be JSON
    notification_preferences = Column(String)  # JSON string of preferences

    # Relationships will be added here for predictions, etc.

    def __repr__(self):
        return f"<User {self.username}>"

    @property
    def prediction_accuracy(self):
        """Calculate prediction accuracy percentage"""
        if self.total_predictions == 0:
            return 0
        return (self.correct_predictions / self.total_predictions) * 100 