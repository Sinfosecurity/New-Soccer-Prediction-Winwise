import pytest
import asyncio
from app.services.ai_prediction_service import AIPredictionService, PredictionType, RiskLevel, ModelWeight

@pytest.fixture
def sample_match_data():
    return {
        "home_team": {
            "name": "Manchester United",
            "rating": 85.5,
            "form": "WWDLW",
            "home_advantage": 1.1
        },
        "away_team": {
            "name": "Liverpool",
            "rating": 86.0,
            "form": "DWWWD",
            "home_advantage": 1.0
        },
        "competition": "Premier League",
        "head_to_head_stats": "Total: 10, Home wins: 4, Away wins: 3, Draws: 3",
        "home_rest_days": 5,
        "away_rest_days": 6,
        "weather_data": {
            "temperature": 18,
            "condition": "Clear",
            "precipitation": 0
        },
        "attacking_style": "wing_play",
        "is_derby": True,
        "match_importance": "high",
        "attacking_factor": 1.2
    }

@pytest.fixture
def prediction_service():
    return AIPredictionService()

@pytest.mark.asyncio
async def test_comprehensive_prediction(sample_match_data):
    """Test comprehensive prediction functionality"""
    service = AIPredictionService()
    prediction = await service.get_comprehensive_prediction(sample_match_data)
    
    assert prediction is not None
    assert "predicted_outcome" in prediction
    assert "score_prediction" in prediction
    assert "confidence" in prediction
    assert "over_under" in prediction
    assert "btts" in prediction
    assert "first_half" in prediction
    assert "corners" in prediction
    assert "cards" in prediction
    assert "quality_metrics" in prediction
    assert "possession" in prediction
    assert "shots" in prediction
    assert "clean_sheet" in prediction
    assert "win_to_nil" in prediction
    assert "goal_timing" in prediction
    assert "player_goals" in prediction
    
    # Test enhanced prediction structure
    assert isinstance(prediction["score_prediction"], dict)
    assert "home" in prediction["score_prediction"]
    assert "away" in prediction["score_prediction"]
    assert isinstance(prediction["confidence"], float)
    assert 0 <= prediction["confidence"] <= 1

@pytest.mark.asyncio
async def test_enhanced_predictions(sample_match_data):
    """Test enhanced prediction types"""
    service = AIPredictionService()
    prediction = await service.get_comprehensive_prediction(sample_match_data)
    
    # Test over/under predictions
    assert "over_under" in prediction
    assert all(k in prediction["over_under"] for k in ["total_goals", "over_2_5", "over_3_5", "over_1_5", "under_1_5", "under_2_5"])
    
    # Test BTTS prediction
    assert "btts" in prediction
    assert all(k in prediction["btts"] for k in ["prediction", "confidence", "both_score_ht", "both_score_either_half"])
    
    # Test first half prediction
    assert "first_half" in prediction
    assert all(k in prediction["first_half"] for k in ["home_score", "away_score", "confidence", "most_goals"])
    
    # Test detailed corners prediction
    assert "corners" in prediction
    assert all(k in prediction["corners"] for k in ["total", "home_team", "away_team", "over_8_5", "over_10_5", "first_half", "second_half"])
    
    # Test detailed cards prediction
    assert "cards" in prediction
    assert all(k in prediction["cards"] for k in ["total", "yellow_cards", "red_cards", "first_yellow_before", "home_team", "away_team"])
    
    # Test possession prediction
    assert "possession" in prediction
    assert all(k in prediction["possession"] for k in ["home_team", "away_team", "dominant_team"])
    assert prediction["possession"]["home_team"] + prediction["possession"]["away_team"] == 100
    
    # Test shots prediction
    assert "shots" in prediction
    assert all(k in prediction["shots"] for k in ["total_shots", "on_target", "home_team", "away_team"])

@pytest.mark.asyncio
async def test_confidence_intervals(sample_match_data):
    """Test confidence interval calculations"""
    service = AIPredictionService()
    prediction = await service.get_comprehensive_prediction(sample_match_data)
    
    assert "confidence_intervals" in prediction
    for pred_type, interval in prediction["confidence_intervals"].items():
        assert "lower_bound" in interval
        assert "upper_bound" in interval
        assert "confidence_level" in interval
        assert interval["lower_bound"] <= interval["upper_bound"]
        assert 0 <= interval["confidence_level"] <= 1

@pytest.mark.asyncio
async def test_correlation_analysis(sample_match_data):
    """Test prediction correlation analysis"""
    service = AIPredictionService()
    prediction = await service.get_comprehensive_prediction(sample_match_data)
    
    assert "correlation_analysis" in prediction
    correlations = prediction["correlation_analysis"]
    
    # Test correlation matrix properties
    for pred_type1, corr_dict in correlations.items():
        for pred_type2, corr_value in corr_dict.items():
            assert -1 <= corr_value <= 1
            assert isinstance(corr_value, float)

@pytest.mark.asyncio
async def test_team_strength_calculation(sample_match_data):
    """Test team strength calculation"""
    service = AIPredictionService()
    
    home_strength = service._calculate_team_strength(sample_match_data["home_team"])
    away_strength = service._calculate_team_strength(sample_match_data["away_team"])
    
    assert isinstance(home_strength, float)
    assert isinstance(away_strength, float)
    assert 0 <= home_strength <= 100
    assert 0 <= away_strength <= 100

@pytest.mark.asyncio
async def test_form_strength_calculation():
    """Test form strength calculation"""
    service = AIPredictionService()
    
    perfect_form = service._calculate_form_strength("WWWWW")
    mixed_form = service._calculate_form_strength("WDLWD")
    poor_form = service._calculate_form_strength("LLLLL")
    
    assert perfect_form == 1.0
    assert 0 < mixed_form < 1
    assert poor_form == 0.0

@pytest.mark.asyncio
async def test_error_handling(sample_match_data):
    """Test error handling and validation"""
    service = AIPredictionService()
    
    # Test with invalid match data
    invalid_data = sample_match_data.copy()
    invalid_data["home_team"].pop("rating")
    
    prediction = await service.get_comprehensive_prediction(invalid_data)
    assert prediction is not None  # Should handle missing data gracefully
    
    # Test with empty match data
    with pytest.raises(Exception):
        await service.get_comprehensive_prediction({})

@pytest.mark.asyncio
async def test_model_weights():
    """Test model weight calculations"""
    service = AIPredictionService()
    
    weights = {
        "gpt4": 0.6,
        "deepseek": 0.4
    }
    
    adjusted_weights = service._calculate_dynamic_weights(
        [("gpt4", {"confidence": 0.8}), ("deepseek", {"confidence": 0.9})],
        weights
    )
    
    assert sum(adjusted_weights.values()) == pytest.approx(1.0)
    assert all(0 <= w <= 1 for w in adjusted_weights.values())

async def test_double_chance_prediction(prediction_service, sample_match_data):
    """Test double chance prediction functionality"""
    prediction = await prediction_service.get_comprehensive_prediction(sample_match_data)
    
    assert "double_chance" in prediction
    dc_pred = prediction["double_chance"]
    
    # Check structure
    assert all(key in dc_pred for key in ["home_draw", "home_away", "draw_away"])
    
    # Check each outcome has required fields
    for outcome in dc_pred.values():
        assert "probability" in outcome
        assert "prediction" in outcome
        assert isinstance(outcome["probability"], float)
        assert isinstance(outcome["prediction"], bool)
        assert 0 <= outcome["probability"] <= 1

async def test_asian_handicap_prediction(prediction_service, sample_match_data):
    """Test Asian handicap prediction functionality"""
    prediction = await prediction_service.get_comprehensive_prediction(sample_match_data)
    
    assert "asian_handicap" in prediction
    ah_pred = prediction["asian_handicap"]
    
    # Check available lines
    valid_lines = [-2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0]
    assert all(float(line) in valid_lines for line in ah_pred.keys())
    
    # Check each line has required fields
    for line_data in ah_pred.values():
        assert "probability" in line_data
        assert "prediction" in line_data
        assert "confidence" in line_data
        assert isinstance(line_data["probability"], float)
        assert isinstance(line_data["prediction"], bool)
        assert isinstance(line_data["confidence"], float)
        assert 0 <= line_data["probability"] <= 1
        assert 0 <= line_data["confidence"] <= 1

async def test_halftime_fulltime_prediction(prediction_service, sample_match_data):
    """Test halftime/fulltime prediction functionality"""
    prediction = await prediction_service.get_comprehensive_prediction(sample_match_data)
    
    assert "halftime_fulltime" in prediction
    htft_pred = prediction["halftime_fulltime"]
    
    # Check structure
    assert "combinations" in htft_pred
    assert "most_likely" in htft_pred
    
    # Check combinations
    valid_combinations = ["HH", "HD", "HA", "DH", "DD", "DA", "AH", "AD", "AA"]
    combinations = htft_pred["combinations"]
    assert all(combo in valid_combinations for combo in combinations.keys())
    
    # Check each combination has required fields
    for combo_data in combinations.values():
        assert "probability" in combo_data
        assert "prediction" in combo_data
        assert isinstance(combo_data["probability"], float)
        assert isinstance(combo_data["prediction"], bool)
        assert 0 <= combo_data["probability"] <= 1
    
    # Check most likely outcome
    most_likely = htft_pred["most_likely"]
    assert "outcome" in most_likely
    assert "probability" in most_likely
    assert most_likely["outcome"] in valid_combinations
    assert isinstance(most_likely["probability"], float)
    assert 0 <= most_likely["probability"] <= 1

async def test_prediction_filtering(prediction_service, sample_match_data):
    """Test prediction filtering functionality"""
    # Test with specific prediction types
    prediction_types = ["double_chance", "asian_handicap"]
    prediction = await prediction_service.get_comprehensive_prediction(
        sample_match_data,
        prediction_types=prediction_types
    )
    
    # Core predictions should always be present
    assert "predicted_outcome" in prediction
    assert "confidence" in prediction
    assert "reasoning" in prediction
    
    # Requested prediction types should be present
    assert "double_chance" in prediction
    assert "asian_handicap" in prediction
    
    # Other prediction types should not be present
    assert "halftime_fulltime" not in prediction

async def test_correlation_analysis(prediction_service, sample_match_data):
    """Test correlation analysis functionality"""
    prediction = await prediction_service.get_comprehensive_prediction(
        sample_match_data,
        include_correlations=True
    )
    
    assert "correlation_analysis" in prediction
    correlations = prediction["correlation_analysis"]
    
    # Check correlation matrix structure
    prediction_types = ["match_outcome", "asian_handicap", "double_chance", "halftime_fulltime"]
    for type1 in prediction_types:
        assert type1 in correlations
        for type2 in prediction_types:
            if type1 != type2:
                assert type2 in correlations[type1]
                correlation = correlations[type1][type2]
                assert isinstance(correlation, float)
                assert -1 <= correlation <= 1

async def test_risk_assessment(prediction_service, sample_match_data):
    """Test risk assessment functionality"""
    prediction = await prediction_service.get_comprehensive_prediction(sample_match_data)
    
    assert "risk_assessment" in prediction
    risk = prediction["risk_assessment"]
    
    # Check risk level is valid
    assert risk in [level.value for level in RiskLevel]
    
    # Test high-risk derby match
    sample_match_data["is_derby"] = True
    derby_prediction = await prediction_service.get_comprehensive_prediction(sample_match_data)
    assert derby_prediction["risk_assessment"] in [RiskLevel.MEDIUM.value, RiskLevel.HIGH.value]

async def test_invalid_inputs(prediction_service):
    """Test handling of invalid inputs"""
    # Test with missing team names
    with pytest.raises(ValueError):
        await prediction_service.get_comprehensive_prediction({
            "competition": "Premier League",
            "attacking_style": "balanced"
        })
    
    # Test with invalid attacking style
    with pytest.raises(ValueError):
        await prediction_service.get_comprehensive_prediction({
            "home_team": "Team A",
            "away_team": "Team B",
            "attacking_style": "invalid_style"
        })
    
    # Test with invalid prediction types
    with pytest.raises(ValueError):
        await prediction_service.get_comprehensive_prediction({
            "home_team": "Team A",
            "away_team": "Team B",
            "prediction_types": ["invalid_type"]
        })

if __name__ == "__main__":
    pytest.main(["-v", "test_ai_prediction.py"]) 