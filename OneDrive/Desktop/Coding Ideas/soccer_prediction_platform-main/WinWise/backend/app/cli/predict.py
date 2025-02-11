import asyncio
import argparse
import json
from typing import Dict, Optional, List
from app.services.ai_prediction_service import AIPredictionService, PredictionType, RiskLevel
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress

console = Console()

def format_prediction_output(prediction: Dict, output_format: str = "rich") -> None:
    """Format prediction output for CLI display"""
    if output_format == "json":
        print(json.dumps(prediction, indent=2))
        return

    # Create tables for different prediction types
    main_table = Table(title="Main Prediction", show_header=True, header_style="bold magenta")
    main_table.add_column("Metric", style="cyan")
    main_table.add_column("Value", style="green")
    
    main_table.add_row("Predicted Outcome", prediction["predicted_outcome"])
    main_table.add_row("Score", f"{prediction['score_prediction']['home']} - {prediction['score_prediction']['away']}")
    main_table.add_row("Confidence", f"{prediction['confidence']:.2%}")
    
    # Double Chance table
    if "double_chance" in prediction:
        dc_table = Table(title="Double Chance Predictions", show_header=True, header_style="bold magenta")
        dc_table.add_column("Type", style="cyan")
        dc_table.add_column("Probability", style="green")
        dc_table.add_column("Recommended", style="yellow")
        
        for outcome, data in prediction["double_chance"].items():
            dc_table.add_row(
                outcome.replace("_", " ").title(),
                f"{data['probability']:.2%}",
                "✓" if data["prediction"] else "✗"
            )
    
    # Asian Handicap table
    if "asian_handicap" in prediction:
        ah_table = Table(title="Asian Handicap Predictions", show_header=True, header_style="bold magenta")
        ah_table.add_column("Line", style="cyan")
        ah_table.add_column("Probability", style="green")
        ah_table.add_column("Recommended", style="yellow")
        ah_table.add_column("Confidence", style="blue")
        
        for line, data in prediction["asian_handicap"].items():
            ah_table.add_row(
                str(line),
                f"{data['probability']:.2%}",
                "✓" if data["prediction"] else "✗",
                f"{data['confidence']:.2%}"
            )
    
    # Half Time/Full Time table
    if "halftime_fulltime" in prediction:
        htft_table = Table(title="Half Time/Full Time Predictions", show_header=True, header_style="bold magenta")
        htft_table.add_column("Combination", style="cyan")
        htft_table.add_column("Probability", style="green")
        htft_table.add_column("Recommended", style="yellow")
        
        for combo, data in prediction["halftime_fulltime"]["combinations"].items():
            htft_table.add_row(
                combo,
                f"{data['probability']:.2%}",
                "✓" if data["prediction"] else "✗"
            )
        
        # Add most likely outcome
        most_likely = prediction["halftime_fulltime"]["most_likely"]
        htft_table.add_row(
            "[bold]Most Likely[/bold]",
            f"{most_likely['probability']:.2%}",
            most_likely["outcome"]
        )
    
    # Print all tables
    console = Console()
    console.print(main_table)
    if "double_chance" in prediction:
        console.print(dc_table)
    if "asian_handicap" in prediction:
        console.print(ah_table)
    if "halftime_fulltime" in prediction:
        console.print(htft_table)
    
    # Print additional information
    if prediction.get("reasoning"):
        console.print("\n[bold]Key Reasoning:[/bold]")
        for reason in prediction["reasoning"]:
            console.print(f"• {reason}")
    
    if prediction.get("risk_assessment"):
        console.print(f"\n[bold]Risk Assessment:[/bold] {prediction['risk_assessment']}")

async def get_prediction(
    home_team: str,
    away_team: str,
    competition: str,
    prediction_types: List[str] = ["all"],
    attacking_style: Optional[str] = "balanced",
    is_derby: bool = False,
    match_importance: str = "medium",
    output_format: str = "rich",
    show_correlations: bool = False
) -> None:
    """Get prediction for a match with enhanced prediction types"""
    # Prepare match data
    match_data = {
        "home_team": home_team,
        "away_team": away_team,
        "competition": competition,
        "attacking_style": attacking_style,
        "is_derby": is_derby,
        "match_importance": match_importance
    }
    
    # Initialize AI prediction service
    prediction_service = AIPredictionService()
    
    try:
        with Progress() as progress:
            task = progress.add_task("[cyan]Getting predictions...", total=100)
            
            # Get comprehensive prediction
            prediction = await prediction_service.get_comprehensive_prediction(match_data)
            progress.update(task, advance=50)
            
            if not prediction:
                console.print("[red]Failed to get prediction[/red]")
                return
            
            # Filter prediction types if specified
            if "all" not in prediction_types:
                filtered_prediction = {
                    k: v for k, v in prediction.items()
                    if k in prediction_types or k in ["predicted_outcome", "confidence", "reasoning"]
                }
                prediction = filtered_prediction
            
            progress.update(task, advance=50)
        
        # Format and display prediction
        format_prediction_output(prediction, output_format)
        
        # Show correlations if requested
        if show_correlations and "correlation_analysis" in prediction:
            console.print("\n[bold]Prediction Correlations:[/bold]")
            correlations_table = Table(show_header=True, header_style="bold magenta")
            correlations_table.add_column("Prediction Type 1")
            correlations_table.add_column("Prediction Type 2")
            correlations_table.add_column("Correlation")
            
            for type1, correlations in prediction["correlation_analysis"].items():
                for type2, correlation in correlations.items():
                    correlations_table.add_row(type1, type2, f"{correlation:.2f}")
            
            console.print(correlations_table)
            
    except Exception as e:
        console.print(f"[red]Error getting prediction: {str(e)}[/red]")

def main():
    """Enhanced CLI entry point"""
    parser = argparse.ArgumentParser(description="Get soccer match predictions")
    parser.add_argument("home_team", help="Home team name")
    parser.add_argument("away_team", help="Away team name")
    parser.add_argument("--competition", default="Unknown", help="Competition name")
    parser.add_argument("--prediction-types", nargs="+", default=["all"],
                      help="Specific prediction types to show (default: all)")
    parser.add_argument("--style", default="balanced",
                      choices=["balanced", "attacking", "defensive", "possession", "counter"],
                      help="Team's playing style")
    parser.add_argument("--derby", action="store_true", help="Is this a derby match?")
    parser.add_argument("--importance", default="medium",
                      choices=["low", "medium", "high"],
                      help="Match importance")
    parser.add_argument("--format", default="rich",
                      choices=["rich", "json"],
                      help="Output format")
    parser.add_argument("--show-correlations", action="store_true",
                      help="Show prediction correlations")
    
    args = parser.parse_args()
    
    asyncio.run(get_prediction(
        args.home_team,
        args.away_team,
        args.competition,
        args.prediction_types,
        args.style,
        args.derby,
        args.importance,
        args.format,
        args.show_correlations
    ))

if __name__ == "__main__":
    main() 