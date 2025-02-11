# Soccer Prediction Platform

A machine learning-powered platform for predicting soccer match outcomes with high accuracy.

## Features

- Match outcome predictions using advanced ML models
- User authentication and personalized dashboards
- Historical match data analysis
- Performance tracking and statistics
- RESTful API for predictions
- Admin dashboard for system monitoring

## Tech Stack

- Backend: FastAPI
- Database: PostgreSQL
- ML: scikit-learn, pandas, numpy
- Frontend: React (TypeScript)
- Authentication: JWT
- Containerization: Docker
- CI/CD: GitHub Actions

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL
- Node.js 14+
- Docker

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/soccer_prediction_platform.git
cd soccer_prediction_platform
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
python scripts/init_db.py
```

6. Run the application:
```bash
uvicorn app.main:app --reload
```

### Docker Setup

```bash
docker-compose up --build
```

## Project Structure

```
soccer_prediction_platform/
├── app/
│   ├── api/          # API endpoints
│   ├── core/         # Core configuration
│   ├── models/       # Database models
│   ├── ml/           # Machine learning models
│   ├── services/     # Business logic
│   └── monitoring/   # System monitoring
├── tests/            # Test suite
├── frontend/         # React frontend
├── scripts/          # Utility scripts
└── docker/          # Docker configuration
```

## API Documentation

API documentation is available at `/docs` when running the server.

## Testing

Run tests with:
```bash
pytest
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 