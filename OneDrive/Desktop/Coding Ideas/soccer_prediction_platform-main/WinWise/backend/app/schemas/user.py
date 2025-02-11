from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from app.models.user import UserRole
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: constr(min_length=3, max_length=50)
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: constr(min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    preferred_leagues: Optional[str] = None
    notification_preferences: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    prediction_points: int
    correct_predictions: int
    total_predictions: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    """Return model for user data"""
    pass

class UserInDB(UserInDBBase):
    """Internal model with hashed password"""
    hashed_password: str 