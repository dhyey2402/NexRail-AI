from fastapi import APIRouter, Depends, Query, HTTPException
from app.schemas.weather import WeatherResponse
from app.dependencies import get_weather_service
from app.services.external.weather_service import WeatherService

router = APIRouter(tags=["Weather"])

@router.get(
    "/current", 
    response_model=WeatherResponse, 
    summary="Get current weather",
    description="Fetches current weather conditions including temperature, humidity, visibility, and rainfall based on exact GPS coordinates.",
    responses={
        200: {
            "description": "Successful retrieval of current weather data.",
            "model": WeatherResponse
        },
        400: {
            "description": "Invalid coordinates provided. Latitude or longitude is out of bounds.",
            "content": {
                "application/json": {
                    "example": {"detail": "Latitude must be between -90 and 90"}
                }
            }
        },
        500: {
            "description": "Weather service unavailable.",
            "content": {
                "application/json": {
                    "example": {"detail": "Weather API provider is currently down"}
                }
            }
        }
    }
)
async def get_current_weather(
    lat: float = Query(..., description="Latitude of the location", ge=-90.0, le=90.0, examples=[28.6139]),
    lon: float = Query(..., description="Longitude of the location", ge=-180.0, le=180.0, examples=[77.2090]),
    weather_service: WeatherService = Depends(get_weather_service)
):
    """
    Get current weather conditions based on GPS coordinates.
    """
    try:
        # Call injected WeatherService to retrieve live OpenWeatherMap data (cached in SQLite)
        data = await weather_service.get_current_weather(latitude=lat, longitude=lon)
        return WeatherResponse(**data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error while fetching weather data: {str(e)}")
