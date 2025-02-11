from typing import Dict, Type
from sqlalchemy.orm import Session
from app.services.base_sport_service import BaseSportService
from app.services.soccer_service import SoccerService
from app.services.basketball_service import BasketballService
from app.core.exceptions import SportNotSupportedError

class SportServiceFactory:
    """Factory for creating sport-specific services"""
    
    _services: Dict[str, Type[BaseSportService]] = {
        "soccer": SoccerService,
        "basketball": BasketballService,
        # Add more sports here as they're implemented
    }

    @classmethod
    def get_service(cls, sport_code: str, db: Session) -> BaseSportService:
        """Get the appropriate service for a given sport"""
        service_class = cls._services.get(sport_code.lower())
        if not service_class:
            raise SportNotSupportedError(f"Sport '{sport_code}' is not supported")
        return service_class(db)

    @classmethod
    def register_service(cls, sport_code: str, service_class: Type[BaseSportService]):
        """Register a new sport service"""
        cls._services[sport_code.lower()] = service_class 