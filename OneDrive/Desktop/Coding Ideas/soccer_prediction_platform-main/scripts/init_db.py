import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.models.match import Match, Team
from app.core.security import get_password_hash

def init_db():
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Create admin user if it doesn't exist
        from sqlalchemy.orm import sessionmaker
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                email="admin@example.com",
                username="admin",
                full_name="Admin User",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created successfully")
        
        # Add some sample teams if they don't exist
        sample_teams = [
            {"name": "Manchester United", "country": "England", "league": "Premier League", "rating": 85.5},
            {"name": "Liverpool", "country": "England", "league": "Premier League", "rating": 86.0},
            {"name": "Barcelona", "country": "Spain", "league": "La Liga", "rating": 84.5},
            {"name": "Real Madrid", "country": "Spain", "league": "La Liga", "rating": 85.0}
        ]
        
        for team_data in sample_teams:
            team = db.query(Team).filter(Team.name == team_data["name"]).first()
            if not team:
                team = Team(**team_data)
                db.add(team)
        
        db.commit()
        print("✅ Sample teams added successfully")
        
    except Exception as e:
        print(f"❌ Error initializing database: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Initializing database...")
    init_db()
    print("✨ Database initialization completed") 