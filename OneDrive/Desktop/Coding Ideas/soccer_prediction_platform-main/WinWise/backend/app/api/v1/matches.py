from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.match import Match, MatchCreate, MatchUpdate, Team, TeamCreate
from app.models.match import Match as MatchModel, Team as TeamModel
from app.models.user import User
from app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/upcoming", response_model=List[Match])
async def get_upcoming_matches(
    skip: int = 0,
    limit: int = 20,
    league: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get upcoming matches with optional league filter.
    """
    query = db.query(MatchModel).filter(
        MatchModel.start_time >= datetime.utcnow()
    ).order_by(MatchModel.start_time.asc())
    
    if league:
        query = query.filter(MatchModel.competition == league)
    
    matches = query.offset(skip).limit(limit).all()
    return matches

@router.get("/{match_id}", response_model=Match)
async def get_match(
    match_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get match by ID.
    """
    match = db.query(MatchModel).filter(MatchModel.match_id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    return match

@router.post("/teams", response_model=Team)
async def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new team.
    """
    # Check if team exists
    db_team = db.query(TeamModel).filter(TeamModel.name == team.name).first()
    if db_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team already exists"
        )
    
    # Create team
    db_team = TeamModel(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.get("/teams", response_model=List[Team])
async def get_teams(
    skip: int = 0,
    limit: int = 100,
    league: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all teams with optional league filter.
    """
    query = db.query(TeamModel)
    if league:
        query = query.filter(TeamModel.league == league)
    teams = query.offset(skip).limit(limit).all()
    return teams

@router.get("/teams/{team_id}", response_model=Team)
async def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get team by ID.
    """
    team = db.query(TeamModel).filter(TeamModel.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return team

@router.get("/leagues", response_model=List[str])
async def get_leagues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of available leagues.
    """
    leagues = db.query(TeamModel.league).distinct().all()
    return [league[0] for league in leagues if league[0]] 